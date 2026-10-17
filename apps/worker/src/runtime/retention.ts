import type { SupabaseClient } from '@supabase/supabase-js';
import type { Logger } from './pipeline.js';

/**
 * Data policy, section 7 (ADR-048): supports and evidences are kept 24 months from upload and then
 * deleted; delivery copies (ZIP packages, held messages) after 30 days. The signature stays while the
 * contractor uses the service; consents and payment records are not files and are kept for the legal
 * term.
 */
export const RETENTION_MONTHS = 24;
/** Rows handled per run, so one run never holds the worker for long. */
const BATCH = 200;
/** Delivery copies in the outputs bucket (packages, held messages). */
export const OUTPUTS_DAYS = 30;
/** Gestor requests not answered (data policy 4-D). */
export const DELEGATION_DAYS = 30;

export interface RetentionResult {
  supports: number;
  evidences: number;
  documents: number;
  /** Gestor requests (delegations) declined or never answered. */
  requests: number;
}

export function retentionCutoff(now: Date, months = RETENTION_MONTHS): Date {
  const d = new Date(now);
  d.setUTCMonth(d.getUTCMonth() - months);
  return d;
}

export async function purgeExpiredFiles(
  sb: SupabaseClient,
  now: Date,
  log: Logger,
): Promise<RetentionResult> {
  const cutoff = retentionCutoff(now).toISOString();
  const result: RetentionResult = { supports: 0, evidences: 0, documents: 0, requests: 0 };

  // Supports (except the signature): free the rows that point to them, remove the files, delete.
  const { data: supports, error: e1 } = await sb
    .from('supports')
    .select('id, original_path, normalized_path, code')
    .lt('created_at', cutoff)
    .neq('code', 'FIRMA')
    .limit(BATCH);
  if (e1) throw new Error(`retention supports: ${e1.message}`);
  if (supports?.length) {
    const ids = supports.map((s) => s.id as string);
    await must(sb.from('social_security_payments').update({ support_id: null }).in('support_id', ids));
    await must(
      sb.from('institution_requests').update({ model_support_id: null }).in('model_support_id', ids),
    );
    await must(
      sb.from('institution_requests').update({ contract_support_id: null }).in('contract_support_id', ids),
    );
    const paths = supports.flatMap((s) => [s.original_path, s.normalized_path].filter(Boolean) as string[]);
    if (paths.length) await sb.storage.from('supports').remove(paths);
    await must(sb.from('supports').delete().in('id', ids));
    result.supports = ids.length;
  }

  // Evidence photos.
  const { data: evidences, error: e2 } = await sb
    .from('evidences')
    .select('id, file_path')
    .lt('created_at', cutoff)
    .limit(BATCH);
  if (e2) throw new Error(`retention evidences: ${e2.message}`);
  if (evidences?.length) {
    await sb.storage.from('evidences').remove(evidences.map((e) => e.file_path as string));
    await must(
      sb
        .from('evidences')
        .delete()
        .in(
          'id',
          evidences.map((e) => e.id as string),
        ),
    );
    result.evidences = evidences.length;
  }

  // Delivery copies (ZIP packages behind a 7-day link, messages held for the 24-hour window): they can
  // be generated again, so they go after a month.
  const outputsCutoff = new Date(now.getTime() - OUTPUTS_DAYS * 86_400_000).toISOString();
  for (const folder of ['packages', 'held']) {
    const { data: dirs } = await sb.storage.from('outputs').list(folder, { limit: 100 });
    for (const dir of dirs ?? []) {
      const prefix = `${folder}/${dir.name}`;
      const { data: files } = await sb.storage.from('outputs').list(prefix, { limit: 100 });
      const old = (files ?? []).filter((f) => f.created_at && f.created_at < outputsCutoff);
      if (!old.length) continue;
      await sb.storage.from('outputs').remove(old.map((f) => `${prefix}/${f.name}`));
      result.documents += old.length;
    }
  }

  // Gestor requests the person never accepted (data policy 4-D): the name and number the gestor gave
  // are only for asking; declined requests, and pending ones after 30 days, are deleted.
  const requestCutoff = new Date(now.getTime() - DELEGATION_DAYS * 86_400_000).toISOString();
  const { data: declined } = await sb.from('delegations').delete().eq('status', 'declined').select('id');
  const { data: expired } = await sb
    .from('delegations')
    .delete()
    .eq('status', 'pending')
    .lt('created_at', requestCutoff)
    .select('id');
  result.requests = (declined?.length ?? 0) + (expired?.length ?? 0);

  if (result.supports || result.evidences || result.documents || result.requests)
    log.info('retention.purged', { ...result, cutoff });
  return result;
}

async function must(q: PromiseLike<{ error: { message: string } | null }>): Promise<void> {
  const { error } = await q;
  if (error) throw new Error(`retention: ${error.message}`);
}
