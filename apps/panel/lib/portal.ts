import 'server-only';
import { compareIso, formatRangeLong, formatReportNumber, type IsoDate } from '@cuentasbot/shared';
import { cookies } from 'next/headers';
import { supabaseServer } from './supabase';

/**
 * Contractor portal (ADR-061): the data a contractor sees, read with their own session. RLS (own_* policies)
 * keeps every query to their rows; nothing here uses the service role.
 */

type One<T> = T | T[] | null;
const one = <T>(v: One<T>): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);

export type Sb = Awaited<ReturnType<typeof supabaseServer>>;

export interface PortalUser {
  id: string;
  fullName: string;
  phone: string;
  docType: string | null;
  docLast4: string | null;
  docIssuedIn: string | null;
  bankName: string | null;
  bankType: string | null;
  bankLast4: string | null;
  email: string;
}

export interface PortalPerson {
  id: string;
  fullName: string;
  isSelf: boolean;
}

/** The person a gestor picked in the portal (ADR-065); checked against portal_people on every request. */
export const ACTING_COOKIE = 'cf_acting';
export const ACTING_HEADER = 'x-cf-acting';

export interface PortalSession {
  sb: Sb;
  email: string;
  /** Whose accounts the pages show: the contractor, or the person the gestor works for. */
  user: PortalUser | null;
  /** The contractor behind the web account and the people who authorized them (ADR-042). */
  me: PortalPerson | null;
  people: PortalPerson[];
  /** True while a gestor works someone else's accounts. */
  acting: boolean;
}

const USER_COLUMNS =
  'id, full_name, phone_e164, doc_type, doc_number_last4, doc_issued_in, bank_name, bank_account_type, bank_account_last4';

/** The signed-in web account: linked to a contractor (`user`) or not yet (`user` null). */
export async function portalSession(): Promise<PortalSession | null> {
  const base = await supabaseServer();
  const { data } = await base.auth.getUser();
  if (!data.user) return null;
  const email = data.user.email ?? '';
  const { data: rows, error } = await base.rpc('portal_people');
  let people: PortalPerson[] = ((rows ?? []) as { id: string; full_name: string; is_self: boolean }[]).map(
    (r) => ({ id: r.id, fullName: r.full_name, isSelf: r.is_self }),
  );
  if (error) {
    // Before the ADR-065 migration: the contractor alone.
    const { data: u } = await base
      .from('users')
      .select('id, full_name')
      .eq('auth_user_id', data.user.id)
      .is('deleted_at', null)
      .maybeSingle();
    people = u ? [{ id: u.id, fullName: u.full_name || 'Mis cuentas', isSelf: true }] : [];
  }
  const me = people.find((p) => p.isSelf) ?? null;
  if (!me) return { sb: base, email, user: null, me: null, people: [], acting: false };
  const wanted = (await cookies()).get(ACTING_COOKIE)?.value;
  const target = people.find((p) => !p.isSelf && p.id === wanted) ?? me;
  const acting = target.id !== me.id;
  const sb = acting ? await supabaseServer({ [ACTING_HEADER]: target.id }) : base;
  const { data: u } = await sb.from('users').select(USER_COLUMNS).eq('id', target.id).maybeSingle();
  return {
    sb,
    email,
    me,
    people,
    acting,
    user: u
      ? {
          id: u.id,
          fullName: u.full_name || target.fullName || 'Contratista',
          phone: u.phone_e164,
          docType: u.doc_type,
          docLast4: u.doc_number_last4,
          docIssuedIn: u.doc_issued_in,
          bankName: u.bank_name,
          bankType: u.bank_account_type,
          bankLast4: u.bank_account_last4,
          email,
        }
      : null,
  };
}

export interface PortalObligation {
  id: string;
  kind: 'specific' | 'general';
  number: number;
  text: string;
}

export interface PortalPeriod {
  id: string;
  number: number;
  from: IsoDate;
  to: IsoDate;
  status: string;
  amount: number;
  label: string;
}

