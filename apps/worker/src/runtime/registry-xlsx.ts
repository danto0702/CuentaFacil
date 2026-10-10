import ExcelJS from 'exceljs';
import type { RegistryRow } from './registry-import.js';

const norm = (v: unknown) =>
  String(v ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z]/g, '')
    .toUpperCase();

// Column headers of the SECOP II contract export (spaces and accents vary between downloads).
const HEADERS = {
  code: ['CODIGOCONTRATO'],
  value: ['VALORINICHIDECONTRATO', 'VALORINICCONTRATO'],
  term: ['TIEMPOEJECUCION'],
  contractor: ['CONTRATISTAS', 'CONTRATISTA'],
  registered: ['FECHAREGISTROCONTRATO'],
  start: ['FECHAACTAINICIO'],
} as const;

function cellText(v: ExcelJS.CellValue): string {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === 'object' && 'text' in v) return String(v.text);
  if (typeof v === 'object' && 'result' in v) return String(v.result ?? '');
  return String(v);
}

/** "2026/07/06", "6/07/2026 10:46:53 a. m." or an ISO date → "2026-07-06". */
export function isoFromRegistryDate(raw: string): string | null {
  const ymd = raw.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  const dmy = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  const [y, m, d] = ymd ? [ymd[1], ymd[2], ymd[3]] : dmy ? [dmy[3], dmy[2], dmy[1]] : [];
  return y && m && d ? `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}` : null;
}

function money(raw: string): number | null {
  if (!raw) return null;
  if (/^\d+(\.\d+)?$/.test(raw)) return Math.round(Number(raw));
  // "$12.000.000,00"
  const n = Number(raw.replace(/[^\d,]/g, '').replace(/,\d*$/, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Reads the entity's SECOP II contract export (first sheet, header in the first row). */
export async function parseRegistryWorkbook(data: Buffer): Promise<RegistryRow[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(data as unknown as ArrayBuffer);
  const ws = wb.worksheets[0];
  if (!ws) throw new Error('el archivo no tiene hojas');
  const header = (ws.getRow(1).values as ExcelJS.CellValue[]).map((v) => norm(cellText(v)));
  const col = (names: readonly string[]) => header.findIndex((h) => names.includes(h));
  const idx = {
    code: col(HEADERS.code),
    value: col(HEADERS.value),
    term: col(HEADERS.term),
    contractor: col(HEADERS.contractor),
    registered: col(HEADERS.registered),
    start: col(HEADERS.start),
  };
  if (idx.code < 0 || idx.contractor < 0 || idx.start < 0)
    throw new Error('faltan columnas: CÓDIGOCONTRATO, CONTRATISTAS o FECHA ACTAINICIO');

  const rows: RegistryRow[] = [];
  ws.eachRow((row, n) => {
    if (n === 1) return;
    const get = (i: number) => (i < 0 ? '' : cellText(row.getCell(i).value).trim());
    const code = get(idx.code).replace(/\D/g, '');
    const doc = get(idx.contractor).match(/^\s*(\d{5,})/)?.[1];
    if (!code || !doc) return;
    const term = Number(get(idx.term));
    rows.push({
      code: String(Number(code)),
      doc,
      initial_value: money(get(idx.value)),
      term_days: Number.isInteger(term) && term > 0 ? term : null,
      registered_on: isoFromRegistryDate(get(idx.registered)),
      start_date: isoFromRegistryDate(get(idx.start)),
    });
  });
  return rows;
}
