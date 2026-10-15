import 'server-only';
import { supabaseServer } from './supabase';

export interface FailureRow {
  id: number;
  kind: string;
  error: string;
  createdAt: string;
}

const DAYS = 7;

/** What failed or was worked around in the last days: messages, deliveries, transcriptions. */
export async function listRecentFailures(): Promise<FailureRow[]> {
  const sb = await supabaseServer();
  const since = new Date(Date.now() - DAYS * 86_400_000).toISOString();
  const { data, error } = await sb
    .from('job_failures')
    .select('id, queue, error, payload, created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []).map((r) => {
    const p = (r.payload ?? {}) as { event?: string; error?: string };
    return {
      id: r.id as number,
      kind: r.queue === 'warning' ? (KINDS[p.event ?? ''] ?? p.event ?? 'Aviso') : 'Mensaje no procesado',
      error: String(r.queue === 'warning' ? (p.error ?? r.error) : r.error),
      createdAt: r.created_at as string,
    };
  });
}

const KINDS: Record<string, string> = {
  'stt.failed': 'Nota de voz sin transcribir',
  'message.send_failed': 'Respuesta no enviada',
  'deliver.send_failed': 'Aviso no enviado',
  'deliver.notice_failed': 'Plantilla de aviso no enviada',
  'held.send_failed': 'Mensaje pendiente no entregado',
  'reminders.send_failed': 'Recordatorio no enviado',
  'wompi.amount_mismatch': 'Pago con valor distinto',
};
