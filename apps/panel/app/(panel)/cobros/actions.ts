'use server';
import { randomInt } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { type BillingSettingsRow, billingSettings } from '@/lib/billing';
import { supabaseServer } from '@/lib/supabase';

const s = (form: FormData, k: string) => String(form.get(k) ?? '').trim();
// No 0/O, 1/I/L: codes are read aloud and typed on a phone.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export async function setBillingMode(form: FormData): Promise<void> {
  const mode = s(form, 'mode') === 'live' ? 'live' : 'pilot';
  const setup = Number(s(form, 'setup'));
  const report = Number(s(form, 'report'));
  if (!(setup > 0 && report > 0)) throw new Error('Los precios deben ser mayores que cero.');
  const { transfer } = await billingSettings();
  await saveBilling({ mode, prices: { setup, report }, transfer });
}

async function saveBilling(value: BillingSettingsRow): Promise<void> {
  const sb = await supabaseServer();
  const { error } = await sb.from('system_settings').upsert({ key: 'billing', value }, { onConflict: 'key' });
  if (error) throw new Error(`No pude guardar: ${error.message}`);
  revalidatePath('/cobros');
}

/** Account that receives transfers (ADR-055); empty number: transfers are no longer offered. */
export async function setTransferAccount(form: FormData): Promise<void> {
  const accountNumber = s(form, 'accountNumber').replace(/[\s.-]/g, '');
  const current = await billingSettings();
  const transfer = accountNumber
    ? {
        bank: s(form, 'bank').toUpperCase(),
        accountType: s(form, 'accountType') === 'corriente' ? ('corriente' as const) : ('ahorros' as const),
        accountNumber,
        holder: s(form, 'holder'),
        holderDoc: s(form, 'holderDoc'),
      }
    : null;
  if (transfer && !(transfer.bank && transfer.holder))
    throw new Error('Escribe el banco y el titular de la cuenta.');
  await saveBilling({ ...current, transfer });
}

/** Transfer found (confirm) or not (reject) in the bank: the worker delivers or tells the contractor. */
export async function reviewTransfer(form: FormData): Promise<void> {
  const action = s(form, 'action') === 'confirm' ? 'confirm' : 'reject';
  const sb = await supabaseServer();
  const { error } = await sb.rpc('transfer_review', { p_charge: s(form, 'chargeId'), p_action: action });
  if (error) throw new Error(`No pude registrar la decisión: ${error.message}`);
  revalidatePath('/cobros');
}

export interface CashCodeState {
  code?: string;
  error?: string;
}

/** Cash payment received: a code tied to the contractor, for one service, valid 30 days. */
export async function createCashCode(_prev: CashCodeState, form: FormData): Promise<CashCodeState> {
  const userId = s(form, 'userId');
  const product = s(form, 'product') === 'setup' ? 'setup' : 'report';
  if (!userId) return { error: 'Elige el contratista.' };
  const { prices } = await billingSettings();
  const amount = product === 'setup' ? prices.setup : prices.report;
  const sb = await supabaseServer();
  const { data: auth } = await sb.auth.getUser();
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = Array.from({ length: 8 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
    const { error } = await sb.from('cash_codes').insert({
      code,
      user_id: userId,
      product,
      amount,
      created_by: auth.user?.id ?? null,
    });
    if (!error) {
      revalidatePath('/cobros');
      return { code: `${code.slice(0, 4)}-${code.slice(4)}` };
    }
    if (error.code !== '23505') return { error: `No pude crear el código: ${error.message}` };
  }
  return { error: 'No pude generar un código único; intenta de nuevo.' };
}

export async function closeTicket(form: FormData): Promise<void> {
  const sb = await supabaseServer();
  const { error } = await sb
    .from('support_tickets')
    .update({ status: 'closed', closed_at: new Date().toISOString() })
    .eq('id', s(form, 'id'));
  if (error) throw new Error(`No pude cerrar la solicitud: ${error.message}`);
  revalidatePath('/');
}
