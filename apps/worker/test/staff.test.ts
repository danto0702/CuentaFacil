import type { Outgoing } from '@cuentasbot/conversation';
import { describe, expect, it } from 'vitest';
import { type DeliverDeps, deliver } from '../src/runtime/held.js';
import { parseStaffMessage, STAFF_WAITING, staffOutgoing } from '../src/runtime/staff.js';
import type { TemplateMessage } from '../src/whatsapp/payload.js';

describe('staff messages from the panel', () => {
  it('reads the stored body', () => {
    expect(parseStaffMessage('{"user_id":"u1","text":"  Hola  ","by":"a1"}')).toEqual({
      userId: 'u1',
      text: 'Hola',
    });
    expect(parseStaffMessage('{"user_id":"u1","text":"   "}')).toBeNull();
    expect(parseStaffMessage('{"text":"Hola"}')).toBeNull();
    expect(parseStaffMessage('not json')).toBeNull();
  });

  it('is signed by the team', () => {
    expect(staffOutgoing('Tu código es K7M4')).toEqual({
      type: 'text',
      text: '👤 *Equipo CuentaFácil*\n\nTu código es K7M4',
    });
  });

  it('is held behind the notice template when the window is closed', async () => {
    const held: Outgoing[] = [];
    const templates: TemplateMessage[] = [];
    const d: DeliverDeps = {
      held: {
        hold: async (_u, outs) => {
          held.push(...outs);
        },
        pending: async () => [],
      },
      send: async () => {
        throw Object.assign(new Error('window closed'), { code: 131047 });
      },
      sendTemplate: async (_to, t) => {
        templates.push(t);
        return 'wamid-t';
      },
      log: { info: () => undefined, error: () => undefined },
    };
    const to = { userId: 'u1', phone: '+573001112233', name: 'María' };
    expect(await deliver(d, to, [staffOutgoing('Hola')], STAFF_WAITING)).toBe('held');
    expect(held).toEqual([staffOutgoing('Hola')]);
    expect(templates[0]?.body).toEqual(['María', 'un mensaje del equipo de CuentaFácil']);
  });
});
