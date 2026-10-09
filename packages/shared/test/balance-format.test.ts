import { describe, expect, it } from 'vitest';
import { financialBalance, truncatePct } from '../src/balance.js';
import { formatDocNumber, formatPercent, formatReportNumber, isValidCedula } from '../src/format.js';

describe('balance', () => {
  it('HRNO example, report 3 of 3', () => {
    expect(
      financialBalance({
        initialValue: 12_000_000,
        additions: 0,
        priorPayments: [
          { voucher: 'ND 001092', amount: 4_000_000 },
          { voucher: 'ND 001287', amount: 4_000_000 },
        ],
        currentAmount: 4_000_000,
      }),
    ).toEqual({
      initialValue: 12_000_000,
      additions: 0,
      totalValue: 12_000_000,
      paid: 8_000_000,
      accruedUnpaid: 4_000_000,
      executed: 12_000_000,
      notExecuted: 0,
      budgetExecutionPct: 100,
    });
  });

  it('truncates percentages', () => {
    expect(truncatePct(8_000_000, 12_000_000)).toBe(66.66);
    expect(truncatePct(1, 3)).toBe(33.33);
    expect(formatPercent(66.66)).toBe('66,66%');
    expect(formatPercent(100)).toBe('100%');
    expect(formatPercent(50.5)).toBe('50,50%');
  });
});

describe('format', () => {
  it('report numbers', () => {
    expect(formatReportNumber(2, 3)).toBe('02 DE 03');
    expect(formatReportNumber(2, 6, 'NN-NN')).toBe('02-06');
  });
  it('documents', () => {
    expect(formatDocNumber('1098765432')).toBe('1.098.765.432');
    expect(isValidCedula('1.098.765.432')).toBe(true);
    expect(isValidCedula('0123')).toBe(false);
    expect(isValidCedula('12')).toBe(false);
  });
});
