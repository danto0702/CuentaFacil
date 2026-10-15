import { AsyncLocalStorage } from 'node:async_hooks';
import { createHash, randomUUID } from 'node:crypto';

/**
 * Ids derived from the inbound message: when a turn fails halfway and the message is retried, the
 * notes, photos and files it already saved get the same ids again, so they are overwritten instead of
 * duplicated.
 */
const scope = new AsyncLocalStorage<{ seed: string; n: number }>();

export function withTurnIds<T>(seed: string, run: () => Promise<T>): Promise<T> {
  return scope.run({ seed, n: 0 }, run);
}

/** The next id of the current turn (a UUID), or a random one outside a turn. */
export function turnId(): string {
  const s = scope.getStore();
  if (!s) return randomUUID();
  const h = createHash('sha256')
    .update(`${s.seed}:${s.n++}`)
    .digest('hex');
  const variant = ((Number.parseInt(h[16]!, 16) & 0x3) | 0x8).toString(16);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-${variant}${h.slice(17, 20)}-${h.slice(20, 32)}`;
}
