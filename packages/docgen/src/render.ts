import { createReport } from 'docx-templates';
import type { TemplateContext } from './catalog.js';

export const DELIMITERS: [string, string] = ['{{', '}}'];

export class TemplateRenderError extends Error {
  constructor(
    message: string,
    readonly details: string[],
  ) {
    super(message);
    this.name = 'TemplateRenderError';
  }
}

/** Flattens entity variables into `var_<key>` (the word `var` is reserved in JS expressions). */
export function toRenderData(ctx: TemplateContext): Record<string, unknown> {
  const { var: vars, ...rest } = ctx;
  const flat: Record<string, unknown> = { ...rest };
  for (const [k, v] of Object.entries(vars)) flat[`var_${k}`] = v;
  return flat;
}

/**
 * Fills a DOCX template. Templates are uploaded only by the superadmin (ADR-003);
 * docx-templates still evaluates expressions inside a vm sandbox.
 */
export async function renderDocx(template: Buffer, ctx: TemplateContext): Promise<Buffer> {
  try {
    const out = await createReport({
      template,
      data: toRenderData(ctx),
      cmdDelimiter: DELIMITERS,
      rejectNullish: true,
      failFast: false,
      processLineBreaks: true,
      fixSmartQuotes: true,
    });
    return Buffer.from(out);
  } catch (err) {
    const list = Array.isArray(err) ? err : [err];
    const details = list.map((e) => (e instanceof Error ? e.message : String(e)));
    throw new TemplateRenderError(`No se pudo llenar la plantilla: ${details.join('; ')}`, details);
  }
}
