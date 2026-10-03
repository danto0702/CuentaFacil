import type { Contract, Entity } from '@cuentasbot/conversation';
import { buildHrnoActivityTemplate, buildHrnoSupervisionTemplate } from '@cuentasbot/docgen';
import type { TemplateKind, TemplateProvider } from './generator.js';

/**
 * Phase 0 provider: templates built in code. Entities without a template of their own use the HRNO layout.
 * Optional base DOCX files (entity originals with logos) can be supplied per kind.
 */
export class CodeTemplateProvider implements TemplateProvider {
  private cache = new Map<string, Promise<Buffer>>();
  constructor(private readonly bases: Partial<Record<TemplateKind, Buffer>> = {}) {}

  get(_entity: Entity, _contract: Contract, kind: TemplateKind): Promise<Buffer> {
    let t = this.cache.get(kind);
    if (!t) {
      t =
        kind === 'activity_report'
          ? buildHrnoActivityTemplate(this.bases[kind])
          : buildHrnoSupervisionTemplate(this.bases[kind]);
      this.cache.set(kind, t);
    }
    return t;
  }
}
