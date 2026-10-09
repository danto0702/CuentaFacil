import { describe, expect, it } from 'vitest';
import { amountInWordsAndNumbers, formatCOP, numberToWords, pesosInWords } from '../src/money.js';

describe('numberToWords', () => {
  it.each([
    [0, 'CERO'],
    [1, 'UN'],
    [15, 'QUINCE'],
    [16, 'DIECISÉIS'],
    [21, 'VEINTIÚN'],
    [22, 'VEINTIDÓS'],
    [31, 'TREINTA Y UN'],
    [100, 'CIEN'],
    [101, 'CIENTO UN'],
    [999, 'NOVECIENTOS NOVENTA Y NUEVE'],
    [1000, 'MIL'],
    [1001, 'MIL UN'],
    [21000, 'VEINTIÚN MIL'],
    [100000, 'CIEN MIL'],
    [248000, 'DOSCIENTOS CUARENTA Y OCHO MIL'],
    [1_000_000, 'UN MILLÓN'],
    [1_500_000, 'UN MILLÓN QUINIENTOS MIL'],
    [3_608_000, 'TRES MILLONES SEISCIENTOS OCHO MIL'],
    [4_000_000, 'CUATRO MILLONES'],
    [21_000_000, 'VEINTIÚN MILLONES'],
    [39_688_000, 'TREINTA Y NUEVE MILLONES SEISCIENTOS OCHENTA Y OCHO MIL'],
    [100_000_000, 'CIEN MILLONES'],
    [1_000_000_000, 'MIL MILLONES'],
    [
      2_345_678_901,
      'DOS MIL TRESCIENTOS CUARENTA Y CINCO MILLONES SEISCIENTOS SETENTA Y OCHO MIL NOVECIENTOS UN',
    ],
  ])('%i → %s', (n, words) => {
    expect(numberToWords(n)).toBe(words);
  });

  it('keeps UNO without apocope', () => {
    expect(numberToWords(21, false)).toBe('VEINTIUNO');
  });

  it('rejects negatives and fractions', () => {
    expect(() => numberToWords(-1)).toThrow();
    expect(() => numberToWords(1.5)).toThrow();
  });
});

describe('pesos', () => {
  it('uses DE after exact millions', () => {
    expect(amountInWordsAndNumbers(4_000_000)).toBe('CUATRO MILLONES DE PESOS M/CTE ($4.000.000)');
    expect(pesosInWords(1_000_000)).toBe('UN MILLÓN DE PESOS M/CTE');
  });
  it('omits DE otherwise', () => {
    expect(pesosInWords(3_608_000)).toBe('TRES MILLONES SEISCIENTOS OCHO MIL PESOS M/CTE');
    expect(pesosInWords(21)).toBe('VEINTIÚN PESOS M/CTE');
  });
  it('formats currency', () => {
    expect(formatCOP(4_000_000)).toBe('$ 4.000.000');
    expect(formatCOP(0)).toBe('$ 0');
    expect(formatCOP(999)).toBe('$ 999');
  });
});
