import 'server-only';
import { supabaseConfigured, supabaseServer } from './supabase';

/** Settings a new entity starts with; every value can be changed in the panel. */
export const DEFAULT_ENTITY_SETTINGS = {
  proration: 'commercial_30',
  pila: { contribution_month: 'current', payment_deadline_day: null },
  ibc: { pct: 0.4, min_smmlv: 1, max_smmlv: 25, blocking: false },
  certificate_max_age_days: 30,
  background_check_date: 'report_date',
  balance: 'paid_prior_accrued_current',
  meeting: { place: '', start: '', end: '' },
  default_activity_text: 'Actividad cumplida.',
  generate_with_missing: false,
  goal_alert_threshold_pct: 70,
  package: {
    period_folder: 'CUENTAS {MES} {AÑO}',
    upload_folder: 'DOCUMENTOS A CARGAR',
    zip_name: 'cuenta.zip',
  },
  contract_defaults: { supervisor: null },
};

export interface EntityDetail {
  id: string;
  name: string;
  shortName: string;
  nit: string;
  municipality: string;
  department: string;
  status: string;
  settings: Record<string, unknown>;
}

export interface SupportTypeRow {
  id: string;
  code: string;
  label: string;
  required: boolean;
  frequency: string;
  maxAgeDays: number | null;
  bundle: string | null;
  bundleOrder: number | null;
  officialUrl: string | null;
  instructions: string | null;
  stage: string;
}

export interface RegistryImportRow {
  id: number;
  filename: string;
  status: string;
  rowCount: number;
  inserted: number | null;
  updated: number | null;
  error: string | null;
  createdAt: string;
}

export interface InstitutionRequestRow {
  id: string;
  institutionName: string;
  contractor: string;
  phone: string;
  firstForInstitution: boolean;
  status: string;
  createdAt: string;
  modelUrl: string | null;
  contractUrl: string | null;
}

export function adminAvailable(): boolean {
  return supabaseConfigured();
}

export async function getEntityDetail(id: string): Promise<EntityDetail | null> {
  const sb = await supabaseServer();
  const { data, error } = await sb.from('entities').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    name: data.name,
    shortName: data.short_name,
    nit: data.nit ?? '',
    municipality: data.municipality ?? '',
    department: data.department ?? '',
    status: data.status,
    settings: (data.settings ?? {}) as Record<string, unknown>,
  };
}

export async function listSupportTypes(entityId: string): Promise<SupportTypeRow[]> {
  const sb = await supabaseServer();
  const { data, error } = await sb
    .from('support_types')
    .select('*')
    .eq('entity_id', entityId)
    .order('stage')
    .order('bundle', { nullsFirst: true })
    .order('bundle_order', { nullsFirst: true })
    .order('code');
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    code: r.code,
    label: r.label,
    required: r.required,
    frequency: r.frequency,
    maxAgeDays: r.max_age_days,
    bundle: r.bundle,
    bundleOrder: r.bundle_order,
    officialUrl: r.official_url,
    instructions: r.instructions,
    stage: r.stage,
  }));
}

export async function listRegistryImports(
  entityId: string,
): Promise<{ imports: RegistryImportRow[]; total: number }> {
  const sb = await supabaseServer();
  const [{ data, error }, { count }] = await Promise.all([
    sb
      .from('registry_imports')
      .select('id, filename, status, row_count, inserted, updated, error, created_at')
      .eq('entity_id', entityId)
      .order('id', { ascending: false })
      .limit(12),
    sb
      .from('entity_contract_registry')
      .select('id', { count: 'exact', head: true })
      .eq('entity_id', entityId),
  ]);
  if (error) throw error;
  return {
    total: count ?? 0,
    imports: (data ?? []).map((r) => ({
      id: r.id,
      filename: r.filename,
      status: r.status,
      rowCount: r.row_count,
      inserted: r.inserted,
      updated: r.updated,
      error: r.error,
      createdAt: r.created_at,
    })),
  };
}

