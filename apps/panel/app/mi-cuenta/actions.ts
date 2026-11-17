'use server';
import { createHash, randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { listCharges, listContracts, portalSession } from '@/lib/portal';
import { supabaseServer } from '@/lib/supabase';
import { checkoutUrl, wompiConfigured } from '@/lib/wompi';

/**
 * Contractor portal actions (ADR-061). Paths are those of cuenta.pascalia.lat (the host rewrite adds the
 * /mi-cuenta prefix). Every write goes with the contractor's own session: RLS limits it to their rows.
 */

const s = (form: FormData, k: string) => String(form.get(k) ?? '').trim();
const MAX_FILE = 10 * 1024 * 1024;
const ISO = /^\d{4}-\d{2}-\d{2}$/;

function go(path: string, msg?: string, kind: 'ok' | 'error' = 'ok'): never {
  if (!msg) redirect(path);
  const sep = path.includes('?') ? '&' : '?';
  redirect(`${path}${sep}${kind}=${encodeURIComponent(msg)}`);
}

async function linked() {
  const session = await portalSession();
  if (!session) redirect('/ingresar');
  if (!session.user) redirect('/vincular');
  return { sb: session.sb, user: session.user };
}

function files(form: FormData, key: string): File[] {
  return form.getAll(key).filter((f): f is File => f instanceof File && f.size > 0);
}

function checkFile(f: File, allowPdf: boolean): string | null {
  if (f.size > MAX_FILE) return `«${f.name}» pesa más de 10 MB.`;
  if (!(f.type.startsWith('image/') || (allowPdf && f.type === 'application/pdf')))
    return allowPdf ? `«${f.name}» debe ser una foto o un PDF.` : `«${f.name}» debe ser una foto.`;
  return null;
}

const extOf = (f: File) =>
  f.type === 'application/pdf'
    ? 'pdf'
    : f.type === 'image/png'
      ? 'png'
      : f.type === 'image/webp'
        ? 'webp'
        : f.type === 'image/heic'
          ? 'heic'
          : 'jpg';

// ---------------------------------------------------------------------------
// Account
// ---------------------------------------------------------------------------
export async function signIn(form: FormData): Promise<void> {
  const sb = await supabaseServer();
  const { error } = await sb.auth.signInWithPassword({
    email: s(form, 'email'),
    password: s(form, 'password'),
  });
  if (error) go('/ingresar', 'Correo o contraseña incorrectos.', 'error');
  go('/');
}

export async function signUp(form: FormData): Promise<void> {
  const email = s(form, 'email').toLowerCase();
  const password = String(form.get('password') ?? '');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) go('/registro', 'Escribe un correo válido.', 'error');
  if (password.length < 8) go('/registro', 'La contraseña debe tener al menos 8 caracteres.', 'error');
  if (password !== String(form.get('password2') ?? ''))
    go('/registro', 'Las contraseñas no coinciden.', 'error');
  if (form.get('terms') !== 'on')
    go('/registro', 'Para crear tu cuenta debes aceptar los términos y la política de datos.', 'error');
  const sb = await supabaseServer();
  const { data, error } = await sb.auth.signUp({ email, password });
  if (error) {
    const taken = /registered|exists/i.test(error.message);
    go(
      '/registro',
      taken
        ? 'Ya hay una cuenta con ese correo. Ingresa o recupera tu contraseña.'
        : 'No pude crear tu cuenta.',
      'error',
    );
  }
  // With e-mail confirmation on, Supabase returns no session until the link in the e-mail is opened.
  if (!data.session)
    go('/ingresar', 'Te enviamos un correo para confirmar tu cuenta. Ábrelo y luego ingresa.');
  go('/vincular');
}

export async function signOut(): Promise<void> {
  const sb = await supabaseServer();
  await sb.auth.signOut();
  go('/ingresar');
}

/** «Olvidé mi contraseña»: Pascal sends the link by WhatsApp to the linked number. */
export async function requestRecovery(form: FormData): Promise<void> {
  const sb = await supabaseServer();
  await sb.rpc('portal_recovery', { p_email: s(form, 'email') });
  go(
    '/recuperar',
    'Si ese correo está vinculado a una cuenta, Pascal te envió por WhatsApp el enlace para crear una contraseña nueva.',
  );
}

