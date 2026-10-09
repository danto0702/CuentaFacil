import { describe, expect, it } from 'vitest';
import { checkIbc, expectedContributions, fspRate, minimumIbc } from '../src/social-security.js';

const SMMLV = 1_423_500; // 2025 value, used only as a fixed test input.

describe('social security', () => {
  it('HRNO example: one PILA covers two contracts → IBC 5.000.000', () => {
    expect(minimumIbc([4_000_000, 8_500_000], SMMLV)).toBe(5_000_000);
  });

  it('applies the 1 SMMLV floor and 25 SMMLV cap', () => {
    expect(minimumIbc([1_000_000], SMMLV)).toBe(SMMLV);
    expect(minimumIbc([200_000_000], SMMLV)).toBe(25 * SMMLV);
  });

  it('HRNO example contributions with ARL risk III', () => {
    expect(expectedContributions(5_000_000, 3, SMMLV)).toEqual({
      health: 625_000,
      pension: 800_000,
      fsp: 0,
      arl: 121_800,
      total: 1_546_800,
    });
  });

  it('FSP bands', () => {
    expect(fspRate(3.9 * SMMLV, SMMLV)).toBe(0);
    expect(fspRate(4 * SMMLV, SMMLV)).toBe(1);
    expect(fspRate(16.5 * SMMLV, SMMLV)).toBe(1.2);
    expect(fspRate(21 * SMMLV, SMMLV)).toBe(2);
  });

  it('IBC check is advisory by default', () => {
    expect(checkIbc(4_000_000, [4_000_000, 8_500_000], SMMLV)).toEqual({
      ok: false,
      expectedMin: 5_000_000,
      reported: 4_000_000,
      blocking: false,
    });
  });
});
