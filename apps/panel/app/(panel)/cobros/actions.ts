'use server';
import { randomInt } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { billingSettings } from '@/lib/billing';
import { supabaseServer } from '@/lib/supabase';

const s = (form: FormData, k: string) => String(form.get(k) ?? '').trim();
// No 0/O, 1/I/L: codes are read aloud and typed on a phone.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export async function setBillingMode(form: FormData): Promise<void> {
  const mode = s(form, 'mode') === 'live' ? 'live' : 'pilot';
  const setup = Number(s(form, 'setup'));
  const report = Number(s(form, 'report'));
  if (!(setup > 0 && report > 0)) throw new Error('Los precios deben ser mayores que cero.');
  const sb = await supabaseServer();
  const { error } = await sb
    .from('system_settings')
    .upsert({ key: 'billing', value: { mode, prices: { setup, report } } }, { onConflict: 'key' });
  if (error) throw new Error(`No pude guardar: ${error.message}`);
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
