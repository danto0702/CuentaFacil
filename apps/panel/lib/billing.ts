import 'server-only';
import { supabaseServer } from './supabase';

export interface TransferAccountRow {
  bank: string;
  accountType: 'ahorros' | 'corriente';
  accountNumber: string;
  holder: string;
  holderDoc: string;
}

export interface BillingSettingsRow {
  mode: 'pilot' | 'live';
  prices: { setup: number; report: number };
  /** Account that receives transfers (ADR-055); null: Pascal does not offer them. */
  transfer: TransferAccountRow | null;
}

/** Transfer receipt waiting for the owner (ADR-055). */
export interface PendingTransferRow {
  chargeId: string;
  contractor: string;
  phone: string;
  concept: string;
  amount: number;
  reference: string;
  sentAt: string;
  /** Signed link to the receipt, valid 10 minutes. */
  receiptUrl: string | null;
}

export interface ChargeRow {
  id: string;
  contractor: string;
  contract: string;
  product: 'setup' | 'report';
  report: number | null;
  amount: number;
  status: string;
  method: string | null;
  reference: string;
  createdAt: string;
}

export interface CashCodeRow {
  code: string;
  contractor: string;
  product: 'setup' | 'report';
  amount: number;
  expiresAt: string;
  usedAt: string | null;
}

export interface ContractorOption {
  id: string;
  name: string;
}

type One<T> = T | T[] | null;
const one = <T>(v: One<T>): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);

export async function billingSettings(): Promise<BillingSettingsRow> {
  const sb = await supabaseServer();
  const { data } = await sb.from('system_settings').select('value').eq('key', 'billing').maybeSingle();
  const v = (data?.value ?? {}) as Partial<BillingSettingsRow>;
  const t = v.transfer;
  return {
    mode: v.mode === 'live' ? 'live' : 'pilot',
    prices: { setup: Number(v.prices?.setup ?? 15_000), report: Number(v.prices?.report ?? 50_000) },
    transfer:
      t?.bank && t.accountNumber && t.holder
        ? {
            bank: t.bank,
            accountType: t.accountType === 'corriente' ? 'corriente' : 'ahorros',
            accountNumber: t.accountNumber,
            holder: t.holder,
            holderDoc: t.holderDoc ?? '',
          }
        : null,
  };
}

/** Pending charges with a transfer receipt, oldest first. */
export async function listPendingTransfers(): Promise<PendingTransferRow[]> {
  const sb = await supabaseServer();
  const { data, error } = await sb
    .from('charges')
    .select(
      'id, product, amount, reference, raw, users(full_name, phone_e164), contracts(number_full), periods(report_number)',
    )
    .eq('status', 'pending')
    .not('raw->transfer', 'is', null);
  if (error) throw error;
  const rows = await Promise.all(
    (data ?? []).map(async (c) => {
      const t = (c.raw as { transfer?: { support_id: string; sent_at: string } } | null)?.transfer;
      if (!t) return null;
      const u = one(c.users as One<{ full_name: string | null; phone_e164: string }>);
      const report = one(c.periods as One<{ report_number: number }>)?.report_number;
      const contract = one(c.contracts as One<{ number_full: string }>)?.number_full ?? '—';
      const { data: s } = await sb
        .from('supports')
        .select('original_path')
        .eq('id', t.support_id)
        .maybeSingle();
      const signed = s?.original_path
        ? (await sb.storage.from('supports').createSignedUrl(s.original_path, 600)).data
        : null;
      return {
        chargeId: c.id,
        contractor: u?.full_name || 'Sin nombre aún',
        phone: u?.phone_e164 ?? '',
        concept: `${c.product === 'setup' ? 'Configuración' : `Informe ${report ?? ''}`} · ${contract}`,
        amount: Number(c.amount),
        reference: c.reference,
        sentAt: t.sent_at,
        receiptUrl: signed?.signedUrl ?? null,
      };
    }),
  );
  return rows
    .filter((r): r is PendingTransferRow => r !== null)
    .sort((a, b) => a.sentAt.localeCompare(b.sentAt));
}

export async function listCharges(): Promise<ChargeRow[]> {
  const sb = await supabaseServer();
  const { data, error } = await sb
    .from('charges')
    .select(
      'id, product, amount, status, method, reference, created_at, users(full_name), contracts(number_full), periods(report_number)',
    )
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []).map((c) => ({
    id: c.id,
    contractor: one(c.users as One<{ full_name: string | null }>)?.full_name ?? '—',
    contract: one(c.contracts as One<{ number_full: string }>)?.number_full ?? '—',
    product: c.product,
    report: one(c.periods as One<{ report_number: number }>)?.report_number ?? null,
    amount: Number(c.amount),
    status: c.status,
    method: c.method,
    reference: c.reference,
    createdAt: c.created_at,
  }));
}

export async function listCashCodes(): Promise<CashCodeRow[]> {
  const sb = await supabaseServer();
  const { data, error } = await sb
    .from('cash_codes')
    .select('code, product, amount, expires_at, used_at, users(full_name)')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []).map((c) => ({
    code: c.code,
    contractor: one(c.users as One<{ full_name: string | null }>)?.full_name ?? '—',
    product: c.product,
    amount: Number(c.amount),
    expiresAt: c.expires_at,
    usedAt: c.used_at,
  }));
}

export async function contractorOptions(): Promise<ContractorOption[]> {
  const sb = await supabaseServer();
  const { data, error } = await sb
    .from('users')
    .select('id, full_name, phone_e164')
    .is('deleted_at', null)
    .order('full_name');
  if (error) throw error;
  return (data ?? []).map((u) => ({
    id: u.id,
    name: u.full_name || `Sin nombre (${String(u.phone_e164).slice(-4)})`,
  }));
}

/** "K7M4Q2P9" → "K7M4-Q2P9". */
export const showCode = (c: string) => `${c.slice(0, 4)}-${c.slice(4)}`;

export interface TicketRow {
  id: string;
  contractor: string;
  phone: string;
  subject: string;
  createdAt: string;
}

/** Open requests to talk with a person (soporte, cómo pagar). */
export async function listOpenTickets(): Promise<TicketRow[]> {
  const sb = await supabaseServer();
  const { data, error } = await sb
    .from('support_tickets')
    .select('id, subject, created_at, users(full_name, phone_e164)')
    .eq('status', 'open')
    .order('created_at');
  if (error) throw error;
  return (data ?? []).map((t) => {
    const u = one(t.users as One<{ full_name: string | null; phone_e164: string }>);
    return {
      id: t.id,
      contractor: u?.full_name || 'Sin nombre aún',
      phone: u?.phone_e164 ?? '',
      subject: t.subject,
      createdAt: t.created_at,
    };
  });
}
