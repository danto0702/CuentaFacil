import type { PeriodRange } from './periods.js';

export interface ScheduleItem {
  concept: string;
  amount: number;
  countsForIbc: boolean;
}

/** One payment as defined by the contract clauses ("CLÁUSULA SEGUNDA - VALOR Y FORMA DE PAGO"). */
export interface ScheduledPayment {
  paymentNumber: number;
  amount: number;
  items: ScheduleItem[];
  days?: number;
  months?: number;
}

export type AmountSource = 'certificate' | 'schedule' | 'contractor' | 'computed';

export interface AmountCandidates {
  /** Value stated in the compliance certificate (already applies % of execution). */
  certificate?: { amount: number; executionPct: number };
  schedule?: ScheduledPayment;
  contractor?: number;
  /** Monthly value used for the computed fallback (30-day commercial month). */
  monthlyValue: number;
  period: Pick<PeriodRange, 'commercialDays' | 'full'>;
}

export interface ResolvedAmount {
  amount: number;
  source: AmountSource;
  executionPct: number;
}

/** Value of a partial period with the 30-day commercial month: 8.400.000 / 30 × 12 = 3.360.000. */
export function proratedAmount(monthlyValue: number, commercialDays: number): number {
  if (commercialDays >= 30) return monthlyValue;
  return Math.round((monthlyValue * commercialDays) / 30);
}

/**
 * Picks the value to bill for a period. Priority (ADR-012):
 * certificate > contract schedule > contractor > computed (30-day commercial month).
 */
export function resolvePeriodAmount(c: AmountCandidates): ResolvedAmount {
  if (c.certificate) {
    return { amount: c.certificate.amount, source: 'certificate', executionPct: c.certificate.executionPct };
  }
  if (c.schedule) return { amount: c.schedule.amount, source: 'schedule', executionPct: 100 };
  if (c.contractor !== undefined) return { amount: c.contractor, source: 'contractor', executionPct: 100 };
  const amount = c.period.full ? c.monthlyValue : proratedAmount(c.monthlyValue, c.period.commercialDays);
  return { amount, source: 'computed', executionPct: 100 };
}

/** Builds a schedule of equal payments with a prorated first/last payment when the clauses don't give one. */
export function computedSchedule(periods: PeriodRange[], monthlyValue: number): ScheduledPayment[] {
  return periods.map((p) => {
    const amount = p.full ? monthlyValue : proratedAmount(monthlyValue, p.commercialDays);
    return {
      paymentNumber: p.number,
      amount,
      days: p.commercialDays,
      items: [{ concept: 'Honorarios', amount, countsForIbc: true }],
    };
  });
}

export interface ScheduleCheck {
  ok: boolean;
  scheduledTotal: number;
  difference: number;
}

/** The sum of the schedule must equal the contract value (it can never exceed it). */
export function checkScheduleTotal(schedule: ScheduledPayment[], contractTotal: number): ScheduleCheck {
  const scheduledTotal = schedule.reduce((s, p) => s + p.amount, 0);
  return { ok: scheduledTotal === contractTotal, scheduledTotal, difference: contractTotal - scheduledTotal };
}

/** Billed + this period must not exceed the contract value (validation 8.5). */
export function exceedsContractValue(
  previouslyBilled: number,
  current: number,
  contractTotal: number,
): boolean {
  return previouslyBilled + current > contractTotal;
}
