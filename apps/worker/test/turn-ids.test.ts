import { describe, expect, it } from 'vitest';
import { turnId, withTurnIds } from '../src/runtime/turn-ids.js';

describe('turn ids', () => {
  it('repeats the same ids when the same message is retried', async () => {
    const ids = () => withTurnIds('wamid.1', async () => [turnId(), turnId()]);
    const first = await ids();
    expect(await ids()).toEqual(first);
    expect(first[0]).not.toBe(first[1]);
    expect(first[0]).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(await withTurnIds('wamid.2', async () => turnId())).not.toBe(first[0]);
  });

  it('is random outside a turn', () => {
    expect(turnId()).not.toBe(turnId());
  });
});