const maskPhone = (p: string) => (p ? `${p.slice(0, 5)}*****${p.slice(-2)}` : '');

export async function listInstitutionRequests(): Promise<InstitutionRequestRow[]> {
  const sb = await supabaseServer();
  const { data, error } = await sb
    .from('institution_requests')
    .select(
      'id, institution_name, first_for_institution, status, created_at, users(full_name, phone_e164), model:supports!institution_requests_model_support_id_fkey(original_path), contract:supports!institution_requests_contract_support_id_fkey(original_path)',
    )
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  const sign = async (path: string | null | undefined) => {
    if (!path) return null;
    const { data: s } = await sb.storage.from('supports').createSignedUrl(path, 600);
    return s?.signedUrl ?? null;
  };
  type One<T> = T | T[] | null;
  const one = <T>(v: One<T>): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);
  return Promise.all(
    (data ?? []).map(async (r) => {
      const u = one(r.users as One<{ full_name: string | null; phone_e164: string }>);
      return {
        id: r.id,
        institutionName: r.institution_name,
        contractor: u?.full_name || 'Sin nombre aún',
        phone: maskPhone(u?.phone_e164 ?? ''),
        firstForInstitution: r.first_for_institution,
        status: r.status,
        createdAt: r.created_at,
        modelUrl: await sign(one(r.model as One<{ original_path: string }>)?.original_path),
        contractUrl: await sign(one(r.contract as One<{ original_path: string }>)?.original_path),
      };
    }),
  );
}

export interface AllyRow {
  id: string;
  code: string;
  contractor: string;
  phone: string;
  institution: string;
  level: number;
  referrals: number;
  freeReports: number;
  premium: boolean;
  bonusStatus: string;
  bonusReference: string | null;
  lastLevelAt: string | null;
}

export async function listAllies(): Promise<AllyRow[]> {
  const sb = await supabaseServer();
  const { data, error } = await sb
    .from('allies')
    .select(
      'id, code, level, premium_at, bonus_status, bonus_reference, user_id, users!allies_user_id_fkey(full_name, phone_e164), institution_requests(institution_name), entities(short_name), ally_levels(level, granted_at)',
    )
    .order('level', { ascending: false });
  if (error) throw error;
  type One<T> = T | T[] | null;
  const one = <T>(v: One<T>): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);
  const ids = (data ?? []).map((a) => a.id);
  const { data: refs } = ids.length
    ? await sb.from('users').select('referred_by_ally').in('referred_by_ally', ids)
    : { data: [] as { referred_by_ally: string }[] };
  const userIds = (data ?? []).map((a) => a.user_id);
  const { data: grants } = userIds.length
    ? await sb
        .from('free_report_grants')
        .select('user_id')
        .in('user_id', userIds)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
    : { data: [] as { user_id: string }[] };
  return (data ?? []).map((a) => {
    const u = one(a.users as One<{ full_name: string | null; phone_e164: string }>);
    const levels = (a.ally_levels ?? []) as { level: number; granted_at: string }[];
    return {
      id: a.id,
      code: a.code,
      contractor: u?.full_name || 'Sin nombre aún',
      phone: maskPhone(u?.phone_e164 ?? ''),
      institution:
        one(a.entities as One<{ short_name: string }>)?.short_name ??
        one(a.institution_requests as One<{ institution_name: string }>)?.institution_name ??
        '—',
      level: a.level,
      referrals: (refs ?? []).filter((r) => r.referred_by_ally === a.id).length,
      freeReports: (grants ?? []).filter((g) => g.user_id === a.user_id).length,
      premium: Boolean(a.premium_at),
      bonusStatus: a.bonus_status,
      bonusReference: a.bonus_reference,
      lastLevelAt: levels.sort((x, y) => y.level - x.level)[0]?.granted_at ?? null,
    };
  });
}
