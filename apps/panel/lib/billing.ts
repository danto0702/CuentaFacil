import 'server-only';
import { supabaseServer } from './supabase';

export interface BillingSettingsRow {
  mode: 'pilot' | 'live';
  prices: { setup: number; report: number };
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
  return {
    mode: v.mode === 'live' ? 'live' : 'pilot',
    prices: { setup: Number(v.prices?.setup ?? 15_000), report: Number(v.prices?.report ?? 50_000) },
  };
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