export async function setPassword(form: FormData): Promise<void> {
  const password = String(form.get('password') ?? '');
  const back = s(form, 'back') === 'datos' ? '/datos' : '/restablecer';
  if (password.length < 8) go(back, 'La contraseña debe tener al menos 8 caracteres.', 'error');
  if (password !== String(form.get('password2') ?? '')) go(back, 'Las contraseñas no coinciden.', 'error');
  const sb = await supabaseServer();
  const { error } = await sb.auth.updateUser({ password });
  if (error) go(back, 'No pude cambiar la contraseña. Intenta de nuevo.', 'error');
  go(back === '/datos' ? '/datos' : '/', 'Listo, tu contraseña quedó cambiada.');
}

// ---------------------------------------------------------------------------
// Activities
// ---------------------------------------------------------------------------
/** The contract, its obligation and the report the date falls in, all checked as the contractor's. */
async function place(contractId: string, obligationId: string, date: string) {
  const { sb, user } = await linked();
  const contract = (await listContracts(sb)).find((c) => c.id === contractId);
  const back = `/contratos/${contractId}`;
  if (!contract) go('/', 'No encontré ese contrato.', 'error');
  if (!ISO.test(date)) go(back, 'Escribe la fecha de la actividad.', 'error');
  const period = contract.periods.find((p) => p.from <= date && date <= p.to);
  if (!period) go(back, 'Esa fecha está por fuera de las cuentas de tu contrato.', 'error');
  if (period.status === 'delivered')
    go(
      `${back}?p=${period.number}`,
      'Esa cuenta ya fue entregada: no puedo cambiar sus actividades.',
      'error',
    );
  if (obligationId && !contract.obligations.some((o) => o.id === obligationId))
    go(back, 'Elige una obligación del contrato.', 'error');
  return { sb, user, contract, period, back: `${back}?p=${period.number}` };
}

async function savePhotos(
  sb: Awaited<ReturnType<typeof linked>>['sb'],
  userId: string,
  noteId: string,
  obligationId: string | null,
  date: string,
  photos: File[],
): Promise<void> {
  for (const [i, f] of photos.entries()) {
    const id = randomUUID();
    const path = `${userId}/${id}.${extOf(f)}`;
    const up = await sb.storage.from('evidences').upload(path, f, { contentType: f.type });
    if (up.error) throw new Error(`No pude guardar la foto «${f.name}».`);
    const { error } = await sb.from('evidences').insert({
      id,
      user_id: userId,
      note_id: noteId,
      obligation_id: obligationId,
      file_path: path,
      taken_on: date,
      sort_order: i,
    });
    if (error) throw new Error(`No pude guardar la foto «${f.name}».`);
  }
}

export async function addActivity(form: FormData): Promise<void> {
  const contractId = s(form, 'contractId');
  const obligationId = s(form, 'obligationId');
  const date = s(form, 'date');
  const text = s(form, 'text');
  const photos = files(form, 'photos');
  const { sb, user, back } = await place(contractId, obligationId, date);
  if (!obligationId) go(back, 'Elige la obligación de la actividad.', 'error');
  if (!text && !photos.length) go(back, 'Cuéntame qué hiciste o agrega una foto.', 'error');
  for (const f of photos) {
    const bad = checkFile(f, false);
    if (bad) go(back, bad, 'error');
  }
  const extras = form
    .getAll('extra')
    .map(String)
    .filter((x) => x && x !== obligationId);
  const id = randomUUID();
  const { error } = await sb.from('activity_notes').insert({
    id,
    user_id: user.id,
    contract_id: contractId,
    activity_date: date,
    text: text || null,
    confirmed_obligation_id: obligationId,
    extra_obligation_ids: extras,
    confidence: 1,
  });
  if (error) go(back, 'No pude guardar la actividad. Intenta de nuevo.', 'error');
  try {
    await savePhotos(sb, user.id, id, obligationId, date, photos);
  } catch (e) {
    go(back, (e as Error).message, 'error');
  }
  revalidatePath('/mi-cuenta', 'layout');
  go(back, 'Actividad guardada. Pascal la tendrá en cuenta en tu próximo borrador.');
}

