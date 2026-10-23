'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase';

const s = (form: FormData, k: string) => String(form.get(k) ?? '').trim();

/** Obligations with notes, evidences or drafts are kept: removing them would orphan that history. */
async function usedObligations(ids: string[]): Promise<Set<string>> {
  const sb = await supabaseServer();
  const [a, b, e, c, d] = await Promise.all([
    sb.from('activity_notes').select('suggested_obligation_id').in('suggested_obligation_id', ids),
    sb.from('activity_notes').select('confirmed_obligation_id').in('confirmed_obligation_id', ids),
    // Also the activities added to it as «Otra obligación».
    sb.from('activity_notes').select('extra_obligation_ids').overlaps('extra_obligation_ids', ids),
    sb.from('drafts').select('obligation_id').in('obligation_id', ids),
    sb.from('evidences').select('obligation_id').in('obligation_id', ids),
  ]);
  if (a.error || b.error || e.error || c.error || d.error)
    throw new Error('No pude revisar si las obligaciones tienen actividades.');
  return new Set(
    [
      ...(a.data ?? []).map((r) => r.suggested_obligation_id),
      ...(b.data ?? []).map((r) => r.confirmed_obligation_id),
      ...(e.data ?? []).flatMap((r) => (r.extra_obligation_ids ?? []) as string[]),
      ...(c.data ?? []).map((r) => r.obligation_id),
      ...(d.data ?? []).map((r) => r.obligation_id),
    ].filter(Boolean),
  );
}

async function remove(userId: string, contractId: string, ids: string[]): Promise<never> {
  const back = `/contratistas/${userId}`;
  if (!ids.length) redirect(`${back}?msg=${encodeURIComponent('No hay obligaciones para quitar.')}`);
  const used = await usedObligations(ids);
  const free = ids.filter((id) => !used.has(id));
  if (free.length) {
    const sb = await supabaseServer();
    const { error } = await sb.from('obligations').delete().in('id', free).eq('contract_id', contractId);
    if (error)
      redirect(`${back}?msg=${encodeURIComponent(`No pude quitar las obligaciones: ${error.message}`)}`);
  }
  revalidatePath(back);
  const kept = ids.length - free.length;
  redirect(
    `${back}?msg=${encodeURIComponent(
      `Quité ${free.length} obligación(es).${kept ? ` ${kept} tiene(n) notas o borradores y no se quitaron: reasigna esas notas primero.` : ''}`,
    )}`,
  );
}

export async function deleteObligation(form: FormData): Promise<void> {
  await remove(s(form, 'userId'), s(form, 'contractId'), [s(form, 'id')]);
}

export async function deleteGeneralObligations(form: FormData): Promise<void> {
  const contractId = s(form, 'contractId');
  const sb = await supabaseServer();
  const { data } = await sb
    .from('obligations')
    .select('id')
    .eq('contract_id', contractId)
    .eq('kind', 'general');
  await remove(
    s(form, 'userId'),
    contractId,
    (data ?? []).map((r) => r.id),
  );
}

/** Message from the owner that Pascal delivers in the contractor's chat (ADR-057). */
export async function sendStaffMessage(form: FormData): Promise<void> {
  const userId = s(form, 'userId');
  const text = s(form, 'text');
  const back = `/contratistas/${userId}`;
  if (!text) redirect(`${back}?msg=${encodeURIComponent('Escribe el mensaje antes de enviarlo.')}`);
  const sb = await supabaseServer();
  const { error } = await sb.rpc('staff_message', { p_user: userId, p_text: text });
  if (error) redirect(`${back}?msg=${encodeURIComponent(`No pude enviar el mensaje: ${error.message}`)}`);
  redirect(
    `${back}?msg=${encodeURIComponent('Listo: Pascal entrega tu mensaje en su conversación en unos segundos.')}`,
  );
}
