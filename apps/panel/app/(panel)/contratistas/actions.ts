'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase';
import { adminAuthConfigured, supabaseAdmin } from '@/lib/supabase-admin';

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

// ---------------------------------------------------------------------------
// Portal access assigned by the superadmin (ADR-062): e-mail and password, no WhatsApp code
// ---------------------------------------------------------------------------
async function requireSuperadmin(back: string): Promise<void> {
  const sb = await supabaseServer();
  const { data } = await sb.auth.getUser();
  const { data: staff } = data.user
    ? await sb.from('staff_members').select('role').eq('auth_user_id', data.user.id).maybeSingle()
    : { data: null };
  if (staff?.role !== 'superadmin')
    redirect(
      `${back}?msg=${encodeURIComponent('Solo el superadmin puede asignar accesos a cuenta.pascalia.lat.')}`,
    );
  if (!adminAuthConfigured())
    redirect(
      `${back}?msg=${encodeURIComponent('Falta la variable SUPABASE_SERVICE_ROLE_KEY en el servicio del panel (Railway).')}`,
    );
}

function say(back: string, text: string): never {
  redirect(`${back}?msg=${encodeURIComponent(text)}`);
}

/** Creates (or updates) the contractor's web access with the e-mail and password the superadmin assigns. */
export async function setPortalAccess(form: FormData): Promise<void> {
  const userId = s(form, 'userId');
  const back = `/contratistas/${userId}`;
  await requireSuperadmin(back);
  const email = s(form, 'email').toLowerCase();
  const password = String(form.get('password') ?? '');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) say(back, 'Escribe un correo válido.');
  if (password.length < 8) say(back, 'La contraseña debe tener al menos 8 caracteres.');
  const admin = supabaseAdmin();
  const { data: user } = await admin.from('users').select('id, auth_user_id').eq('id', userId).single();
  if (!user) say(back, 'No encontré al contratista.');
  if (user.auth_user_id) {
    // Already has access: new e-mail and/or password for the same account.
    const { error } = await admin.auth.admin.updateUserById(user.auth_user_id, {
      email,
      password,
      email_confirm: true,
    });
    if (error) say(back, `No pude cambiar el acceso: ${error.message}`);
    revalidatePath(back);
    say(
      back,
      `Listo: acceso actualizado. Ya puede entrar a cuenta.pascalia.lat con ${email} y la nueva contraseña.`,
    );
  }
  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { portal_access: 'assigned' },
  });
  if (error || !created.user)
    say(
      back,
      /registered|exists/i.test(error?.message ?? '')
        ? 'Ese correo ya tiene una cuenta (de otra persona o del equipo). Usa otro correo.'
        : `No pude crear el acceso: ${error?.message}`,
    );
  const { error: linkError } = await admin
    .from('users')
    .update({ auth_user_id: created.user.id })
    .eq('id', userId);
  if (linkError) {
    await admin.auth.admin.deleteUser(created.user.id);
    say(back, `No pude vincular el acceso: ${linkError.message}`);
  }
  revalidatePath(back);
  say(back, `Listo: ya puede entrar a cuenta.pascalia.lat con ${email} y la contraseña que le asignaste.`);
}

/** Removes the web access: the account is deleted and the contractor keeps working by WhatsApp. */
export async function removePortalAccess(form: FormData): Promise<void> {
  const userId = s(form, 'userId');
  const back = `/contratistas/${userId}`;
  await requireSuperadmin(back);
  const admin = supabaseAdmin();
  const { data: user } = await admin.from('users').select('auth_user_id').eq('id', userId).single();
  const authId = user?.auth_user_id;
  if (!authId) say(back, 'No tenía acceso a cuenta.pascalia.lat.');
  await admin.from('users').update({ auth_user_id: null }).eq('id', userId);
  const { data: staff } = await admin
    .from('staff_members')
    .select('auth_user_id')
    .eq('auth_user_id', authId)
    .maybeSingle();
  if (!staff) await admin.auth.admin.deleteUser(authId);
  revalidatePath(back);
  say(back, 'Acceso quitado. Sigue usando a Pascal por WhatsApp como siempre.');
}
