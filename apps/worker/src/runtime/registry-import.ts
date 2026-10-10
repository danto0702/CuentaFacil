import type { SupabaseClient } from '@supabase/supabase-js';
import type { FieldCipher } from '../crypto.js';
import type { Logger } from './pipeline.js';

/**
 * One row of a registry upload (`registry_imports.rows`), already normalized by whoever parsed the
 * entity's SECOP II file: code without leading zeros, ISO dates.
 */
export interface RegistryRow {
  code: string;
  doc: string;
  name?: string | null;
  initial_value?: number | null;
  term_days?: number | null;
  registered_on?: string | null;
  start_date?: string | null;
}

/**
 * Turns pending registry uploads into `entity_contract_registry` rows (blind index for the document,
 * encrypted name) and clears the plain rows from the upload. Upsert by (entity, code, document).
 */
export async function processRegistryImports(
  sb: SupabaseClient,
  cipher: FieldCipher,
  log: Logger,
): Promise<void> {
  const { data: pending, error } = await sb
    .from('registry_imports')
    .select('id, entity_id, rows')
    .eq('status', 'pending')
    .order('id');
  if (error) throw new Error(`registry_imports: ${error.message}`);
  for (const imp of pending ?? []) {
    try {
      const rows = ((imp.rows ?? []) as RegistryRow[]).filter((r) => r.code && r.doc?.replace(/\D/g, ''));
      const records = rows.map((r) => ({
        entity_id: imp.entity_id,
        contract_code: String(Number(r.code.replace(/\D/g, '')) || r.code),
        contractor_doc_bidx: cipher.blindIndex(r.doc),
        contractor_name_enc: r.name ? cipher.encrypt(r.name) : null,
        initial_value: r.initial_value ?? null,
        term_days: r.term_days ?? null,
        registered_on: r.registered_on ?? null,
        start_date: r.start_date ?? null,
        import_id: imp.id,
      }));
      const { count: before } = await sb
        .from('entity_contract_registry')
        .select('id', { count: 'exact', head: true })
        .eq('entity_id', imp.entity_id);
      for (let i = 0; i < records.length; i += 500) {
        const { error: upErr } = await sb
          .from('entity_contract_registry')
          .upsert(records.slice(i, i + 500), { onConflict: 'entity_id,contract_code,contractor_doc_bidx' });
        if (upErr) throw new Error(upErr.message);
      }
      const { count: after } = await sb
        .from('entity_contract_registry')
        .select('id', { count: 'exact', head: true })
        .eq('entity_id', imp.entity_id);
      const inserted = (after ?? 0) - (before ?? 0);
      await sb
        .from('registry_imports')
        .update({
          status: 'processed',
          rows: null,
          row_count: records.length,
          inserted,
          updated: records.length - inserted,
          processed_at: new Date().toISOString(),
        })
        .eq('id', imp.id);
      log.info('registry.imported', { importId: imp.id, rows: records.length, inserted });
    } catch (e) {
      await sb
        .from('registry_imports')
        .update({ status: 'failed', error: String(e).slice(0, 500) })
        .eq('id', imp.id);
      log.error('registry.import_failed', { importId: imp.id, error: String(e) });
    }
  }
}

/** Storage bucket where registry files are uploaded, one folder per entity id. */
export const REGISTRY_BUCKET = 'registry';

/**
 * Finds new files in `registry/<entity_id>/` (uploaded from the panel or the Supabase dashboard),
 * parses them and queues them as registry imports. A file is imported once, by its storage path.
 */
export async function queueRegistryUploads(
  sb: SupabaseClient,
  parse: (data: Buffer) => Promise<RegistryRow[]>,
  log: Logger,
): Promise<void> {
  const { data: entities, error } = await sb.from('entities').select('id').eq('status', 'active');
  if (error) throw new Error(`entities: ${error.message}`);
  for (const { id: entityId } of entities ?? []) {
    const { data: files } = await sb.storage.from(REGISTRY_BUCKET).list(entityId, { limit: 100 });
    for (const f of files ?? []) {
      if (!/\.xlsx$/i.test(f.name)) continue;
      const path = `${entityId}/${f.name}`;
      const { count } = await sb
        .from('registry_imports')
        .select('id', { count: 'exact', head: true })
        .eq('storage_path', path);
      if (count) continue;
      try {
        const { data: blob, error: dlErr } = await sb.storage.from(REGISTRY_BUCKET).download(path);
        if (dlErr || !blob) throw new Error(dlErr?.message ?? 'download failed');
        const rows = await parse(Buffer.from(await blob.arrayBuffer()));
        await sb.from('registry_imports').insert({
          entity_id: entityId,
          filename: f.name,
          storage_path: path,
          rows,
          row_count: rows.length,
        });
        log.info('registry.upload_queued', { path, rows: rows.length });
      } catch (e) {
        await sb.from('registry_imports').insert({
          entity_id: entityId,
          filename: f.name,
          storage_path: path,
          status: 'failed',
          error: String(e).slice(0, 500),
        });
        log.error('registry.upload_failed', { path, error: String(e) });
      }
    }
  }
}
