import type { Outgoing } from '@cuentasbot/conversation';
import type { IsoDate } from '@cuentasbot/shared';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Daily summary of failures to the owner by WhatsApp (ADR-045). Off until `system_settings.alerts`
 * names who receives it: `{ "enabled": true, "userId": "<uuid>", "hour": 7 }`.
 */
export interface AlertSettings {
  enabled: boolean;
  /** User (with WhatsApp) who receives the summary. */
  userId: string | null;
  /** Earliest Bogotá hour to send it. */
  hour: number;
}

const DEFAULTS: AlertSettings = { enabled: false, userId: null, hour: 7 };

export interface FailureCount {
  kind: string;
  count: number;
}

export interface AlertDeps {
  settings(): Promise<AlertSettings>;
  /** Failures recorded since `since`, grouped by kind. */
  failuresSince(since: Date): Promise<FailureCount[]>;
  /** Records today's summary; false when it was already sent. */
  claim(userId: string, key: string): Promise<boolean>;
  /** Sends to that user (held and announced with a template outside the 24-hour window). */
  send(userId: string, out: Outgoing): Promise<void>;
  now: Date;
  today: IsoDate;
  hour: number;
}

/** Names of the events, as the panel shows them. */
export const FAILURE_KINDS: Record<string, string> = {
  inbound: 'Mensajes no procesados',
  'stt.failed': 'Notas de voz sin transcribir',
  'message.send_failed': 'Respuestas no enviadas',
  'deliver.send_failed': 'Avisos no enviados',
  'deliver.notice_failed': 'Plantillas de aviso no enviadas',
  'held.send_failed': 'Mensajes pendientes no entregados',
  'reminders.send_failed': 'Recordatorios no enviados',
  'wompi.amount_mismatch': 'Pagos con valor distinto',
};

/** Sends yesterday's failures once a day, only when there were any; true when sent. */
export async function sendDailyAlert(d: AlertDeps): Promise<boolean> {
  const s = await d.settings();
  if (!s.enabled || !s.userId || d.hour < s.hour) return false;
  const counts = await d.failuresSince(new Date(d.now.getTime() - 24 * 3600_000));
  if (!counts.length) return false;
  if (!(await d.claim(s.userId, `alert:daily:${d.today}`))) return false;
  const total = counts.reduce((n, c) => n + c.count, 0);
  const lines = counts.map((c) => `• ${FAILURE_KINDS[c.kind] ?? c.kind}: ${c.count}`).join('\n');
  await d.send(s.userId, {
    type: 'text',
    text: `⚠️ Resumen de fallas de las últimas 24 horas (${total}):\n${lines}\n\nEl detalle está en el inicio del panel.`,
  });
  return true;
}

export class SupabaseAlertDb {
  constructor(private readonly sb: SupabaseClient) {}

  async settings(): Promise<AlertSettings> {
    const { data } = await this.sb.from('system_settings').select('value').eq('key', 'alerts').maybeSingle();
    return { ...DEFAULTS, ...((data?.value as Partial<AlertSettings> | undefined) ?? {}) };
  }

  async failuresSince(since: Date): Promise<FailureCount[]> {
    const { data, error } = await this.sb
      .from('job_failures')
      .select('queue, payload')
      .gte('created_at', since.toISOString());
    if (error) throw new Error(`failuresSince: ${error.message}`);
    const counts = new Map<string, number>();
    for (const r of data ?? []) {
      const kind =
        r.queue === 'warning' ? String((r.payload as { event?: string })?.event ?? 'warning') : 'inbound';
      counts.set(kind, (counts.get(kind) ?? 0) + 1);
    }
    return [...counts].map(([kind, count]) => ({ kind, count })).sort((a, b) => b.count - a.count);
  }

  async claim(userId: string, key: string): Promise<boolean> {
    const { data, error } = await this.sb
      .from('outbound_messages')
      .upsert(
        { user_id: userId, idempotency_key: key, kind: 'free', payload: {}, status: 'sent' },
        { onConflict: 'idempotency_key', ignoreDuplicates: true },
      )
      .select('id');
    if (error) throw new Error(`claim alert: ${error.message}`);
    return (data ?? []).length > 0;
  }
}
