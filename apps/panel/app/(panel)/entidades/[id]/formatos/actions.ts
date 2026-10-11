'use server';
import { inspectTemplate, stripBodyDocx, type TemplateTagReport } from '@cuentasbot/docgen';
import { revalidatePath } from 'next/cache';
import { dataSource } from '@/lib/data';
import { supabaseServer } from '@/lib/supabase';

export interface InspectState {
  fileName?: string;
  report?: TemplateTagReport;
  error?: string;
}

const MAX_BYTES = 15 * 1024 * 1024;

/** Reads an uploaded DOCX and classifies every tag: base catalog, entity variables, unknown. */
export async function inspectFormat(_prev: InspectState, form: FormData): Promise<InspectState> {
  const entityId = String(form.get('entityId'));
  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0) return { error: 'Selecciona un archivo DOCX.' };
  if (!file.name.toLowerCase().endsWith('.docx'))
    return { error: 'El formato debe ser un archivo .docx de Word.' };
  if (file.size > MAX_BYTES) return { error: 'El archivo supera 15 MB.' };
  const vars = await dataSource().listVariables(entityId);
  const report = await inspectTemplate(
    Buffer.from(await file.arrayBuffer()),
    vars.map((v) => v.key),
  );
  return { fileName: file.name, report };
}

const KEY_RE = /^[a-z][a-z0-9_]{1,62}$/;

export async function createVariable(form: FormData): Promise<void> {
  const entityId = String(form.get('entityId'));
  const key = String(form.get('key') ?? '')
    .replace(/^var_/, '')
    .trim();
  if (!KEY_RE.test(key)) throw new Error('Clave inválida: usa minúsculas, números y guion bajo.');
  await dataSource().addVariable(entityId, {
    key,
    label: String(form.get('label') ?? key),
    type: String(form.get('type') ?? 'text'),
    scope: String(form.get('scope') ?? 'entity'),
    source: String(form.get('source') ?? 'admin'),
    defaultValue: String(form.get('defaultValue') ?? ''),
  });
  revalidatePath(`/entidades/${entityId}/formatos`);
}

const KINDS = new Set(['activity_report', 'supervision_report']);

export interface BaseFormatState {
  ok?: string;
  error?: string;
}

/**
 * Uploads the entity's original format (DOCX with logos). Only the page setup, header and footer are
 * kept: the body and its images are removed before storing, so no example data is saved.
 */
export async function uploadBaseFormat(_prev: BaseFormatState, form: FormData): Promise<BaseFormatState> {
  const entityId = String(form.get('entityId'));
  const kind = String(form.get('kind'));
  const file = form.get('file');
  if (!KINDS.has(kind)) return { error: 'Tipo de formato inválido.' };
  if (!(file instanceof File) || file.size === 0 || !file.name.toLowerCase().endsWith('.docx'))
    return { error: 'Sube el formato original en Word (.docx).' };
  if (file.size > MAX_BYTES) return { error: 'El archivo supera 15 MB.' };
  let base: Buffer;
  try {
    base = await stripBodyDocx(Buffer.from(await file.arrayBuffer()));
  } catch {
    return { error: 'No pude leer el archivo. Revisa que sea un Word (.docx) que abra bien.' };
  }
  const sb = await supabaseServer();
  const { error } = await sb.storage.from('templates').upload(`${entityId}/${kind}.docx`, base, {
    upsert: true,
    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
  if (error) return { error: `No pude guardar el formato: ${error.message}` };
  revalidatePath(`/entidades/${entityId}/formatos`);
  return { ok: `✅ ${file.name} quedó guardado.` };
}
