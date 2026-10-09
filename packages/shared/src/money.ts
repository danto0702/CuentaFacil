/** Money helpers for Colombian pesos. All amounts are integer pesos. */

const UNITS = [
  '',
  'UNO',
  'DOS',
  'TRES',
  'CUATRO',
  'CINCO',
  'SEIS',
  'SIETE',
  'OCHO',
  'NUEVE',
  'DIEZ',
  'ONCE',
  'DOCE',
  'TRECE',
  'CATORCE',
  'QUINCE',
  'DIECISÉIS',
  'DIECISIETE',
  'DIECIOCHO',
  'DIECINUEVE',
  'VEINTE',
  'VEINTIUNO',
  'VEINTIDÓS',
  'VEINTITRÉS',
  'VEINTICUATRO',
  'VEINTICINCO',
  'VEINTISÉIS',
  'VEINTISIETE',
  'VEINTIOCHO',
  'VEINTINUEVE',
];
const TENS = ['', '', '', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
const HUNDREDS = [
  '',
  'CIENTO',
  'DOSCIENTOS',
  'TRESCIENTOS',
  'CUATROCIENTOS',
  'QUINIENTOS',
  'SEISCIENTOS',
  'SETECIENTOS',
  'OCHOCIENTOS',
  'NOVECIENTOS',
];

function assertAmount(n: number): void {
  if (!Number.isSafeInteger(n) || n < 0) throw new RangeError(`Invalid amount: ${n}`);
}

/** 0..999 in words. `apocope` turns a trailing UNO into UN (before a noun: "UN MILLÓN", "VEINTIÚN PESOS"). */
function under1000(n: number, apocope: boolean): string {
  if (n === 0) return '';
  if (n === 100) return 'CIEN';
  const h = Math.floor(n / 100);
  const rest = n % 100;
  const parts: string[] = [];
  if (h > 0) parts.push(HUNDREDS[h]!);
  if (rest > 0) {
    if (rest < 30) {
      let w = UNITS[rest]!;
      if (apocope && rest === 1) w = 'UN';
      if (apocope && rest === 21) w = 'VEINTIÚN';
      parts.push(w);
    } else {
      const t = Math.floor(rest / 10);
      const u = rest % 10;
      let w = TENS[t]!;
      if (u > 0) w += ` Y ${apocope && u === 1 ? 'UN' : UNITS[u]!}`;
      parts.push(w);
    }
  }
  return parts.join(' ');
}

/** 0..999.999 in words. */
function under1e6(n: number, apocope: boolean): string {
  const thousands = Math.floor(n / 1000);
  const rest = n % 1000;
  const parts: string[] = [];
  if (thousands === 1) parts.push('MIL');
  else if (thousands > 1) parts.push(`${under1000(thousands, true)} MIL`);
  if (rest > 0) parts.push(under1000(rest, apocope));
  return parts.join(' ');
}

/**
 * Integer to Spanish words in upper case, as used on Colombian payment documents.
 * `apocope: true` (default) produces the form used before "PESOS": "VEINTIÚN", "UN".
 */
export function numberToWords(n: number, apocope = true): string {
  assertAmount(n);
  if (n === 0) return 'CERO';
  const millions = Math.floor(n / 1_000_000);
  const rest = n % 1_000_000;
  const parts: string[] = [];
  if (millions === 1) parts.push('UN MILLÓN');
  else if (millions > 1) parts.push(`${under1e6(millions, true)} MILLONES`);
  if (rest > 0) parts.push(under1e6(rest, apocope));
  return parts.join(' ');
}

/** "4.000.000" */
export function formatThousands(n: number): string {
  assertAmount(n);
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** "$ 4.000.000" */
export function formatCOP(n: number): string {
  return `$ ${formatThousands(n)}`;
}

/** "CUATRO MILLONES DE PESOS M/CTE" — uses "DE" when the amount ends in MILLÓN/MILLONES. */
export function pesosInWords(n: number): string {
  const words = numberToWords(n);
  const de = n > 0 && n % 1_000_000 === 0 ? ' DE' : '';
  return `${words}${de} PESOS M/CTE`;
}

/** "CUATRO MILLONES DE PESOS M/CTE ($4.000.000)" */
export function amountInWordsAndNumbers(n: number): string {
  return `${pesosInWords(n)} ($${formatThousands(n)})`;
}
