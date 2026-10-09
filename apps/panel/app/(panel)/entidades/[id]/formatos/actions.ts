'use server';
import { inspectTemplate, type TemplateTagReport } from '@cuentasbot/docgen';
import { revalidatePath } from 'next/cache';
import { dataSource } from '@/lib/data';

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
