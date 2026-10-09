export type ReportNumberFormat = 'NN DE NN' | 'NN-NN';

/** "02 DE 03" or "02-06". */
export function formatReportNumber(n: number, total: number, fmt: ReportNumberFormat = 'NN DE NN'): string {
  const a = String(n).padStart(2, '0');
  const b = String(total).padStart(2, '0');
  return fmt === 'NN-NN' ? `${a}-${b}` : `${a} DE ${b}`;
}

/** "66,66%", "100%". */
export function formatPercent(value: number): string {
  if (Number.isInteger(value)) return `${value}%`;
  return `${value.toFixed(2).replace('.', ',')}%`;
}

/** "1.098.765.432" */
export function formatDocNumber(doc: string): string {
  return doc.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** Colombian cédula: 3 to 10 digits, no leading zero. */
export function isValidCedula(doc: string): boolean {
  return /^[1-9]\d{2,9}$/.test(doc.replace(/[.\s]/g, ''));
}
