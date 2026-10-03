import { randomBytes } from 'node:crypto';
import JSZip from 'jszip';
import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { catalogEntries } from '../src/catalog.js';
import { buildDocx } from '../src/container.js';
import { buildTemplateContext } from '../src/context.js';
import { OFICIO, p } from '../src/ooxml.js';
import { mergeToPdf, pdfPageCount } from '../src/pdf.js';
import { renderDocx, TemplateRenderError } from '../src/render.js';
import { inspectTemplate, rootIdentifiers } from '../src/tags.js';
import { buildZips } from '../src/zip.js';
import { fakePhoto, syntheticAccount } from './fixtures/synthetic.js';

const docWith = (...lines: string[]) => buildDocx({ body: lines.map((l) => p(l)).join(''), page: OFICIO });

async function documentText(docx: Buffer): Promise<string> {
  const xml = await (await JSZip.loadAsync(docx)).file('word/document.xml')!.async('string');
  return [...xml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1]).join('');
}

describe('tag inspection', () => {
  it('extracts root identifiers', () => {
    expect(rootIdentifiers('x_arl_no || "_"')).toEqual(['x_arl_no']);
    expect(rootIdentifiers('$o.text')).toEqual([]);
    expect(rootIdentifiers('prior_payments.length === 0')).toEqual(['prior_payments']);
    expect(rootIdentifiers("var_lugar + ' ' + contract_number")).toEqual(['var_lugar', 'contract_number']);
  });

  it('classifies catalog, entity and unknown tags', async () => {
    const tpl = await docWith(
      '{{contract_number}} {{ contractor_name }}',
      '{{var_codigo_formato}} {{var_no_definida}}',
      '{{contrato_numero}}',
      '{{FOR o IN obligations}}{{$o.text}}{{END-FOR o}}',
    );
    const r = await inspectTemplate(tpl, ['codigo_formato']);
    expect(r.unknown).toEqual(['contrato_numero', 'var_no_definida']);
    expect(r.entityVariables).toEqual(['var_codigo_formato', 'var_no_definida']);
    expect(r.errors).toEqual([]);
  });
});

describe('render', () => {
  it('fills catalog and entity variables', async () => {
    const ctx = await buildTemplateContext(await syntheticAccount({ period: 'full' }));
    ctx.var = { codigo_formato: 'MA-GH-IS-03' };
    const out = await renderDocx(
      await docWith(
        'Contrato {{contract_number}} de {{contractor_name}}',
        'Formato {{var_codigo_formato}}',
        '{{payment_value_words}}',
      ),
      ctx,
    );
    const text = await documentText(out);
    expect(text).toContain('Contrato 0001 de MARÍA FERNANDA PRUEBA FICTICIA');
    expect(text).toContain('Formato MA-GH-IS-03');
    expect(text).toContain('CUATRO MILLONES DE PESOS M/CTE ($4.000.000)');
  });

  it('fails with a readable error on unknown tags', async () => {
    const ctx = await buildTemplateContext(await syntheticAccount({ period: 'full' }));
    await expect(renderDocx(await docWith('{{no_existe}}'), ctx)).rejects.toBeInstanceOf(TemplateRenderError);
  });
});

describe('context', () => {
  it('computes balance, labels and defaults', async () => {
    const full = await buildTemplateContext(await syntheticAccount({ period: 'full' }));
    expect(full.report_label).toBe('03 DE 03');
    expect(full.balance_paid).toBe('$ 8.000.000');
    expect(full.balance_not_executed).toBe('$ 0');
    expect(full.budget_execution).toBe('100%');
    expect(full.next_report_date).toBe('N/A – informe final');
    expect(full.general_obligations[0]!.activities).toEqual([{ text: 'Actividad cumplida.' }]);
    expect(full.evidence_obligations.map((o) => o.number)).toEqual(['1', '2', '4']);
    expect(full.contraloria_date).toBe('29/09/2026');

    const prorated = await buildTemplateContext(await syntheticAccount({ period: 'prorated' }));
    expect(prorated.period_range_long).toBe('6 al 31 de julio de 2026');
    expect(prorated.budget_execution).toBe('27,77%');
    expect(prorated.next_report_date).toBe('31/08/2026');
    expect(prorated.payment_value_words).toBe(
      'TRES MILLONES TRESCIENTOS TREINTA Y TRES MIL TRESCIENTOS TREINTA Y TRES PESOS M/CTE ($3.333.333)',
    );
  });
});

describe('pdf bundles', () => {
  it('merges PDFs and images in order', async () => {
    const one = await PDFDocument.create();
    one.addPage();
    one.addPage();
    const pdf = Buffer.from(await one.save());
    const merged = await mergeToPdf([
      { data: pdf, mime: 'application/pdf' },
      { data: await fakePhoto('CERT', '#333', 1600, 2200), mime: 'image/jpeg' },
    ]);
    expect(await pdfPageCount(merged)).toBe(3);
  });

  it('rejects unsupported files', async () => {
    await expect(mergeToPdf([{ data: Buffer.from('x'), mime: 'text/plain' }])).rejects.toThrow(
      /no soportado/,
    );
  });
});

describe('zip', () => {
  it('splits by size without splitting files', async () => {
    const big = (n: number) => randomBytes(n);
    const entries = [
      { path: 'A/1.pdf', data: big(60_000) },
      { path: 'A/2.pdf', data: big(60_000) },
      { path: 'A/3.pdf', data: big(60_000) },
    ];
    expect(await buildZips(entries, 1_000_000)).toHaveLength(1);
    const parts = await buildZips(entries, 130_000);
    expect(parts.length).toBe(2);
    const names = await Promise.all(parts.map(async (z) => Object.keys((await JSZip.loadAsync(z)).files)));
    expect(
      names
        .flat()
        .filter((n) => n.endsWith('.pdf'))
        .sort(),
    ).toEqual(['A/1.pdf', 'A/2.pdf', 'A/3.pdf']);
  });
});

describe('catalog', () => {
  it('documents every tag with a description', () => {
    const entries = catalogEntries();
    expect(entries.length).toBeGreaterThan(100);
    const missing = entries.filter((e) => !e.description && !e.path.includes('[]'));
    expect(missing).toEqual([]);
  });
});