export interface PortalContract {
  id: string;
  label: string;
  numberFull: string;
  entity: string;
  objectText: string;
  startDate: IsoDate;
  endDate: IsoDate;
  paymentsCount: number;
  obligations: PortalObligation[];
  periods: PortalPeriod[];
  current: PortalPeriod | null;
}

export const todayBogota = (): IsoDate =>
  new Date(Date.now() - 5 * 3600_000).toISOString().slice(0, 10) as IsoDate;

/** The report in course: the first one not delivered that already started, else the next one. */
export function currentPeriod(periods: PortalPeriod[], today = todayBogota()): PortalPeriod | null {
  const open = periods.filter((p) => p.status !== 'delivered');
  return open.find((p) => compareIso(p.from, today) <= 0) ?? open[0] ?? null;
}

export async function listContracts(sb: Sb): Promise<PortalContract[]> {
  const [{ data: rows, error }, { data: entities }] = await Promise.all([
    sb
      .from('contracts')
      .select(
        'id, entity_id, number_full, number, short_label, object_text, start_date, end_date, payments_count, report_number_fmt, obligations(id, kind, number, literal_text), periods(id, report_number, date_from, date_to, status, amount)',
      )
      .order('start_date', { ascending: false }),
    sb.rpc('portal_entities'),
  ]);
  if (error) throw error;
  const names = new Map(
    ((entities ?? []) as { id: string; name: string; short_name: string | null }[]).map((e) => [
      e.id,
      e.short_name || e.name,
    ]),
  );
  return (rows ?? []).map((c) => {
    const fmt = c.report_number_fmt === 'NN-NN' ? 'NN-NN' : 'NN DE NN';
    const periods = ((c.periods ?? []) as Record<string, unknown>[])
      .map((p) => ({
        id: String(p.id),
        number: Number(p.report_number),
        from: String(p.date_from) as IsoDate,
        to: String(p.date_to) as IsoDate,
        status: String(p.status),
        amount: Number(p.amount),
        label: `Informe ${formatReportNumber(Number(p.report_number), c.payments_count, fmt)} · ${formatRangeLong(String(p.date_from) as IsoDate, String(p.date_to) as IsoDate)}`,
      }))
      .sort((a, b) => a.number - b.number);
    const obligations = ((c.obligations ?? []) as Record<string, unknown>[])
      .map((o) => ({
        id: String(o.id),
        kind: o.kind === 'general' ? ('general' as const) : ('specific' as const),
        number: Number(o.number),
        text: String(o.literal_text),
      }))
      .sort((a, b) => (a.kind === b.kind ? a.number - b.number : a.kind === 'specific' ? -1 : 1));
    return {
      id: c.id,
      label: c.short_label || c.number_full || c.number,
      numberFull: c.number_full || c.number,
      entity: names.get(c.entity_id) ?? '',
      objectText: c.object_text,
      startDate: c.start_date,
      endDate: c.end_date,
      paymentsCount: c.payments_count,
      obligations,
      periods,
      current: currentPeriod(periods),
    };
  });
}

/** Text the chat saves for photos sent without a description. */
export const PHOTO_RECORD_PREFIX = 'Registro fotográfico de la obligación';

export interface PortalPhoto {
  id: string;
  path: string;
  url: string | null;
}

export interface PortalNote {
  id: string;
  date: IsoDate;
  text: string;
  photoOnly: boolean;
  obligationId: string | null;
  extraIds: string[];
  photos: PortalPhoto[];
}

