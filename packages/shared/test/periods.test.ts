import { describe, expect, it } from 'vitest';
import { buildPeriods, recutPeriods } from '../src/periods.js';

const short = (ps: ReturnType<typeof buildPeriods>) =>
  ps.map((p) => `${p.number}:${p.from}..${p.to}${p.full ? '' : '*'}`);

describe('buildPeriods month_end', () => {
  it('HRNO example: 06/07 – 30/09 gives a partial first period', () => {
    const ps = buildPeriods({ contractStart: '2026-07-06', contractEnd: '2026-09-30', mode: 'month_end' });
    expect(short(ps)).toEqual([
      '1:2026-07-06..2026-07-31*',
      '2:2026-08-01..2026-08-31',
      '3:2026-09-01..2026-09-30',
    ]);
    expect(ps[0]!.commercialDays).toBe(25);
    expect(ps[0]!.calendarDays).toBe(26);
  });

  it('contract ending mid-month gives a partial last period', () => {
    const ps = buildPeriods({ contractStart: '2026-02-01', contractEnd: '2026-04-15', mode: 'month_end' });
    expect(short(ps)).toEqual([
      '1:2026-02-01..2026-02-28',
      '2:2026-03-01..2026-03-31',
      '3:2026-04-01..2026-04-15*',
    ]);
  });

  it('single-day contract', () => {
    expect(
      short(buildPeriods({ contractStart: '2026-05-31', contractEnd: '2026-05-31', mode: 'month_end' })),
    ).toEqual(['1:2026-05-31..2026-05-31*']);
  });
});

describe('buildPeriods date_to_date', () => {
  it('3-oct → 2-nov', () => {
    const ps = buildPeriods({ contractStart: '2026-10-03', contractEnd: '2027-01-02', mode: 'date_to_date' });
    expect(short(ps)).toEqual([
      '1:2026-10-03..2026-11-02',
      '2:2026-11-03..2026-12-02',
      '3:2026-12-03..2027-01-02',
    ]);
  });

  it('EBS certificate example 20-ago → 19-sep with partial end', () => {
    const ps = buildPeriods({ contractStart: '2026-08-20', contractEnd: '2026-12-23', mode: 'date_to_date' });
    expect(short(ps)).toEqual([
      '1:2026-08-20..2026-09-19',
      '2:2026-09-20..2026-10-19',
      '3:2026-10-20..2026-11-19',
      '4:2026-11-20..2026-12-19',
      '5:2026-12-20..2026-12-23*',
    ]);
  });

  it('anchor day 31 survives short months', () => {
    const ps = buildPeriods({ contractStart: '2026-01-31', contractEnd: '2026-04-29', mode: 'date_to_date' });
    expect(short(ps)).toEqual([
      '1:2026-01-31..2026-02-27',
      '2:2026-02-28..2026-03-30',
      '3:2026-03-31..2026-04-29',
    ]);
  });

  it('rejects inverted dates', () => {
    expect(() =>
      buildPeriods({ contractStart: '2026-02-01', contractEnd: '2026-01-01', mode: 'month_end' }),
    ).toThrow();
  });
});

describe('recutPeriods', () => {
  it('keeps delivered periods and rebuilds the rest with the new mode', () => {
    const existing = buildPeriods({
      contractStart: '2026-07-06',
      contractEnd: '2026-11-05',
      mode: 'date_to_date',
    }).map((p) => ({ ...p, delivered: p.number === 1 }));
    const { kept, rebuilt } = recutPeriods(existing, '2026-07-06', '2026-11-05', 'month_end');
    expect(kept.map((p) => p.to)).toEqual(['2026-08-05']);
    expect(short(rebuilt)).toEqual([
      '2:2026-08-06..2026-08-31*',
      '3:2026-09-01..2026-09-30',
      '4:2026-10-01..2026-10-31',
      '5:2026-11-01..2026-11-05*',
    ]);
  });

  it('rebuilds everything when nothing was delivered', () => {
    const existing = buildPeriods({
      contractStart: '2026-07-06',
      contractEnd: '2026-09-30',
      mode: 'month_end',
    }).map((p) => ({ ...p, delivered: false }));
    const { kept, rebuilt } = recutPeriods(existing, '2026-07-06', '2026-09-30', 'date_to_date');
    expect(kept).toEqual([]);
    expect(rebuilt[0]).toMatchObject({ number: 1, from: '2026-07-06', to: '2026-08-05' });
  });

  it('date_to_date recut keeps the original anchor day', () => {
    const existing = buildPeriods({
      contractStart: '2026-07-06',
      contractEnd: '2026-10-31',
      mode: 'month_end',
    }).map((p) => ({ ...p, delivered: p.number === 1 }));
    const { rebuilt } = recutPeriods(existing, '2026-07-06', '2026-10-31', 'date_to_date');
    expect(short(rebuilt)).toEqual([
      '2:2026-08-01..2026-08-05*',
      '3:2026-08-06..2026-09-05',
      '4:2026-09-06..2026-10-05',
      '5:2026-10-06..2026-10-31*',
    ]);
  });
});
