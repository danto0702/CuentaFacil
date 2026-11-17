import { describe, expect, it } from 'vitest';
import { parsePortalRequest, recoveryUrl } from '../src/runtime/portal.js';

describe('portal requests (ADR-061)', () => {
  it('reads what portal_request and portal_recovery store', () => {
    expect(parsePortalRequest('{"action":"turn","user_id":"u1","text":"generar"}')).toEqual({
      action: 'turn',
      userId: 'u1',
      text: 'generar',
    });
    expect(parsePortalRequest('{"action":"turn","user_id":"u1","reply":"redo:c:2"}')).toEqual({
      action: 'turn',
      userId: 'u1',
      reply: 'redo:c:2',
    });
    expect(parsePortalRequest('{"action":"recovery","user_id":"u1"}')).toEqual({
      action: 'recovery',
      userId: 'u1',
    });
    expect(parsePortalRequest('{"action":"turn","user_id":"u1"}')).toBeNull();
    expect(parsePortalRequest('no json')).toBeNull();
  });

  it('builds the recovery link on the portal domain', () => {
    expect(recoveryUrl('https://cuenta.pascalia.lat', 'abc')).toBe(
      'https://cuenta.pascalia.lat/auth/confirm?token_hash=abc&type=recovery&next=%2Frestablecer',
    );
  });
});
