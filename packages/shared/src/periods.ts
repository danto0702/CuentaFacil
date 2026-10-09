import {
  addDays,
  addMonthsClamped,
  calendarDaysInclusive,
  commercialDaysInclusive,
  compareIso,
  endOfMonth,
  type IsoDate,
  minIso,
  parseIso,
} from './dates.js';

/** How the contractor cuts each billing period. */
export type PeriodMode = 'month_end' | 'date_to_date';

export interface PeriodRange {
  number: number;
  from: IsoDate;
  to: IsoDate;
  calendarDays: number;
  commercialDays: number;
  /** True when the period covers a whole cycle (whole month or date-to-date month). */
  full: boolean;
}

export interface BuildPeriodsInput {
  contractStart: IsoDate;
  contractEnd: IsoDate;
  mode: PeriodMode;
  /** Start building from this date (used when re-cutting after delivered periods). Defaults to contractStart. */
  from?: IsoDate;
  /** Number of the first generated period. Defaults to 1. */
  firstNumber?: number;
}

/**
 * Splits a contract into billing periods.
 * - month_end: from each start date to the last day of that month (the first and last can be partial).
 * - date_to_date: from the anchor day to the day before the same day next month (3-oct → 2-nov).
 */
export function buildPeriods(input: BuildPeriodsInput): PeriodRange[] {
  const { contractStart, contractEnd, mode } = input;
  if (compareIso(contractEnd, contractStart) < 0) throw new RangeError('contractEnd before contractStart');
  let cursor = input.from ?? contractStart;
  let number = input.firstNumber ?? 1;
  const anchorDay = parseIso(contractStart).day;
  const out: PeriodRange[] = [];

  // For date_to_date we step from the contract start so the anchor survives short months.
  let cycle = 0;
  if (mode === 'date_to_date' && cursor !== contractStart) {
    while (compareIso(addMonthsClamped(contractStart, cycle + 1, anchorDay), cursor) <= 0) cycle++;
  }

  while (compareIso(cursor, contractEnd) <= 0) {
    let naturalEnd: IsoDate;
    let cycleStart: IsoDate;
    if (mode === 'month_end') {
      naturalEnd = endOfMonth(cursor);
      cycleStart = `${cursor.slice(0, 8)}01`;
    } else {
      cycleStart = addMonthsClamped(contractStart, cycle, anchorDay);
      naturalEnd = addDays(addMonthsClamped(contractStart, cycle + 1, anchorDay), -1);
      cycle++;
    }
    const to = minIso(naturalEnd, contractEnd);
    out.push({
      number,
      from: cursor,
      to,
      calendarDays: calendarDaysInclusive(cursor, to),
      commercialDays: commercialDaysInclusive(cursor, to),
      full: cursor === cycleStart && to === naturalEnd,
    });
    number++;
    cursor = addDays(to, 1);
  }
  return out;
}

export interface ExistingPeriod {
  number: number;
  from: IsoDate;
  to: IsoDate;
  delivered: boolean;
}

/**
 * Re-cuts the calendar after the contractor changes the period mode.
 * Delivered periods are immutable; everything after the last delivered one is rebuilt.
 */
export function recutPeriods(
  existing: ExistingPeriod[],
  contractStart: IsoDate,
  contractEnd: IsoDate,
  mode: PeriodMode,
): { kept: ExistingPeriod[]; rebuilt: PeriodRange[] } {
  const sorted = [...existing].sort((a, b) => a.number - b.number);
  let lastDeliveredIdx = -1;
  sorted.forEach((p, i) => {
    if (p.delivered) lastDeliveredIdx = i;
  });
  const kept = sorted.slice(0, lastDeliveredIdx + 1);
  const last = kept.at(-1);
  if (last && compareIso(last.to, contractEnd) >= 0) return { kept, rebuilt: [] };
  const rebuilt = buildPeriods({
    contractStart,
    contractEnd,
    mode,
    from: last ? addDays(last.to, 1) : contractStart,
    firstNumber: last ? last.number + 1 : 1,
  });
  return { kept, rebuilt };
}
