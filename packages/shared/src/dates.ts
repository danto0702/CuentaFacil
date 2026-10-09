/**
 * Calendar dates as ISO strings "YYYY-MM-DD" (no time, no time zone).
 * All arithmetic happens in UTC to avoid DST/time zone drift.
 */
export type IsoDate = string;

export const MONTHS_ES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
] as const;

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export interface DateParts {
  year: number;
  month: number; // 1..12
  day: number;
}

export function parseIso(d: IsoDate): DateParts {
  const m = ISO_RE.exec(d);
  if (!m) throw new RangeError(`Invalid ISO date: ${d}`);
  const parts = { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
  if (toIso(parts) !== d) throw new RangeError(`Invalid ISO date: ${d}`);
  return parts;
}

export function toIso({ year, month, day }: DateParts): IsoDate {
  const dt = new Date(Date.UTC(year, month - 1, day));
  return dt.toISOString().slice(0, 10);
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function addDays(d: IsoDate, n: number): IsoDate {
  const { year, month, day } = parseIso(d);
  return toIso({ year, month, day: day + n });
}

/** Adds months keeping the anchor day, clamped to the month length (31-ene + 1 mes = 28/29-feb). */
export function addMonthsClamped(d: IsoDate, n: number, anchorDay?: number): IsoDate {
  const { year, month, day } = parseIso(d);
  const total = year * 12 + (month - 1) + n;
  const y = Math.floor(total / 12);
  const m = (total % 12) + 1;
  return toIso({ year: y, month: m, day: Math.min(anchorDay ?? day, daysInMonth(y, m)) });
}

export function endOfMonth(d: IsoDate): IsoDate {
  const { year, month } = parseIso(d);
  return toIso({ year, month, day: daysInMonth(year, month) });
}

export function compareIso(a: IsoDate, b: IsoDate): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function minIso(a: IsoDate, b: IsoDate): IsoDate {
  return compareIso(a, b) <= 0 ? a : b;
}

/** Calendar days between two dates, both inclusive. */
export function calendarDaysInclusive(from: IsoDate, to: IsoDate): number {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  return Math.round((b - a) / 86_400_000) + 1;
}

/**
 * Commercial days (360-day basis, 30-day months), both inclusive.
 * A day that is the last day of its month counts as day 30, so a full month is always 30.
 */
export function commercialDaysInclusive(from: IsoDate, to: IsoDate): number {
  const a = parseIso(from);
  const b = parseIso(to);
  const d1 = Math.min(a.day, 30);
  const d2 = b.day === daysInMonth(b.year, b.month) ? 30 : Math.min(b.day, 30);
  return (b.year - a.year) * 360 + (b.month - a.month) * 30 + (d2 - d1) + 1;
}

/** "06/07/2026" */
export function formatDdMmYyyy(d: IsoDate): string {
  const { year, month, day } = parseIso(d);
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
}

/** "6 de julio de 2026" */
export function formatLong(d: IsoDate): string {
  const { year, month, day } = parseIso(d);
  return `${day} de ${MONTHS_ES[month - 1]} de ${year}`;
}

/**
 * "1 al 31 de agosto de 2026", "3 de octubre al 2 de noviembre de 2026",
 * "20 de diciembre de 2026 al 19 de enero de 2027".
 */
export function formatRangeLong(from: IsoDate, to: IsoDate): string {
  const a = parseIso(from);
  const b = parseIso(to);
  if (a.year !== b.year) return `${formatLong(from)} al ${formatLong(to)}`;
  if (a.month !== b.month) return `${a.day} de ${MONTHS_ES[a.month - 1]} al ${formatLong(to)}`;
  return `${a.day} al ${formatLong(to)}`;
}

export function monthNameEs(d: IsoDate): string {
  return MONTHS_ES[parseIso(d).month - 1]!;
}
