import { describe, expect, it } from 'vitest';
import {
  addMonthsClamped,
  commercialDaysInclusive,
  formatDdMmYyyy,
  formatRangeLong,
  parseIso,
} from '../src/dates.js';

describe('dates', () => {
  it('formats', () => {
    expect(formatDdMmYyyy('2026-07-06')).toBe('06/07/2026');
    expect(formatRangeLong('2026-08-01', '2026-08-31')).toBe('1 al 31 de agosto de 2026');
    expect(formatRangeLong('2026-10-03', '2026-11-02')).toBe('3 de octubre al 2 de noviembre de 2026');
    expect(formatRangeLong('2026-12-20', '2027-01-19')).toBe(
      '20 de diciembre de 2026 al 19 de enero de 2027',
    );
  });

  it('rejects invalid dates', () => {
    expect(() => parseIso('2026-02-30')).toThrow();
    expect(() => parseIso('06/07/2026')).toThrow();
  });

  it('adds months clamping to month length', () => {
    expect(addMonthsClamped('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonthsClamped('2028-01-31', 1)).toBe('2028-02-29');
    expect(addMonthsClamped('2026-01-31', 2, 31)).toBe('2026-03-31');
    expect(addMonthsClamped('2026-12-15', 1)).toBe('2027-01-15');
  });

  it('counts commercial days', () => {
    expect(commercialDaysInclusive('2026-07-06', '2026-07-31')).toBe(25);
    expect(commercialDaysInclusive('2026-08-01', '2026-08-31')).toBe(30);
    expect(commercialDaysInclusive('2026-02-01', '2026-02-28')).toBe(30);
    expect(commercialDaysInclusive('2026-09-01', '2026-09-30')).toBe(30);
    expect(commercialDaysInclusive('2026-10-03', '2026-11-02')).toBe(30);
    expect(commercialDaysInclusive('2026-08-20', '2026-08-31')).toBe(11);
  });
});
