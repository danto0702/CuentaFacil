import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { FieldCipher, last4 } from '../src/crypto.js';

describe('FieldCipher', () => {
  const key = randomBytes(32).toString('base64');
  const idx = randomBytes(32).toString('base64');
  const c = new FieldCipher(key, idx);

  it('round-trips and never repeats ciphertext', () => {
    const a = c.encrypt('1.090.453.097');
    expect(a).not.toContain('1090453097');
    expect(c.decrypt(a)).toBe('1.090.453.097');
    expect(c.encrypt('1.090.453.097')).not.toBe(a);
  });

  it('rejects tampered ciphertext', () => {
    const parts = c.encrypt('70980826242').split(':');
    parts[3] = Buffer.from('xxxxxxxxxxx').toString('base64url');
    expect(() => c.decrypt(parts.join(':'))).toThrow();
  });

  it('blind index ignores formatting', () => {
    expect(c.blindIndex('1.090.453.097')).toBe(c.blindIndex('1090453097'));
    expect(last4('1.090.453.097')).toBe('3097');
  });

  it('requires 32-byte keys', () => {
    expect(() => new FieldCipher(randomBytes(16).toString('base64'), idx)).toThrow();
  });
});
