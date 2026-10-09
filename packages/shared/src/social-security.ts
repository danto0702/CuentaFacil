/** Rules for independent contractors' social security (PILA). All values configurable per entity/year. */

export interface IbcRules {
  /** Share of monthly fees used as IBC. Default 0.40. */
  pct: number;
  minSmmlv: number;
  maxSmmlv: number;
}

export const DEFAULT_IBC_RULES: IbcRules = { pct: 0.4, minSmmlv: 1, maxSmmlv: 25 };

/** ARL rates by risk class (Decreto 1772 de 1994), in percent. */
export const ARL_RATES: Record<number, number> = { 1: 0.522, 2: 1.044, 3: 2.436, 4: 4.35, 5: 6.96 };

export const HEALTH_RATE = 12.5;
export const PENSION_RATE = 16;

/** Rounds a contribution up to the next multiple of 100 pesos. */
export function roundContribution(value: number): number {
  return Math.ceil(value / 100) * 100;
}

/**
 * Minimum IBC for the month: pct × sum of monthly fees of all contracts in force
 * (only the concepts that count for IBC), bounded by [min, max] SMMLV.
 */
export function minimumIbc(
  monthlyFees: number[],
  smmlv: number,
  rules: IbcRules = DEFAULT_IBC_RULES,
): number {
  const base = Math.ceil(monthlyFees.reduce((s, v) => s + v, 0) * rules.pct);
  return Math.min(Math.max(base, rules.minSmmlv * smmlv), rules.maxSmmlv * smmlv);
}

/** Solidarity fund (FSP): 1 % from 4 SMMLV, rising 0.2 % per band from 16 SMMLV up to 2 % at 20+ SMMLV. */
export function fspRate(ibc: number, smmlv: number): number {
  const times = ibc / smmlv;
  if (times < 4) return 0;
  if (times < 16) return 1;
  if (times < 17) return 1.2;
  if (times < 18) return 1.4;
  if (times < 19) return 1.6;
  if (times < 20) return 1.8;
  return 2;
}

export interface ExpectedContributions {
  health: number;
  pension: number;
  fsp: number;
  arl: number;
  total: number;
}

export function expectedContributions(
  ibc: number,
  arlRiskClass: number,
  smmlv: number,
): ExpectedContributions {
  const arlRate = ARL_RATES[arlRiskClass];
  if (arlRate === undefined) throw new RangeError(`Unknown ARL risk class: ${arlRiskClass}`);
  const health = roundContribution((ibc * HEALTH_RATE) / 100);
  const pension = roundContribution((ibc * PENSION_RATE) / 100);
  const fsp = roundContribution((ibc * fspRate(ibc, smmlv)) / 100);
  const arl = roundContribution((ibc * arlRate) / 100);
  return { health, pension, fsp, arl, total: health + pension + fsp + arl };
}

export interface IbcCheck {
  ok: boolean;
  expectedMin: number;
  reported: number;
  /** Advisory unless the entity marks IBC validation as blocking. */
  blocking: boolean;
}

export function checkIbc(
  reportedIbc: number,
  monthlyFees: number[],
  smmlv: number,
  opts?: {
    rules?: IbcRules;
    blocking?: boolean;
  },
): IbcCheck {
  const expectedMin = minimumIbc(monthlyFees, smmlv, opts?.rules);
  return {
    ok: reportedIbc >= expectedMin,
    expectedMin,
    reported: reportedIbc,
    blocking: opts?.blocking ?? false,
  };
}
