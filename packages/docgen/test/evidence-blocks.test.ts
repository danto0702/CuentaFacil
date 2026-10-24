import { describe, expect, it } from 'vitest';
import { evidenceBlocks } from '../src/context.js';

const photo = (width: number, height: number) => ({ image: { width, height } });
const phone = photo(3.83, 8.5);
const meet = photo(6.6, 3.71);

describe('evidence annex blocks', () => {
  it('keeps each activity in one block while its photos fit on a page', () => {
    const b = evidenceBlocks([
      { number: '2', evidences: [meet] },
      { number: '4', evidences: [phone, meet, phone] },
    ]);
    expect(b.map((x) => [x.title, x.evidences.length])).toEqual([
      ['ACTIVIDAD 2', 1],
      ['ACTIVIDAD 4', 3],
    ]);
  });

  it('continues an activity with many photos in another block, by whole lines', () => {
    const b = evidenceBlocks([{ number: '4', evidences: Array.from({ length: 9 }, () => phone) }]);
    // 3 phone photos per line, 8.5 cm each: two lines (17 cm) per block.
    expect(b.map((x) => [x.title, x.evidences.length])).toEqual([
      ['ACTIVIDAD 4', 6],
      ['ACTIVIDAD 4 (continuación)', 3],
    ]);
  });
});