export async function updateActivity(form: FormData): Promise<void> {
  const noteId = s(form, 'noteId');
  const obligationId = s(form, 'obligationId');
  const date = s(form, 'date');
  const { sb, back } = await place(s(form, 'contractId'), obligationId, date);
  if (!obligationId) go(back, 'Elige la obligación de la actividad.', 'error');
  const extras = form
    .getAll('extra')
    .map(String)
    .filter((x) => x && x !== obligationId);
  const { error } = await sb
    .from('activity_notes')
    .update({
      activity_date: date,
      text: s(form, 'text') || null,
      confirmed_obligation_id: obligationId,
      extra_obligation_ids: extras,
    })
    .eq('id', noteId);
  if (error) go(back, 'No pude guardar los cambios.', 'error');
  await sb.from('evidences').update({ obligation_id: obligationId, taken_on: date }).eq('note_id', noteId);
  revalidatePath('/mi-cuenta', 'layout');
  go(back, 'Cambios guardados. Pascal volverá a redactar esa obligación en el borrador.');
}

export async function deleteActivity(form: FormData): Promise<void> {
  const { sb } = await linked();
  const back = s(form, 'back') || '/';
  const noteId = s(form, 'noteId');
  const { data: photos } = await sb.from('evidences').select('id, file_path').eq('note_id', noteId);
  const { error } = await sb.from('activity_notes').delete().eq('id', noteId);
  if (error) go(back, 'No pude borrar la actividad.', 'error');
  if (photos?.length) {
    await sb
      .from('evidences')
      .delete()
      .in(
        'id',
        photos.map((p) => p.id),
      );
    await sb.storage.from('evidences').remove(photos.map((p) => p.file_path));
  }
  revalidatePath('/mi-cuenta', 'layout');
  go(back, 'Actividad borrada.');
}

export async function addPhotos(form: FormData): Promise<void> {
  const { sb, user } = await linked();
  const back = s(form, 'back') || '/';
  const photos = files(form, 'photos');
  if (!photos.length) go(back, 'Elige al menos una foto.', 'error');
  for (const f of photos) {
    const bad = checkFile(f, false);
    if (bad) go(back, bad, 'error');
  }
  const { data: note } = await sb
    .from('activity_notes')
    .select('id, activity_date, confirmed_obligation_id')
    .eq('id', s(form, 'noteId'))
    .maybeSingle();
  if (!note) go(back, 'No encontré esa actividad.', 'error');
  try {
    await savePhotos(sb, user.id, note.id, note.confirmed_obligation_id, note.activity_date, photos);
  } catch (e) {
    go(back, (e as Error).message, 'error');
  }
  revalidatePath('/mi-cuenta', 'layout');
  go(back, photos.length === 1 ? 'Foto agregada.' : `${photos.length} fotos agregadas.`);
}

export async function removePhoto(form: FormData): Promise<void> {
  const { sb } = await linked();
  const back = s(form, 'back') || '/';
  const { data: photo } = await sb
    .from('evidences')
    .select('id, file_path')
    .eq('id', s(form, 'photoId'))
    .maybeSingle();
  if (photo) {
    await sb.from('evidences').delete().eq('id', photo.id);
    await sb.storage.from('evidences').remove([photo.file_path]);
  }
  revalidatePath('/mi-cuenta', 'layout');
  go(back, 'Foto quitada.');
}

// ---------------------------------------------------------------------------
// Supports
// ---------------------------------------------------------------------------
async function storeSupport(
  sb: Awaited<ReturnType<typeof linked>>['sb'],
  userId: string,
  code: string,
  f: File,
  issuedOn: string | null,
): Promise<string> {
  const id = randomUUID();
  const path = `${userId}/${id}.${extOf(f)}`;
  const data = Buffer.from(await f.arrayBuffer());
  const up = await sb.storage.from('supports').upload(path, data, { contentType: f.type });
  if (up.error) throw new Error('No pude guardar el archivo. Intenta de nuevo.');
  const { error } = await sb.from('supports').insert({
    id,
    user_id: userId,
    code,
    filename: f.name.slice(0, 200),
    original_path: path,
    mime_type: f.type,
    sha256: createHash('sha256').update(data).digest('hex'),
    issued_on: issuedOn,
  });
  if (error) throw new Error('No pude guardar el soporte. Intenta de nuevo.');
  return id;
}

