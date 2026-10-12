import type { Outgoing } from '@cuentasbot/conversation';
import { addDays, type IsoDate } from '@cuentasbot/shared';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { TemplateMessage } from '../whatsapp/payload.js';
import type { Logger } from './pipeline.js';

/**
 * Missing-supports reminder before a period closes (ADR-036). Off until the owner turns it on in
 * `system_settings.reminders`: it writes first to real numbers and Meta charges for it.
 */
export interface ReminderSettings {
  enabled: boolean;
  /** How many days before the period's last day. */
  daysBeforeEnd: number;
  /** Earliest local (Bogotá) hour to send. */
  hour: number;
  /** Approved template for contractors outside the 24-hour window. */
  template: string;
  language: string;
}

const DEFAULTS: ReminderSettings = {
  enabled: false,
  daysBeforeEnd: 3,
  hour: 8,
  template: 'faltan_soportes',
  language: 'es',
};

export interface Reminder {
  to: string;
  name: string;
  report: string;
  month: string;
  periodNumber: number;
  missing: string[];
  message: Outgoing;
}

export interface ReminderDb {
  settings(): Promise<ReminderSettings>;
  /** Open periods of active contracts that end on `date`. */
  periodsEndingOn(date: IsoDate): Promise<{ userId: string; contractId: string; periodNumber: number }[]>;
  /** Records the reminder before sending; false when it was already sent (one per period). */
  claim(userId: string, key: string, kind: 'free' | 'template', payload: unknown): Promise<boolean>;
  finish(key: string, result: { wamid: string } | { error: string }): Promise<void>;
  /** Last time the contractor's conversation moved, to know whether the 24-hour window is open. */
  lastActivity(userId: string): Promise<Date | null>;
}

export interface ReminderDeps {
  db: ReminderDb;
  reminder(userId: string, contractId: string): Promise<Reminder | null>;
  send(to: string, out: Outgoing): Promise<string>;
  sendTemplate(to: string, t: TemplateMessage): Promise<string>;
  now: Date;
  today: IsoDate;
  /** Current hour in Bogotá. */
  hour: number;
  log: Logger;
}

const WINDOW_MS = 24 * 3600_000;
/** WhatsApp: the 24-hour window is closed, a template is required. */
const WINDOW_CLOSED = 131047;

export async function sendSupportReminders(d: ReminderDeps): Promise<number> {
  const s = await d.db.settings();
  if (!s.enabled || d.hour < s.hour) return 0;
  let sent = 0;
  for (const p of await d.db.periodsEndingOn(addDays(d.today, s.daysBeforeEnd))) {
    const r = await d.reminder(p.userId, p.contractId);
    if (!r) continue;
    const key = `reminder:supports:${p.contractId}:${p.periodNumber}`;
    const last = await d.db.lastActivity(p.userId);
    const open = !!last && d.now.getTime() - last.getTime() < WINDOW_MS;
    const template: TemplateMessage = {
      name: s.template,
      language: s.language,
      // Approved text: «Hola {{1}}, para tu cuenta de {{2}} aún me faltan estos soportes: {{3}}…»
      body: [r.name, r.month, r.missing.join(', ')],
      // Its button reads «¿Qué me falta?»: it opens the checklist, which offers the guide.
      quickReplies: ['menu:status'],
    };
    if (!(await d.db.claim(p.userId, key, open ? 'free' : 'template', open ? r.message : template))) continue;
    try {
      let wamid: string;
      try {
        wamid = open ? await d.send(r.to, r.message) : await d.sendTemplate(r.to, template);
      } catch (e) {
        if (!open || (e as { code?: number }).code !== WINDOW_CLOSED) throw e;
        wamid = await d.sendTemplate(r.to, template);
      }
      await d.db.finish(key, { wamid });
      sent++;
    } catch (e) {
      d.log.error('reminders.send_failed', { contractId: p.contractId, error: String(e) });
      await d.db.finish(key, { error: String(e).slice(0, 500) });
    }
  }
  if (sent) d.log.info('reminders.sent', { sent });
  return sent;
}

export class SupabaseReminderDb implements ReminderDb {
  constructor(private readonly sb: SupabaseClient) {}

  async settings(): Promise<ReminderSettings> {
    const { data } = await this.sb
      .from('system_settings')
      .select('value')
      .eq('key', 'reminders')
      .maybeSingle();
    return { ...DEFAULTS, ...((data?.value as Partial<ReminderSettings> | undefined) ?? {}) };
  }

  async periodsEndingOn(date: IsoDate) {
    const { data, error } = await this.sb
      .from('periods')
      .select('report_number, contract_id, contracts!inner(user_id, status)')
      .eq('date_to', date)
      .neq('status', 'delivered')
      .eq('contracts.status', 'active');
    if (error) throw new Error(`periodsEndingOn: ${error.message}`);
    return (data ?? []).map((r) => {
      const c = r.contracts as unknown as { user_id: string };
      return {
        userId: c.user_id,
        contractId: r.contract_id as string,
        periodNumber: Number(r.report_number),
      };
    });
  }

  async claim(userId: string, key: string, kind: 'free' | 'template', payload: unknown): Promise<boolean> {
    const { data, error } = await this.sb
      .from('outbound_messages')
      .upsert(
        { user_id: userId, idempotency_key: key, kind, payload },
        { onConflict: 'idempotency_key', ignoreDuplicates: true },
      )
      .select('id');
    if (error) throw new Error(`claim reminder: ${error.message}`);
    return (data ?? []).length > 0;
  }

  async finish(key: string, result: { wamid: string } | { error: string }): Promise<void> {
    await this.sb
      .from('outbound_messages')
      .update(
        'wamid' in result
          ? { status: 'sent', wamid: result.wamid, attempts: 1, sent_at: new Date().toISOString() }
          : { status: 'failed', last_error: result.error, attempts: 1 },
      )
      .eq('idempotency_key', key);
  }

  async lastActivity(userId: string): Promise<Date | null> {
    const { data } = await this.sb
      .from('conversations')
      .select('updated_at')
      .eq('user_id', userId)
      .maybeSingle();
    return data?.updated_at ? new Date(data.updated_at as string) : null;
  }
}
