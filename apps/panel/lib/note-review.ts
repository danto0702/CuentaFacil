import 'server-only';
import { type Note, type Period, suspectNote } from '@cuentasbot/conversation';
import { supabaseServer } from './supabase';

export interface SuspiciousNoteRow {
  id: string;
  contractor: string;
  contract: string;
  report: number | null;
  date: string;
  text: string;
  reason: string;
}

const DAYS = 120;

/**
 * Activities that may be in the wrong report or are not activities (ADR-039), across contractors:
 * text naming another month, photo records without description, instructions saved as notes, notes
 * outside every period, and notes added after their report was delivered.
 */
export async function listSuspiciousNotes(): Promise<SuspiciousNoteRow[]> {
  const sb = await supabaseServer();
  const since = new Date(Date.now() - DAYS * 86_400_000).toISOString();
  const { data: notes, error } = await sb
    .from('activity_notes')
    .select(
      'id, contract_id, activity_date, text, transcript, created_at, contracts(number, users(full_name))',
    )
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(2000);
  if (error) throw error;
  const contractIds = [...new Set((notes ?? []).map((n) => n.contract_id as string))];
  if (!contractIds.length) return [];
  const { data: periodRows, error: pe } = await sb
    .from('periods')
    .select('contract_id, report_number, date_from, date_to, status, delivered_at')
    .in('contract_id', contractIds);
  if (pe) throw pe;
  const byContract = new Map<string, (Period & { deliveredAt: string | null })[]>();
  for (const r of periodRows ?? []) {
    const list = byContract.get(r.contract_id) ?? [];
    list.push({
      number: r.report_number,
      from: r.date_from,
      to: r.date_to,
      status: r.status,
      deliveredAt: r.delivered_at,
    } as Period & { deliveredAt: string | null });
    byContract.set(r.contract_id, list);
  }
  const out: SuspiciousNoteRow[] = [];
  for (const n of notes ?? []) {
    const periods = byContract.get(n.contract_id) ?? [];
    const date = n.activity_date as string;
    const p = periods.find((x) => x.from <= date && date <= x.to);
    const text = String(n.text ?? n.transcript ?? '');
    let reason: string | null = null;
    if (!p) reason = 'Fuera de los periodos del contrato';
    else if (p.deliveredAt && n.created_at > p.deliveredAt)
      reason = 'Registrada después de entregar el informe';
    else {
      const why = suspectNote(
        {
          id: n.id,
          userId: '',
          contractId: n.contract_id,
          date,
          text,
          evidenceIds: [],
          createdAt: n.created_at,
        } as Note,
        p,
        periods,
      );
      if (why?.reason === 'other_month') reason = 'Menciona otro mes';
      else if (why?.reason === 'photo_only') reason = 'Foto sin descripción';
      else if (why?.reason === 'command') reason = 'Parece una instrucción, no una actividad';
    }
    if (!reason) continue;
    const c = n.contracts as unknown as { number: string; users: { full_name: string | null } | null } | null;
    out.push({
      id: n.id,
      contractor: c?.users?.full_name || 'Sin nombre',
      contract: c?.number ?? '',
      report: p?.number ?? null,
      date,
      text,
      reason,
    });
  }
  return out;
}
