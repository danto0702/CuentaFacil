import type { Outgoing } from '@cuentasbot/conversation';
import { describe, expect, it } from 'vitest';
import {
  type Reminder,
  type ReminderDb,
  type ReminderSettings,
  sendSupportReminders,
} from '../src/runtime/reminders.js';
import type { TemplateMessage } from '../src/whatsapp/payload.js';
import { templatePayload } from '../src/whatsapp/payload.js';

const settings: ReminderSettings = {
  enabled: true,
  daysBeforeEnd: 3,
  hour: 8,
  template: 'faltan_soportes',
  language: 'es',
};
const reminder: Reminder = {
  to: '+573001112233',
  name: 'María',
  report: 'informe 03 DE 03 (1 al 30 de septiembre de 2026)',
  periodNumber: 3,
  missing: ['Antecedentes Policía', 'Afiliación EPS (vencido)'],
  message: { type: 'text', text: 'faltan' },
};
const now = new Date('2026-09-27T14:00:00Z');

function setup(
  opts: { settings?: Partial<ReminderSettings>; lastActivity?: Date | null; failFree?: number } = {},
) {
  const claimed = new Set<string>();
  const finished: Record<string, unknown> = {};
  const free: Outgoing[] = [];
  const templates: TemplateMessage[] = [];
  const db: ReminderDb = {
    settings: async () => ({ ...settings, ...opts.settings }),
    periodsEndingOn: async (date) =>
      date === '2026-09-30' ? [{ userId: 'u1', contractId: 'c1', periodNumber: 3 }] : [],
    claim: async (_u, key) => {
      if (claimed.has(key)) return false;
      claimed.add(key);
      return true;
    },
    finish: async (key, result) => {
      finished[key] = result;
    },
    lastActivity: async () => (opts.lastActivity === undefined ? null : opts.lastActivity),
  };
  const run = (hour = 9) =>
    sendSupportReminders({
      db,
      reminder: async () => reminder,
      send: async (_to, out) => {
        if (opts.failFree) throw Object.assign(new Error('window closed'), { code: opts.failFree });
        free.push(out);
        return 'wamid-free';
      },
      sendTemplate: async (_to, t) => {
        templates.push(t);
        return 'wamid-template';
      },
      now,
      today: '2026-09-27',
      hour,
      log: { info: () => undefined, error: () => undefined },
    });
  return { run, free, templates, finished };
}

describe('missing-supports reminders', () => {
  it('sends nothing while turned off or before the hour', async () => {
    const off = setup({ settings: { enabled: false } });
    expect(await off.run()).toBe(0);
    const early = setup();
    expect(await early.run(7)).toBe(0);
  });

  it('uses the template outside the 24-hour window, once per period', async () => {
    const s = setup();
    expect(await s.run()).toBe(1);
    expect(s.templates).toEqual([
      {
        name: 'faltan_soportes',
        language: 'es',
        body: ['María', reminder.report, 'Antecedentes Policía, Afiliación EPS (vencido)'],
        quickReplies: ['guide:c1'],
      },
    ]);
    expect(s.finished['reminder:supports:c1:3']).toEqual({ wamid: 'wamid-template' });
    expect(await s.run()).toBe(0);
  });

  it('writes a normal message inside the window, and falls back to the template if it closed', async () => {
    const open = setup({ lastActivity: new Date(now.getTime() - 3600_000) });
    await open.run();
    expect(open.free).toEqual([reminder.message]);
    expect(open.templates).toEqual([]);

    const closed = setup({ lastActivity: new Date(now.getTime() - 3600_000), failFree: 131047 });
    await closed.run();
    expect(closed.templates).toHaveLength(1);
  });

  it('builds the template payload with a quick-reply payload and no line breaks', () => {
    const p = templatePayload('+573001112233', {
      name: 'faltan_soportes',
      language: 'es',
      body: ['María', 'línea 1\nlínea 2'],
      quickReplies: ['guide:c1'],
    }) as { to: string; template: { components: unknown[] } };
    expect(p.to).toBe('573001112233');
    expect(p.template.components).toEqual([
      {
        type: 'body',
        parameters: [
          { type: 'text', text: 'María' },
          { type: 'text', text: 'línea 1 línea 2' },
        ],
      },
      {
        type: 'button',
        sub_type: 'quick_reply',
        index: '0',
        parameters: [{ type: 'payload', payload: 'guide:c1' }],
      },
    ]);
  });
});
