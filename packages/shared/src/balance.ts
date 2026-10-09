/** Financial balance of the supervision report (HRNO convention by default; formulas configurable). */

export interface PriorPayment {
  voucher: string;
  amount: number;
}

export interface BalanceInput {
  initialValue: number;
  additions: number;
  priorPayments: PriorPayment[];
  currentAmount: number;
}

export interface Balance {
  initialValue: number;
  additions: number;
  totalValue: number;
  paid: number;
  accruedUnpaid: number;
  executed: number;
  notExecuted: number;
  /** Executed / total, in percent, truncated to 2 decimals. */
  budgetExecutionPct: number;
}

/** Truncates (not rounds) to 2 decimals: 2/3 → 66.66, as entities write it. */
export function truncatePct(numerator: number, denominator: number): number {
  if (denominator <= 0) throw new RangeError('denominator must be > 0');
  return Math.floor((numerator * 10000) / denominator) / 100;
}

export function financialBalance(input: BalanceInput): Balance {
  const totalValue = input.initialValue + input.additions;
  const paid = input.priorPayments.reduce((s, p) => s + p.amount, 0);
  const accruedUnpaid = input.currentAmount;
  const executed = paid + accruedUnpaid;
  return {
    initialValue: input.initialValue,
    additions: input.additions,
    totalValue,
    paid,
    accruedUnpaid,
    executed,
    notExecuted: totalValue - executed,
    budgetExecutionPct: truncatePct(executed, totalValue),
  };
}