export async function uploadSupport(form: FormData): Promise<void> {
  const { sb, user } = await linked();
  const code = s(form, 'code');
  const issuedOn = s(form, 'issuedOn');
  const [f] = files(form, 'file');
  if (!code) go('/soportes', 'Elige qué soporte vas a cargar.', 'error');
  if (!f) go('/soportes', 'Elige el archivo del soporte.', 'error');
  const bad = checkFile(f, true);
  if (bad) go('/soportes', bad, 'error');
  if (issuedOn && !ISO.test(issuedOn)) go('/soportes', 'Revisa la fecha de expedición.', 'error');
  try {
    await storeSupport(sb, user.id, code, f, issuedOn || null);
  } catch (e) {
    go('/soportes', (e as Error).message, 'error');
  }
  revalidatePath('/mi-cuenta', 'layout');
  go('/soportes', 'Soporte guardado. Pascal ya lo tiene para tu próxima cuenta.');
}

export async function removeSupport(form: FormData): Promise<void> {
  const { sb } = await linked();
  const { data: sup } = await sb
    .from('supports')
    .select('id, original_path')
    .eq('id', s(form, 'supportId'))
    .maybeSingle();
  if (sup) {
    const { error } = await sb.from('supports').delete().eq('id', sup.id);
    if (error) go('/soportes', 'Ese soporte ya se usó en una cuenta y no se puede quitar.', 'error');
    await sb.storage.from('supports').remove([sup.original_path]);
  }
  revalidatePath('/mi-cuenta', 'layout');
  go('/soportes', 'Soporte quitado.');
}

// ---------------------------------------------------------------------------
// Pascal (answered in the WhatsApp chat)
// ---------------------------------------------------------------------------
const ASKED: Record<string, string> = {
  generar: 'Listo, le pedí a Pascal que prepare tu cuenta. Te responde por WhatsApp en unos segundos.',
  'ver borrador': 'Listo, Pascal te envía el borrador por WhatsApp en unos segundos.',
  'cambiar mi cuenta bancaria': 'Listo, Pascal te escribe por WhatsApp para cambiar tu cuenta bancaria.',
  estado: 'Listo, Pascal te envía por WhatsApp el estado de tu cuenta.',
};

export async function askPascal(form: FormData): Promise<void> {
  const { sb } = await linked();
  const back = s(form, 'back') || '/';
  const text = s(form, 'text');
  const reply = s(form, 'reply');
  const { error } = await sb.rpc('portal_request', { p_text: text || null, p_reply: reply || null });
  if (error)
    go(
      back,
      /too many/.test(error.message)
        ? 'Ya le pedí eso a Pascal hace un momento; revisa tu WhatsApp.'
        : 'No pude enviarle la solicitud a Pascal. Intenta de nuevo.',
      'error',
    );
  go(back, reply ? 'Listo, Pascal te reenvía esos documentos por WhatsApp en unos segundos.' : ASKED[text]);
}

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------
async function pendingCharge(id: string) {
  const { sb, user } = await linked();
  const charge = (await listCharges(sb)).find((c) => c.id === id && c.status === 'pending');
  if (!charge) go('/pagos', 'Ese cobro ya no está pendiente.', 'error');
  return { sb, user, charge };
}

export async function payOnline(form: FormData): Promise<void> {
  const { charge } = await pendingCharge(s(form, 'chargeId'));
  if (!wompiConfigured()) go('/pagos', 'El pago en línea no está disponible en este momento.', 'error');
  redirect(checkoutUrl(charge, process.env.PORTAL_PAYMENT_REDIRECT_URL || undefined));
}

export async function sendTransferReceipt(form: FormData): Promise<void> {
  const { sb, user, charge } = await pendingCharge(s(form, 'chargeId'));
  const [f] = files(form, 'file');
  if (!f) go('/pagos', 'Elige la foto o el PDF del comprobante.', 'error');
  const bad = checkFile(f, true);
  if (bad) go('/pagos', bad, 'error');
  try {
    const supportId = await storeSupport(sb, user.id, 'COMPROBANTE_PAGO', f, null);
    const { error } = await sb.rpc('portal_transfer_sent', { p_charge: charge.id, p_support: supportId });
    if (error) throw new Error('No pude registrar el comprobante. Intenta de nuevo.');
  } catch (e) {
    go('/pagos', (e as Error).message, 'error');
  }
  revalidatePath('/mi-cuenta', 'layout');
  go(
    '/pagos',
    'Recibimos tu comprobante. Apenas confirmemos la transferencia, Pascal te avisa por WhatsApp.',
  );
}
