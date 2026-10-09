import { execFileSync } from 'node:child_process';
import { DEMO_IDS, demoData, FixedClock, MemoryStore } from '@cuentasbot/conversation';
import { docxPlainText, pdfPageCount } from '@cuentasbot/docgen';
import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { AccountGenerator } from '../src/generator.js';
import { CodeTemplateProvider } from '../src/templates.js';

const hasSoffice = (() => {
  try {
    execFileSync('which', ['soffice'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
})();

async function approveAll(store: MemoryStore, contractId: string, periodNumber: number) {
  const c = await store.getContract(contractId);
  for (const o of c.obligations) {
    await store.saveDraft({
      contractId,
      periodNumber,
      obligationKey: o.key,
      paragraphs:
        o.kind === 'general'
          ? ['Actividad cumplida.']
          : [`Se realizó la actividad de la obligación ${o.number}.`],
      status: 'approved',
      sourceNoteIds: [],
    });
  }
}

const text = (s: string) => s.replace(/\s+/g, ' ');

describe.skipIf(!hasSoffice)('AccountGenerator (end to end with LibreOffice)', () => {
  it('full period: salud pública, report 03 DE 03', async () => {
    const store = new MemoryStore(demoData());
    await approveAll(store, DEMO_IDS.salud, 3);
    const gen = new AccountGenerator({
      store,
      clock: new FixedClock('2026-09-29'),
      templates: new CodeTemplateProvider(),
    });
    const files = await gen.generate(DEMO_IDS.salud, 3);
    expect(files.map((f) => `${f.group}:${f.filename}`)).toEqual([
      'pdf:INFORME SEPTIEMBRE 2026.pdf',
      'pdf:INFORME DE SUPERVISIÓN SEPTIEMBRE 2026.pdf',
      'pdf:ANTECEDENTES.pdf',
      'pdf:AFILIACIONES.pdf',
      'pdf:PLANILLA SEPTIEMBRE 2026.pdf',
      'docx:INFORME SEPTIEMBRE 2026.docx',
      'docx:INFORME DE SUPERVISIÓN SEPTIEMBRE 2026.docx',
      'zip:aprobacindelossoportespresentadosalsupervisordelcon.zip',
    ]);
    // Values are checked on the DOCX text (font-independent); PDFs only need to exist and have pages.
    expect(await pdfPageCount(files[0]!.data)).toBeGreaterThanOrEqual(2);
    expect(await pdfPageCount(files[1]!.data)).toBeGreaterThanOrEqual(2);
    const sup = text(await docxPlainText(files[6]!.data));
    expect(sup).toContain('DESDE: 01/09/2026 HASTA: 30/09/2026');
    expect(sup).toContain('CUATRO MILLONES DE PESOS M/CTE ($4.000.000)');
    expect(sup).toContain('Valor pagado $ 8.000.000');
    expect(sup).toContain('Valor no ejecutado $ 0');
    expect(sup).toContain('N/A – informe final');
    expect(sup).toContain('29 días del mes de SEPTIEMBRE de 2026');
    const act = text(await docxPlainText(files[5]!.data));
    expect(act).toContain('Pago No. 03 de 03');
    expect(act).toContain('TOTAL APORTADO (*): $ 1.534.500');

    const zip = await JSZip.loadAsync(files.at(-1)!.data);
    expect(
      Object.keys(zip.files)
        .filter((n) => !n.endsWith('/'))
        .sort(),
    ).toEqual([
      'CUENTAS SEPTIEMBRE 2026/DOCUMENTOS A CARGAR/AFILIACIONES.pdf',
      'CUENTAS SEPTIEMBRE 2026/DOCUMENTOS A CARGAR/ANTECEDENTES.pdf',
      'CUENTAS SEPTIEMBRE 2026/DOCUMENTOS A CARGAR/INFORME DE SUPERVISIÓN SEPTIEMBRE 2026.pdf',
      'CUENTAS SEPTIEMBRE 2026/DOCUMENTOS A CARGAR/INFORME SEPTIEMBRE 2026.pdf',
      'CUENTAS SEPTIEMBRE 2026/DOCUMENTOS A CARGAR/PLANILLA SEPTIEMBRE 2026.pdf',
      'CUENTAS SEPTIEMBRE 2026/INFORME DE SUPERVISIÓN SEPTIEMBRE 2026.docx',
      'CUENTAS SEPTIEMBRE 2026/INFORME SEPTIEMBRE 2026.docx',
    ]);
  }, 180_000);

  it('prorated period: EBS, payment 01-05 from the clauses schedule', async () => {
    const store = new MemoryStore(demoData({ supportsIssuedOn: '2026-08-25' }));
    await approveAll(store, DEMO_IDS.ebs, 1);
    const gen = new AccountGenerator({
      store,
      clock: new FixedClock('2026-08-31'),
      templates: new CodeTemplateProvider(),
    });
    const files = await gen.generate(DEMO_IDS.ebs, 1);
    expect(await pdfPageCount(files[1]!.data)).toBeGreaterThanOrEqual(2);
    const sup = text(
      await docxPlainText(
        files.find((f) => f.filename.startsWith('INFORME DE SUPERVISIÓN') && f.group === 'docx')!.data,
      ),
    );
    expect(sup).toContain('DESDE: 20/08/2026 HASTA: 31/08/2026');
    expect(sup).toContain('TRES MILLONES SEISCIENTOS OCHO MIL PESOS M/CTE ($3.608.000)');
    expect(sup).toContain('9,09%');
    expect(sup).toContain('Valor no ejecutado $ 36.080.000');
    const act = text(
      await docxPlainText(
        files.find((f) => f.filename.startsWith('INFORME AGOSTO') && f.group === 'docx')!.data,
      ),
    );
    expect(act).toContain('INFORME – No. 01-05 - DEL 20 AL 31 DE AGOSTO DE 2026');
    expect(act).toContain('Pago No. 01-05');
    expect(act).toContain('APORTES OBLIGATORIOS EN SALUD (*): $ 420.000');
  }, 180_000);
});
