import { describe, expect, it } from 'vitest';
import {
  checkScheduleTotal,
  computedSchedule,
  exceedsContractValue,
  proratedAmount,
  resolvePeriodAmount,
  type ScheduledPayment,
} from '../src/payments.js';
import { buildPeriods } from '../src/periods.js';

// Schedule as written in the EBS contract clauses: 12 days + 4 months.
const ebsSchedule: ScheduledPayment[] = [
  {
    paymentNumber: 1,
    amount: 3_608_000,
    days: 12,
    items: [
      { concept: 'Honorarios', amount: 3_360_000, countsForIbc: true },
      { concept: 'Auxilio de transporte', amount: 248_000, countsForIbc: false },
    ],
  },
  ...[2, 3, 4, 5].map((n) => ({
    paymentNumber: n,
    amount: 9_020_000,
    months: 1,
    items: [
      { concept: 'Honorarios', amount: 8_400_000, countsForIbc: true },
      { concept: 'Auxilio de transporte', amount: 620_000, countsForIbc: false },
    ],
  })),
];

describe('payments', () => {
  it('30-day commercial proration matches the clauses', () => {
    expect(proratedAmount(8_400_000, 12)).toBe(3_360_000);
    expect(proratedAmount(620_000, 12)).toBe(248_000);
    expect(proratedAmount(4_000_000, 30)).toBe(4_000_000);
  });

  it('EBS schedule adds up to the contract value', () => {
    expect(checkScheduleTotal(ebsSchedule, 39_688_000)).toEqual({
      ok: true,
      scheduledTotal: 39_688_000,
      difference: 0,
    });
  });

  it('resolves amount by priority', () => {
    const period = { commercialDays: 25, full: false };
    expect(resolvePeriodAmount({ monthlyValue: 4_000_000, period })).toEqual({
      amount: 3_333_333,
      source: 'computed',
      executionPct: 100,
    });
    expect(resolvePeriodAmount({ monthlyValue: 4_000_000, period, contractor: 4_000_000 }).source).toBe(
      'contractor',
    );
    expect(
      resolvePeriodAmount({ monthlyValue: 4_000_000, period, contractor: 1, schedule: ebsSchedule[0] }),
    ).toMatchObject({ amount: 3_608_000, source: 'schedule' });
    expect(
      resolvePeriodAmount({
        monthlyValue: 4_000_000,
        period,
        schedule: ebsSchedule[0],
        certificate: { amount: 5_670_000, executionPct: 90 },
      }),
    ).toEqual({ amount: 5_670_000, source: 'certificate', executionPct: 90 });
  });

  it('computed schedule prorates partial periods', () => {
    const periods = buildPeriods({
      contractStart: '2026-07-06',
      contractEnd: '2026-09-30',
      mode: 'month_end',
    });
    expect(computedSchedule(periods, 4_000_000).map((p) => p.amount)).toEqual([
      3_333_333, 4_000_000, 4_000_000,
    ]);
  });

  it('detects billing over the contract value', () => {
    expect(exceedsContractValue(8_000_000, 4_000_000, 12_000_000)).toBe(false);
    expect(exceedsContractValue(8_000_000, 4_000_001, 12_000_000)).toBe(true);
  });
});
