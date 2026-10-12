import { compareIso } from '@cuentasbot/shared';
import type { Note, Period } from './domain.js';
import { matchCommand, matchMonthRequest } from './intents.js';
import { MONTHS, normalize } from './text.js';

/** Why a note deserves a look before the report is drafted (ADR-039). */
export type NoteSuspicion =
  /** The text names a month outside the report's period; `target` is the report of that month. */
  | { reason: 'other_month'; month: number; target: Period | null }
  /** A photo record without a description of the activity. */
  | { reason: 'photo_only' }
  /** Looks like an instruction to Pascal saved as an activity ("Rehace agosto"). */
  | { reason: 'command' };

/** Prefix of the note Pascal creates for photos assigned by obligation number. */
export const PHOTO_RECORD_PREFIX = 'Registro fotográfico de la obligación';

/** Months 1..12 named in the text («en el mes de agosto», «septiembre»). */
export function monthsNamed(text: string): number[] {
  const words = new Set(normalize(text).split(/[^a-zñ]+/));
  return MONTHS.flatMap((m, i) => (words.has(normalize(m)) ? [i + 1] : []));
}

function monthsOf(p: Period): number[] {
  const out: number[] = [];
  let y = Number(p.from.slice(0, 4));
  let m = Number(p.from.slice(5, 7));
  const endY = Number(p.to.slice(0, 4));
  const endM = Number(p.to.slice(5, 7));
  while (y < endY || (y === endY && m <= endM)) {
    out.push(m);
    m = m === 12 ? 1 : m + 1;
    if (m === 1) y++;
  }
  return out;
}

/**
 * What looks wrong in a note of report `p`, or null. `periods` are all the contract's reports, to
 * suggest where a note that names another month belongs.
 */
export function suspectNote(note: Note, p: Period, periods: Period[]): NoteSuspicion | null {
  const text = note.text.trim();
  if (text.startsWith(PHOTO_RECORD_PREFIX)) return { reason: 'photo_only' };
  const words = normalize(text).split(/\s+/).filter(Boolean);
  if (words.length <= 2 || matchCommand(text) || matchMonthRequest(text)) return { reason: 'command' };
  const named = monthsNamed(text);
  const own = monthsOf(p);
  if (named.length && !named.some((m) => own.includes(m))) {
    const month = named[0]!;
    // The latest report of that month that started before this one.
    const target =
      periods
        .filter((x) => x.number !== p.number && monthsOf(x).includes(month) && compareIso(x.from, p.to) <= 0)
        .sort((a, b) => compareIso(b.from, a.from))[0] ?? null;
    return { reason: 'other_month', month, target };
  }
  return null;
}