export async function listNotes(sb: Sb, contractId: string, p: PortalPeriod): Promise<PortalNote[]> {
  const { data, error } = await sb
    .from('activity_notes')
    .select(
      'id, activity_date, text, transcript, confirmed_obligation_id, extra_obligation_ids, evidences(id, file_path, sort_order)',
    )
    .eq('contract_id', contractId)
    .gte('activity_date', p.from)
    .lte('activity_date', p.to)
    .order('activity_date')
    .order('created_at');
  if (error) throw error;
  const paths = (data ?? []).flatMap((n) =>
    ((n.evidences ?? []) as { file_path: string }[]).map((e) => e.file_path),
  );
  const urls = await signedUrls(sb, 'evidences', paths);
  return (data ?? []).map((n) => {
    const text = String(n.text ?? n.transcript ?? '');
    return {
      id: n.id,
      date: n.activity_date,
      text,
      photoOnly: text.startsWith(PHOTO_RECORD_PREFIX),
      obligationId: n.confirmed_obligation_id,
      extraIds: (n.extra_obligation_ids ?? []) as string[],
      photos: ((n.evidences ?? []) as { id: string; file_path: string; sort_order: number }[])
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((e) => ({ id: e.id, path: e.file_path, url: urls.get(e.file_path) ?? null })),
    };
  });
}

export async function signedUrls(
  sb: Sb,
  bucket: string,
  paths: string[],
  seconds = 3600,
): Promise<Map<string, string>> {
  if (!paths.length) return new Map();
  const { data } = await sb.storage.from(bucket).createSignedUrls(paths, seconds);
  return new Map(
    (data ?? []).filter((d) => d.signedUrl && d.path).map((d) => [d.path as string, d.signedUrl as string]),
  );
}

export interface PortalSupportType {
  code: string;
  label: string;
  required: boolean;
  frequency: string;
  maxAgeDays: number | null;
  officialUrl: string | null;
  instructions: string | null;
  stage: string;
}

export interface PortalSupport {
  id: string;
  code: string;
  filename: string;
  path: string;
  issuedOn: IsoDate | null;
  receivedAt: string;
  url: string | null;
}

/** Codes the chat keeps that are not certificates the contractor manages from the supports page. */
export const INTERNAL_SUPPORTS = new Set(['FIRMA', 'COMPROBANTE_PAGO', 'INFORME_ANTERIOR']);

export async function listSupportTypes(sb: Sb): Promise<PortalSupportType[]> {
  const { data, error } = await sb
    .from('support_types')
    .select('code, label, required, frequency, max_age_days, official_url, instructions, stage, bundle_order')
    .order('bundle_order');
  if (error) throw error;
  const seen = new Set<string>();
  return (data ?? [])
    .filter((t) => {
      // A contractor with contracts in two entities sees each support once.
      if (seen.has(t.code)) return false;
      seen.add(t.code);
      return true;
    })
    .map((t) => ({
      code: t.code,
      label: t.label,
      required: t.required !== false,
      frequency: t.frequency,
      maxAgeDays: t.max_age_days,
      officialUrl: t.official_url,
      instructions: t.instructions,
      stage: t.stage,
    }));
}

export async function listSupports(sb: Sb): Promise<PortalSupport[]> {
  const { data, error } = await sb
    .from('supports')
    .select('id, code, filename, original_path, issued_on, created_at, status')
    .neq('status', 'rejected')
    .order('created_at', { ascending: false });
  if (error) throw error;
  const urls = await signedUrls(
    sb,
    'supports',
    (data ?? []).map((s) => s.original_path),
  );
  return (data ?? []).map((s) => ({
    id: s.id,
    code: s.code ?? '',
    filename: s.filename || 'documento',
    path: s.original_path,
    issuedOn: s.issued_on,
    receivedAt: s.created_at,
    url: urls.get(s.original_path) ?? null,
  }));
}

