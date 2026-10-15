import type { Outgoing } from '@cuentasbot/conversation';
import { describe, expect, it } from 'vitest';
import { type AlertSettings, type FailureCount, sendDailyAlert } from '../src/runtime/alerts.js';

function setup(failures: FailureCount[], settings: Partial<AlertSettings> = {}) {
  const sent: Outgoing[] = [];
  const claimed = new Set<string>();
  const run = (hour = 8) =>
    sendDailyAlert({
      settings: async () => ({ enabled: true, userId: 'owner', hour: 7, ...settings }),
      failuresSince: async () => failures,
      claim: async (_u, key) => !claimed.has(key) && !!claimed.add(key),
      send: async (_u, out) => void sent.push(out),
      now: new Date('2026-10-15T13:00:00Z'),
      today: '2026-10-15',
      hour,
    });
  return { run, sent };
}

describe('daily failure summary', () => {
  it('sends once a day, only with failures, after the hour', async () => {
    const s = setup([
      { kind: 'stt.failed', count: 2 },
      { kind: 'inbound', count: 1 },
    ]);
    expect(await s.run(6)).toBe(false);
    expect(await s.run()).toBe(true);
    expect(await s.run()).toBe(false);
    expect((s.sent[0] as { text: string }).text).toBe(
      '⚠️ Resumen de fallas de las últimas 24 horas (3):\n• Notas de voz sin transcribir: 2\n• Mensajes no procesados: 1\n\nEl detalle está en el inicio del panel.',
    );
    expect(await setup([]).run()).toBe(false);
    expect(await setup([{ kind: 'inbound', count: 1 }], { enabled: false }).run()).toBe(false);
  });
});
