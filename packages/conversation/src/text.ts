import { addDays, type IsoDate, parseIso, toIso } from '@cuentasbot/shared';

/** Lowercase, no accents, no punctuation, single spaces. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[¿?¡!.,;:()"]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
export const MONTHS = [
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
];

function weekday(d: IsoDate): number {
  return new Date(`${d}T12:00:00Z`).getUTCDay();
}

/** When an activity happened: a day, or a whole month ("en julio", "en el mes de julio"). */
export type ActivityWhen = { kind: 'day'; date: IsoDate } | { kind: 'month'; from: IsoDate; to: IsoDate };

/**
 * Finds when the activity in a note happened: a day ("hoy", "ayer", "el martes", "el 15", "15/09",
 * "15 de septiembre") or a month ("en julio", "en el mes de julio de 2026"). Null when the note does
 * not say. Never returns a future date.
 */
export function parseActivityWhen(text: string, today: IsoDate): ActivityWhen | null {
  const t = ` ${normalize(text)} `;
  if (!/ (hoy|ayer|anteayer|antier|ante ayer|el \d{1,2}|\d{1,2}\/\d{1,2}|\d{1,2} de [a-z]+) /.test(t)) {
    const m = new RegExp(` (${MONTHS.join('|')})(?: (?:de|del) (\\d{4}))? `).exec(t);
    if (m) {
      const { year, month } = parseIso(today);
      const mm = MONTHS.indexOf(m[1]!) + 1;
      const y = m[2] ? Number(m[2]) : mm > month ? year - 1 : year;
      const from = toIso({ year: y, month: mm, day: 1 });
      const last = toIso({ year: mm === 12 ? y + 1 : y, month: mm === 12 ? 1 : mm + 1, day: 1 });
      const to = addDays(last, -1);
      if (from > today) return null;
      return { kind: 'month', from, to: to > today ? today : to };
    }
  }
  const date = parseActivityDay(t, today);
  return date ? { kind: 'day', date } : null;
}

/** Day of the activity, defaulting to today (kept for callers that need a single day). */
export function parseActivityDate(text: string, today: IsoDate): IsoDate {
  const when = parseActivityWhen(text, today);
  return when?.kind === 'day' ? when.date : when?.kind === 'month' ? when.from : today;
}

function parseActivityDay(t: string, today: IsoDate): IsoDate | null {
  const { year, month, day } = parseIso(today);
  if (/ (anteayer|antier|ante ayer) /.test(t)) return addDays(today, -2);
  if (/ ayer /.test(t)) return addDays(today, -1);
  if (/ hoy /.test(t)) return today;

  for (let i = 0; i < 7; i++) {
    if (new RegExp(` (el |este |el pasado )?${WEEKDAYS[i]} `).test(t)) {
      const diff = (weekday(today) - i + 7) % 7;
      return addDays(today, -diff);
    }
  }

  const dm = / (\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))? /.exec(t);
  if (dm) {
    const y = dm[3] ? Number(dm[3].length === 2 ? `20${dm[3]}` : dm[3]) : year;
    return pastOrPrevYear(y, Number(dm[2]), Number(dm[1]), today);
  }
  const dmName = new RegExp(` (\\d{1,2}) de (${MONTHS.join('|')})(?: de (\\d{4}))? `).exec(t);
  if (dmName) {
    const y = dmName[3] ? Number(dmName[3]) : year;
    return pastOrPrevYear(y, MONTHS.indexOf(dmName[2]!) + 1, Number(dmName[1]), today);
  }
  const dOnly = / el (\d{1,2}) /.exec(t);
  if (dOnly) {
    const d = Number(dOnly[1]);
    if (d >= 1 && d <= 31) {
      if (d <= day) return safeDate(year, month, d) ?? today;
      const prev = month === 1 ? { y: year - 1, m: 12 } : { y: year, m: month - 1 };
      return safeDate(prev.y, prev.m, d) ?? today;
    }
  }
  return null;
}

function safeDate(year: number, month: number, day: number): IsoDate | null {
  try {
    const iso = toIso({ year, month, day });
    return parseIso(iso).day === day ? iso : null;
  } catch {
    return null;
  }
}

function pastOrPrevYear(year: number, month: number, day: number, today: IsoDate): IsoDate {
  const d = safeDate(year, month, day);
  if (!d) return today;
  return d > today ? (safeDate(year - 1, month, day) ?? today) : d;
}

/** Cuts a label to a WhatsApp limit, adding an ellipsis. */
export function clip(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}