/** Until when a certificate counts (issue date, or the day it arrived, plus the entity's maximum age). */
export function validUntil(t: PortalSupportType, s: PortalSupport): IsoDate | null {
  if (!t.maxAgeDays) return null;
  const from = (s.issuedOn ?? s.receivedAt.slice(0, 10)) as IsoDate;
  const d = new Date(`${from}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + t.maxAgeDays);
  return d.toISOString().slice(0, 10) as IsoDate;
}

export interface PortalCharge {
  id: string;
  concept: string;
  amount: number;
  status: string;
  method: string | null;
  reference: string;
  createdAt: string;
  transferSentAt: string | null;
}

export async function listCharges(sb: Sb): Promise<PortalCharge[]> {
  const { data, error } = await sb
    .from('charges')
    .select(
      'id, product, amount, status, method, reference, raw, created_at, contracts(number_full), periods(report_number)',
    )
    .neq('status', 'cancelled')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((c) => {
    const contract = one(c.contracts as One<{ number_full: string | null }>)?.number_full ?? '';
    const report = one(c.periods as One<{ report_number: number }>)?.report_number;
    return {
      id: c.id,
      concept:
        c.product === 'setup'
          ? `Configuración del contrato ${contract}`
          : `Informe ${report ?? ''} · contrato ${contract}`,
      amount: Number(c.amount),
      status: c.status,
      method: c.method,
      reference: c.reference,
      createdAt: c.created_at,
      transferSentAt: (c.raw as { transfer?: { sent_at?: string } } | null)?.transfer?.sent_at ?? null,
    };
  });
}

export interface PortalBilling {
  prices: { setup?: number; report?: number } | null;
  transfer: {
    bank: string;
    accountType: string;
    accountNumber: string;
    holder: string;
    holderDoc: string;
  } | null;
}

export async function billing(sb: Sb): Promise<PortalBilling> {
  const { data } = await sb.rpc('portal_billing');
  const v = (data ?? {}) as Partial<PortalBilling>;
  const t = v.transfer;
  return {
    prices: v.prices ?? null,
    transfer: t?.bank && t.accountNumber && t.holder ? t : null,
  };
}

export interface PortalPackage {
  name: string;
  createdAt: string;
  url: string | null;
}

/** Packages Pascal delivered in the last 30 days (outputs/packages/<user>-<uuid>/<file>.zip). */
export async function listPackages(sb: Sb, userId: string): Promise<PortalPackage[]> {
  const bucket = sb.storage.from('outputs');
  const { data: dirs } = await bucket.list('packages', { limit: 100, search: `${userId}-` });
  const out: PortalPackage[] = [];
  for (const d of (dirs ?? []).filter((x) => x.name.startsWith(`${userId}-`))) {
    const { data: files } = await bucket.list(`packages/${d.name}`, { limit: 10 });
    for (const f of files ?? []) {
      const path = `packages/${d.name}/${f.name}`;
      const { data: s } = await bucket.createSignedUrl(path, 3600, { download: f.name });
      out.push({ name: f.name, createdAt: f.created_at ?? '', url: s?.signedUrl ?? null });
    }
  }
  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export interface PortalDraft {
  obligationId: string;
  text: string;
  status: 'pending' | 'needs_input' | 'proposed' | 'default' | 'approved' | 'not_applicable';
  /** Written by the contractor on the web (or in the chat's edit). */
  own: boolean;
}

export async function listDrafts(sb: Sb, periodId: string): Promise<PortalDraft[]> {
  const { data, error } = await sb
    .from('drafts')
    .select('obligation_id, final_text, user_text, status')
    .eq('period_id', periodId)
    .eq('version', 1);
  if (error) throw error;
  return (data ?? []).map((d) => ({
    obligationId: d.obligation_id,
    text: String(d.final_text ?? ''),
    status: d.status,
    own: d.user_text != null,
  }));
}

export const PERIOD_STATUS: Record<string, string> = {
  scheduled: 'Programada',
  collecting: 'Registrando actividades',
  ready_to_draft: 'Lista para el borrador',
  draft_review: 'Borrador en revisión',
  approved: 'Borrador aprobado',
  generating: 'Generando documentos',
  delivered: 'Entregada',
  blocked_payment: 'Pendiente de pago',
};

/** «2026-09-14» → «14 sep 2026», without time zone shifts. */
export function shortDate(d: IsoDate): string {
  const [y, m, day] = d.split('-').map(Number);
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${day} ${months[(m ?? 1) - 1]} ${y}`;
}

export const moment = (iso: string) =>
  new Date(iso).toLocaleString('es-CO', {
    timeZone: 'America/Bogota',
    dateStyle: 'medium',
    timeStyle: 'short',
  });
