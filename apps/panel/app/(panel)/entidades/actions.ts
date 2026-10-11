'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { DEFAULT_ENTITY_SETTINGS } from '@/lib/admin';
import { supabaseServer } from '@/lib/supabase';

const s = (form: FormData, k: string) => String(form.get(k) ?? '').trim();
const nOrNull = (v: string) => (v === '' ? null : Number(v));

async function sb() {
  return supabaseServer();
}

function fail(what: string, error: { message: string } | null): void {
  if (error) throw new Error(`${what}: ${error.message}`);
}

/** New institution with default settings; the checklist and variables are configured next. */
export async function createEntity(form: FormData): Promise<void> {
  const name = s(form, 'name').toUpperCase();
  const shortName = s(form, 'shortName').toUpperCase();
  if (!name || !shortName) throw new Error('El nombre y la sigla son obligatorios.');
  const client = await sb();
  const { data, error } = await client
    .from('entities')
    .insert({
      name,
      short_name: shortName,
      nit: s(form, 'nit') || null,
      municipality: s(form, 'municipality') || null,
      department: s(form, 'department') || null,
      settings: DEFAULT_ENTITY_SETTINGS,
      status: 'pending_templates',
    })
    .select('id')
    .single();
  fail('No pude crear la entidad', error);
  const requestId = s(form, 'requestId');
  if (requestId)
    await client
      .from('institution_requests')
      .update({ entity_id: data!.id, status: 'in_progress' })
      .eq('id', requestId);
  revalidatePath('/entidades');
  redirect(`/entidades/${data!.id}`);
}

export async function updateEntity(form: FormData): Promise<void> {
  const id = s(form, 'id');
  const client = await sb();
  const { data: current, error: readErr } = await client
    .from('entities')
    .select('settings')
    .eq('id', id)
    .single();
  fail('No pude leer la entidad', readErr);
  const settings = (current?.settings ?? {}) as Record<string, unknown>;
  const supervisorName = s(form, 'supervisorName').toUpperCase();
  const next = {
    ...settings,
    default_activity_text: s(form, 'defaultActivityText') || 'Actividad cumplida.',
    empty_obligations: s(form, 'emptyObligations') === 'text' ? 'text' : 'omit',
    empty_obligation_text:
      s(form, 'emptyObligationText') ||
      'No se presentaron actividades asociadas a esta obligación en el presente periodo.',
    certificate_max_age_days: Number(s(form, 'certificateMaxAgeDays') || 30),
    meeting: { place: s(form, 'meetingPlace'), start: s(form, 'meetingStart'), end: s(form, 'meetingEnd') },
    contract_defaults: {
      ...((settings.contract_defaults ?? {}) as Record<string, unknown>),
      supervisor: supervisorName ? { name: supervisorName, title: s(form, 'supervisorTitle') } : null,
    },
  };
  const { error } = await client
    .from('entities')
    .update({
      name: s(form, 'name').toUpperCase(),
      short_name: s(form, 'shortName').toUpperCase(),
      nit: s(form, 'nit') || null,
      municipality: s(form, 'municipality') || null,
      department: s(form, 'department') || null,
      status: s(form, 'status') || 'active',
      settings: next,
    })
    .eq('id', id);
  fail('No pude guardar la entidad', error);
  revalidatePath(`/entidades/${id}`);
  revalidatePath('/entidades');
}

const CODE_RE = /^[A-Z][A-Z0-9_]{1,40}$/;

export async function saveSupportType(form: FormData): Promise<void> {
  const entityId = s(form, 'entityId');
  const code = s(form, 'code').toUpperCase().replace(/\s+/g, '_');
  if (!CODE_RE.test(code)) throw new Error('Código inválido: usa mayúsculas, números y guion bajo.');
  const client = await sb();
  const { error } = await client.from('support_types').upsert(
    {
      entity_id: entityId,
      code,
      label: s(form, 'label') || code,
      required: form.get('required') === 'on',
      frequency: s(form, 'frequency') || 'every_period',
      max_age_days: nOrNull(s(form, 'maxAgeDays')),
      bundle: s(form, 'bundle').toUpperCase() || null,
      bundle_order: nOrNull(s(form, 'bundleOrder')),
      official_url: s(form, 'officialUrl') || null,
      instructions: s(form, 'instructions') || null,
      stage: s(form, 'stage') || 'before_generation',
    },
    { onConflict: 'entity_id,code' },
  );
  fail('No pude guardar el soporte', error);
  revalidatePath(`/entidades/${entityId}`);
}

export async function deleteSupportType(form: FormData): Promise<void> {
  const entityId = s(form, 'entityId');
  const client = await sb();
  const { error } = await client
    .from('support_types')
    .delete()
    .eq('id', s(form, 'id'))
    .eq('entity_id', entityId);
  fail('No pude borrar el soporte', error);
  revalidatePath(`/entidades/${entityId}`);
}

/** Uploads the SECOP II contract export; the worker imports it within a minute. */
export async function uploadRegistry(form: FormData): Promise<void> {
  const entityId = s(form, 'entityId');
  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0) throw new Error('Selecciona el archivo Excel.');
  if (!file.name.toLowerCase().endsWith('.xlsx')) throw new Error('El archivo debe ser .xlsx.');
  if (file.size > 20 * 1024 * 1024) throw new Error('El archivo supera 20 MB.');
  const client = await sb();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const safe = file.name.replace(/[^A-Za-z0-9._-]/g, '_');
  const path = `${entityId}/${stamp}_${safe}`;
  const { error } = await client.storage
    .from('registry')
    .upload(path, Buffer.from(await file.arrayBuffer()), {
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  fail('No pude subir el archivo', error);
  // Shows up right away as "En cola"; the worker reads the file and imports it within a minute.
  const { error: qErr } = await client
    .from('registry_imports')
    .insert({ entity_id: entityId, filename: file.name, storage_path: path, status: 'pending' });
  fail('No pude registrar la carga', qErr);
  revalidatePath(`/entidades/${entityId}`);
}

export async function setRequestStatus(form: FormData): Promise<void> {
  const client = await sb();
  const { error } = await client
    .from('institution_requests')
    .update({ status: s(form, 'status') })
    .eq('id', s(form, 'id'));
  fail('No pude actualizar la solicitud', error);
  revalidatePath('/solicitudes');
}

/** Records the bank transfer of the Aliado Premium bonus. */
export async function markBonusPaid(form: FormData): Promise<void> {
  const reference = s(form, 'reference');
  if (!reference) throw new Error('Escribe la referencia de la transferencia.');
  const client = await sb();
  const { error } = await client
    .from('allies')
    .update({ bonus_status: 'paid', bonus_paid_at: new Date().toISOString(), bonus_reference: reference })
    .eq('id', s(form, 'id'))
    .eq('bonus_status', 'pending');
  fail('No pude registrar el pago', error);
  revalidatePath('/aliados');
}
