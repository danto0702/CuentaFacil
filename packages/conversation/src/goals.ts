import type { Contract, PeriodGoal, SupportType } from './domain.js';

/** Goals of report `n` (report 1 = month 1 of the tables, as in the approved HRNO reports), with the counts. */
export function periodGoals(c: Contract, periodNumber: number, counts: number[] | null = null): PeriodGoal[] {
  return (c.goals ?? []).flatMap((g, index) => {
    const target = g.monthly.length === 1 ? g.monthly[0] : g.monthly[periodNumber - 1];
    if (target == null || target <= 0) return [];
    return [{ ...g, index, target, done: counts?.[index] ?? null }];
  });
}

/** Below 70 % of the month's goal the contract can be terminated (HRNO clause «Cumplimiento»). */
export const GOAL_ALERT = 0.7;

/** «Seguimiento a plan de cuidado familiar: meta 80 · realizadas 80». */
export const goalLine = (g: PeriodGoal) => `${g.label}: meta ${g.target} · realizadas ${g.done ?? '—'}`;

/**
 * Supports only this contract asks for (ADR-051), as checklist items: asked for, recognized and packed like
 * the entity's. The code carries the contract number so two contracts never mix them.
 */
export function contractSupportTypes(c: Contract): SupportType[] {
  return (c.extraSupports ?? []).map((label, i) => ({
    code: `X${c.number}-${i + 1}`,
    label,
    required: true,
    frequency: 'every_period',
    stage: 'before_generation',
  }));
}
