import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';
import { isoFromRegistryDate, parseRegistryWorkbook } from '../src/runtime/registry-xlsx.js';

async function workbook(rows: unknown[][]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Sheet1');
  ws.addRow([
    'CÓDIGOCONTRATO',
    'OBJETOCONTRATO',
    'VALOR INIC.CONTRATO',
    'VALOR INIC. HIDECONTRATO',
    'TIEMPO EJECUCIÓN',
    'CONTRATISTAS',
    'MODALIDADSELECCIÓN',
    'PROCEDIMIENTOCAUSAL',
    'FECHA REGISTROCONTRATO',
    'FECHA ACTAINICIO',
  ]);
  for (const r of rows) ws.addRow(r);
  return Buffer.from(await wb.xlsx.writeBuffer());
}

describe('entity contract registry file', () => {
  it('reads code, document, value, term and dates from the SECOP II export (fictitious data)', async () => {
    const data = await workbook([
      [
        '0999',
        'OBJETO DE PRUEBA',
        '$12.000.000,00',
        12000000,
        86,
        '1000000001 MARÍA PRUEBA',
        'SIN OFERTAS',
        'Manual',
        '9/07/2026 10:46:53 a. m.',
        '2026/07/06',
      ],
      ['', 'fila vacía'],
      ['0042', 'EMPRESA', '$3.000.000,00', null, '', 'SIN DOCUMENTO', '', '', '', ''],
    ]);
    expect(await parseRegistryWorkbook(data)).toEqual([
      {
        code: '999',
        doc: '1000000001',
        initial_value: 12000000,
        term_days: 86,
        registered_on: '2026-07-09',
        start_date: '2026-07-06',
      },
    ]);
  });

  it('normalizes the date formats of the export', () => {
    expect(isoFromRegistryDate('2026/10/07')).toBe('2026-10-07');
    expect(isoFromRegistryDate('8/10/2026 9:54:41 a. m.')).toBe('2026-10-08');
    expect(isoFromRegistryDate('')).toBeNull();
  });
});
