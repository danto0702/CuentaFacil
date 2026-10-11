import type { Contract, Entity } from '@cuentasbot/conversation';
import { buildHrnoActivityTemplate, buildHrnoSupervisionTemplate } from '@cuentasbot/docgen';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { TemplateKind, TemplateProvider } from './generator.js';

/** Storage bucket with each entity's original formats (headers, footers and logos only). */
export const TEMPLATES_BUCKET = 'templates';
export const baseTemplatePath = (entityId: string, kind: TemplateKind) => `${entityId}/${kind}.docx`;

const build = (kind: TemplateKind, base?: Buffer) =>
  kind === 'activity_report' ? buildHrnoActivityTemplate(base) : buildHrnoSupervisionTemplate(base);

/**
 * Templates built in code (HRNO layout). Optional base DOCX files (entity originals with logos) can be
 * supplied per kind; used by tests and as the fallback when Storage is not available.
 */
export class CodeTemplateProvider implements TemplateProvider {
  private cache = new Map<string, Promise<Buffer>>();
  constructor(private readonly bases: Partial<Record<TemplateKind, Buffer>> = {}) {}

  get(_entity: Entity, _contract: Contract, kind: TemplateKind): Promise<Buffer> {
    let t = this.cache.get(kind);
    if (!t) {
      t = build(kind, this.bases[kind]);
      this.cache.set(kind, t);
    }
    return t;
  }
}

/**
 * Code templates on top of the entity's original format uploaded from the panel
 * (templates/<entity>/<kind>.docx), so the documents keep its logos, header and footer.
 * Without an upload, the plain code template is used. Cached for a few minutes.
 */
export class StorageTemplateProvider implements TemplateProvider {
  private cache = new Map<string, { at: number; doc: Promise<Buffer> }>();
  constructor(
    private readonly sb: SupabaseClient,
    private readonly ttlMs = 5 * 60_000,
  ) {}

  get(entity: Entity, _contract: Contract, kind: TemplateKind): Promise<Buffer> {
    const key = `${entity.id}/${kind}`;
    const hit = this.cache.get(key);
    if (hit && Date.now() - hit.at < this.ttlMs) return hit.doc;
    const doc = (async () => {
      const { data } = await this.sb.storage
        .from(TEMPLATES_BUCKET)
        .download(baseTemplatePath(entity.id, kind));
      const base = data ? Buffer.from(await data.arrayBuffer()) : undefined;
      return build(kind, base);
    })();
    doc.catch(() => this.cache.delete(key));
    this.cache.set(key, { at: Date.now(), doc });
    return doc;
  }
}
