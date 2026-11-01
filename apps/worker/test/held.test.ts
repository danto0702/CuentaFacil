import type { Outgoing } from '@cuentasbot/conversation';
import { describe, expect, it } from 'vitest';
import { type DeliverDeps, deliver, flushHeld, type HeldStore } from '../src/runtime/held.js';
import type { TemplateMessage } from '../src/whatsapp/payload.js';

function setup(windowOpen: boolean) {
  const sent: Outgoing[] = [];
  const templates: TemplateMessage[] = [];
  const kept: { out: Outgoing; sent: boolean }[] = [];
  let open = windowOpen;
  const held: HeldStore = {
    hold: async (_u, outs) => {
      for (const out of outs) kept.push({ out, sent: false });
    },
    pending: async () =>
      kept
        .filter((k) => !k.sent)
        .map((k) => ({
          out: k.out,
          done: async () => {
            k.sent = true;
          },
        })),
  };
  const d: DeliverDeps = {
    held,
    send: async (_to, out) => {
      if (!open) throw Object.assign(new Error('window closed'), { code: 131047 });
      sent.push(out);
      return 'wamid';
    },
    sendTemplate: async (_to, t) => {
      templates.push(t);
      return 'wamid-t';
    },
    log: { info: () => undefined, error: () => undefined },
  };
  return {
    d,
    sent,
    templates,
    kept,
    reopen: () => {
      open = true;
    },
  };
}

const to = { userId: 'u1', phone: '+573001112233', name: 'María' };
const msgs: Outgoing[] = [
  { type: 'text', text: '✅ Recibí tu pago' },
  { type: 'document', filename: 'informe.pdf', mime: 'application/pdf', data: Buffer.from('x') },
];

describe('delivery outside the 24-hour window', () => {
  it('sends normally while the window is open', async () => {
    const s = setup(true);
    expect(await deliver(s.d, to, msgs, 'los documentos de tu cuenta')).toBe('sent');
    expect(s.sent).toEqual(msgs);
    expect(s.templates).toEqual([]);
  });

  it('keeps the messages, sends the notice, and delivers them when the person answers', async () => {
    const s = setup(false);
    expect(await deliver(s.d, to, msgs, 'los documentos de tu cuenta')).toBe('held');
    expect(s.templates).toEqual([
      {
        name: 'aviso_pendiente',
        language: 'es',
        body: ['María', 'los documentos de tu cuenta'],
        quickReplies: ['held:show'],
      },
    ]);
    expect(s.kept.map((k) => k.out)).toEqual(msgs);
    s.reopen();
    expect(await flushHeld(s.d, 'u1', to.phone)).toBe(2);
    expect(s.sent).toEqual(msgs);
    expect(await flushHeld(s.d, 'u1', to.phone)).toBe(0);
  });

  it('checks the window before sending: WhatsApp accepts the text and only reports it as failed later', async () => {
    const s = setup(true);
    const now = new Date('2026-10-31T04:02:36Z');
    const wrote = (iso: string | null) => ({
      ...s.d,
      now: () => now,
      lastInbound: async () => (iso ? new Date(iso) : null),
    });
    // Wrote 25 hours ago: the notice, not the text that WhatsApp would drop.
    expect(await deliver(wrote('2026-10-30T03:00:00Z'), to, msgs, 'un mensaje')).toBe('held');
    expect(s.sent).toEqual([]);
    expect(s.templates).toHaveLength(1);
    // Never wrote from this number.
    expect(await deliver(wrote(null), to, msgs, 'un mensaje')).toBe('held');
    // Wrote an hour ago: sent right away.
    expect(await deliver(wrote('2026-10-31T03:00:00Z'), to, msgs, 'un mensaje')).toBe('sent');
    expect(s.sent).toEqual(msgs);
  });
});
