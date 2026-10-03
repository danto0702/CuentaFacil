import { describe, expect, it } from 'vitest';
import { buildTemplateContext } from '../src/context.js';
import { docxToPdf, pdfToText } from '../src/convert.js';
import { pdfPageCount } from '../src/pdf.js';
import { renderDocx } from '../src/render.js';
import { inspectTemplate } from '../src/tags.js';
import { buildHrnoActivityTemplate, buildHrnoSupervisionTemplate } from '../src/templates/hrno.js';
import { syntheticAccount } from './fixtures/synthetic.js';
import { hasBinary, normalizeText } from './helpers.js';

const canConvert = hasBinary('soffice') && hasBinary('pdftotext');

describe('HRNO templates', () => {
  it('only use known tags', async () => {
    for (const tpl of [await buildHrnoActivityTemplate(), await buildHrnoSupervisionTemplate()]) {
      const report = await inspectTemplate(tpl);
      expect(report.errors).toEqual([]);
      expect(report.unknown).toEqual([]);
    }
  });

  describe.skipIf(!canConvert)('golden PDFs', () => {
    for (const period of ['full', 'prorated'] as const) {
      for (const kind of ['activity', 'supervision'] as const) {
        it(`${kind} report, ${period} period`, async () => {
          const tpl =
            kind === 'activity' ? await buildHrnoActivityTemplate() : await buildHrnoSupervisionTemplate();
          const ctx = await buildTemplateContext(await syntheticAccount({ period }));
          const pdf = await docxToPdf(await renderDocx(tpl, ctx));
          expect(await pdfPageCount(pdf)).toBeGreaterThan(1);
          const text = normalizeText(await pdfToText(pdf));
          await expect(text).toMatchFileSnapshot(`./golden/hrno_${kind}_${period}.txt`);
        }, 120_000);
      }
    }
  });
});
