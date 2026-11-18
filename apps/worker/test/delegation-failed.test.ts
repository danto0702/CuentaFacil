import type { Outgoing } from '@cuentasbot/conversation';
import { describe, expect, it } from 'vitest';
import { onDelegationTemplateFailed } from '../src/runtime/delegation-failed.js';

const base = { wamid: 'w1', recipient: '+573001112233', at: new Date() };

function deps(summary: string | null) {
  const sent: { userId: string; out: Outgoing }[] = [];
  return {
    sent,
    d: {
      summaryOf: async () => summary,
      pendingDelegationsFor: async (phone: string) =>
        phone === '+573001112233' ? [{ managerId: 'm1', personName: 'JHON JAIRO PEREZ CALDERON' }] : [],
      notifyUser: async (userId: string, out: Outgoing) => {
        sent.push({ userId, out });
      },
    },
  };
}

describe('authorization template refused by WhatsApp (ADR-064)', () => {
  it('tells the gestor it did not arrive and how the person can authorize', async () => {
    const { d, sent } = deps('[plantilla autorizar_gestor] JHON · DANILO');
    expect(await onDelegationTemplateFailed(d, { ...base, status: 'failed', error: '131049 x' })).toBe(true);
    expect(sent).toHaveLength(1);
    expect(sent[0]!.userId).toBe('m1');
    const out = sent[0]!.out;
    expect(out.type === 'text' && out.text).toMatch(
      /no le entregó a \*JHON JAIRO PEREZ\*.*escriba \*Hola\*.*wa\.me\//s,
    );
  });

  it('ignores other messages and other statuses', async () => {
    const a = deps('👤 hola');
    expect(await onDelegationTemplateFailed(a.d, { ...base, status: 'failed' })).toBe(false);
    const b = deps('[plantilla autorizar_gestor] JHON · DANILO');
    expect(await onDelegationTemplateFailed(b.d, { ...base, status: 'delivered' })).toBe(false);
    expect([...a.sent, ...b.sent]).toHaveLength(0);
  });
});
