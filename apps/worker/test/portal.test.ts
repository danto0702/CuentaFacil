import type { Inbound, Outgoing } from '@cuentasbot/conversation';
import { describe, expect, it } from 'vitest';
import { parsePortalRequest, recoveryUrl, runPortalTurn } from '../src/runtime/portal.js';

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
    expect(
      parsePortalRequest(
        '{"action":"turn","user_id":"u1","text":"generar","contract_id":"c1","actor_id":"g1"}',
      ),
    ).toEqual({ action: 'turn', userId: 'u1', text: 'generar', contractId: 'c1', actorId: 'g1' });
    expect(parsePortalRequest('{"action":"turn","user_id":"u1"}')).toBeNull();
    expect(parsePortalRequest('no json')).toBeNull();
  });

  it('builds the recovery link on the portal domain', () => {
    expect(recoveryUrl('https://cuenta.pascalia.lat', 'abc')).toBe(
      'https://cuenta.pascalia.lat/auth/confirm?token_hash=abc&type=recovery&next=%2Frestablecer',
    );
  });
});

describe('portal turns (ADR-065)', () => {
  const msg = { id: 'portal-1', from: '+573000000001', at: new Date() };
  const pick: Outgoing = {
    type: 'list',
    text: '¿De cuál contrato?',
    button: 'Elegir',
    rows: [
      { id: 'c:c1', title: '0001' },
      { id: 'c:c2', title: '0002' },
    ],
  };

  it("answers «¿De cuál contrato?» with the page's contract", async () => {
    const seen: Inbound[] = [];
    const out = await runPortalTurn(
      async (m) => {
        seen.push(m);
        return m.kind === 'text' ? [pick] : [{ type: 'text', text: 'Borrador del 0002' }];
      },
      { action: 'turn', userId: 'u1', text: 'ver borrador', contractId: 'c2' },
      msg,
    );
    expect(seen.map((m) => m.replyId ?? m.text)).toEqual(['ver borrador', 'c:c2']);
    expect(out).toEqual([{ type: 'text', text: 'Borrador del 0002' }]);
  });

  it("a gestor's request switches their chat to the person first", async () => {
    const seen: Inbound[] = [];
    const out = await runPortalTurn(
      async (m) => {
        seen.push(m);
        return [{ type: 'text', text: m.replyId?.startsWith('who:') ? '👥 Listo' : 'Estado de Carlos' }];
      },
      { action: 'turn', userId: 'p1', text: 'estado', actorId: 'g1' },
      msg,
    );
    expect(seen.map((m) => m.replyId ?? m.text)).toEqual(['who:p1', 'estado']);
    expect(out).toEqual([{ type: 'text', text: 'Estado de Carlos' }]);
  });

  it('stops when the authorization ended', async () => {
    const out = await runPortalTurn(
      async () => [{ type: 'text', text: 'No tengo autorización para las cuentas de esa persona.' }],
      { action: 'turn', userId: 'p1', text: 'generar', actorId: 'g1' },
      msg,
    );
    expect(out).toHaveLength(1);
  });
});
