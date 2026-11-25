import { describe, expect, it } from 'vitest';
import { buildTemplateContext } from '../src/context.js';
import { renderDocx } from '../src/render.js';
import { syntheticAccount } from '../src/sample.js';
import { buildHrnoActivityTemplate, buildHrnoSupervisionTemplate } from '../src/templates/hrno.js';
import { docxPlainText } from '../src/text.js';

describe('social security across two months (ADR-069)', () => {
  it('writes one table per month in both reports', async () => {
    const input = await syntheticAccount({ period: 'full' });
    const sep = input.socialSecurity!;
    const oct = {
      ...sep,
      contributionMonth: '2026-10-01' as const,
      sheetNumber: '9000000002',
      total: 999_000,
    };
    const ctx = await buildTemplateContext({ ...input, socialSecurity: oct, socialSecurities: [sep, oct] });
    const activity = await docxPlainText(await renderDocx(await buildHrnoActivityTemplate(), ctx));
    const supervision = await docxPlainText(await renderDocx(await buildHrnoSupervisionTemplate(), ctx));
    for (const doc of [activity, supervision]) {
      expect(doc).toContain('SEPTIEMBRE 2026');
      expect(doc).toContain('OCTUBRE 2026');
      expect(doc).toContain('$ 999.000');
    }
    expect(activity.match(/APORTES AL SISTEMA DE SEGURIDAD SOCIAL/g)).toHaveLength(2);
    expect(supervision.match(/Entidad de aporte en línea/g)).toHaveLength(2);
    expect(activity).toContain(`No. de Planilla de Aportes Salud y Pensión: ${sep.sheetNumber} / 9000000002`);
  });

  it('keeps one blank table when there is no PILA', async () => {
    const input = await syntheticAccount({ period: 'full' });
    const ctx = await buildTemplateContext({ ...input, socialSecurity: undefined });
    const activity = await docxPlainText(await renderDocx(await buildHrnoActivityTemplate(), ctx));
    expect(activity.match(/APORTES AL SISTEMA DE SEGURIDAD SOCIAL/g)).toHaveLength(1);
  });
});
