import { describe, expect, it } from 'vitest';
import { buildTemplateContext } from '../src/context.js';
import { docxToPdf, pdfToText } from '../src/convert.js';
import { pdfPageCount } from '../src/pdf.js';
import { renderDocx } from '../src/render.js';
import { syntheticAccount } from '../src/sample.js';
import { inspectTemplate } from '../src/tags.js';
import { buildHrnoActivityTemplate, buildHrnoSupervisionTemplate } from '../src/templates/hrno.js';
import { docxPlainText } from '../src/text.js';
import { hasBinary } from './helpers.js';

const canConvert = hasBinary('soffice') && hasBinary('pdftotext');
// Right-aligned amounts sometimes lose the space after "$" in pdftotext output.
const flat = (s: string) => s.replace(/\s+/g, ' ').replace(/\$ /g, '$');

const template = (kind: 'activity' | 'supervision') =>
  kind === 'activity' ? buildHrnoActivityTemplate() : buildHrnoSupervisionTemplate();

describe('HRNO templates', () => {
  it('only use known tags', async () => {
    for (const tpl of [await buildHrnoActivityTemplate(), await buildHrnoSupervisionTemplate()]) {
      const report = await inspectTemplate(tpl);
      expect(report.errors).toEqual([]);
      expect(report.unknown).toEqual([]);
    }
  });

  // Golden files hold the filled DOCX text: independent of fonts and line wrapping.
  for (const period of ['full', 'prorated'] as const) {
    for (const kind of ['activity', 'supervision'] as const) {
      it(`${kind} report, ${period} period (golden DOCX text)`, async () => {
        const ctx = await buildTemplateContext(await syntheticAccount({ period }));
        const text = await docxPlainText(await renderDocx(await template(kind), ctx));
        await expect(text).toMatchFileSnapshot(`./golden/hrno_${kind}_${period}.txt`);
      });
    }
  }

  describe.skipIf(!canConvert)('PDF conversion', () => {
    it('converts both reports and keeps the key values', async () => {
      const ctx = await buildTemplateContext(await syntheticAccount({ period: 'full' }));
      const act = await docxToPdf(await renderDocx(await buildHrnoActivityTemplate(), ctx));
      const sup = await docxToPdf(await renderDocx(await buildHrnoSupervisionTemplate(), ctx));
      expect(await pdfPageCount(act)).toBeGreaterThanOrEqual(3); // data + activities, sworn statement, evidence annex
      expect(await pdfPageCount(sup)).toBeGreaterThanOrEqual(2);
      const a = flat(await pdfToText(act));
      expect(a).toContain('03 DE 03');
      expect(a).toContain('$1.546.800');
      expect(a).toContain('ANEXOS – EVIDENCIAS');
      const s = flat(await pdfToText(sup));
      expect(s).toContain('$8.000.000');
      expect(s).toContain('($4.000.000)');
      expect(s).toContain('29/09/2026');
    }, 120_000);
  });
});
