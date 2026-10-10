import type { Outgoing } from '@cuentasbot/conversation';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { RawMessage, StatusUpdate } from '../whatsapp/parse.js';
import type { InboxItem, PipelineDb } from './pipeline.js';

function must<T>(res: { data: T; error: { message: string } | null }, what: string): T {
  if (res.error) throw new Error(`${what}: ${res.error.message}`);
  return res.data;
}

/** Short, non-sensitive description for the `messages` log (documents by name only). */
function summarize(out: Outgoing): string {
  switch (out.type) {
    case 'document':
      return `documento: ${out.filename}`;
    default:
      return out.text.slice(0, 120);
  }
}

export class SupabasePipelineDb implements PipelineDb {
  constructor(private readonly sb: SupabaseClient) {}

  async getInbox(id: number): Promise<InboxItem | null> {
    const res = await this.sb
      .from('webhook_inbox')
      .select('id, provider, signature, body, status')
      .eq('id', id)
      .maybeSingle();
    return must(res, 'getInbox') as InboxItem | null;
  }

  async markInbox(id: number, status: 'processed' | 'rejected' | 'failed', error?: string): Promise<void> {
    must(
      await this.sb
        .from('webhook_inbox')
        .update({ status, error: error ?? null, processed_at: new Date().toISOString() })
        .eq('id', id),
      'markInbox',
    );
  }

  async claimInbound(m: RawMessage): Promise<boolean> {
    must(
      await this.sb.from('wa_inbound').upsert(
        {
          wamid: m.wamid,
          phone_e164: m.from,
          received_at: m.at.toISOString(),
          payload: { kind: m.kind, metaType: m.metaType, mediaMime: m.media?.mime ?? null },
        },
        { onConflict: 'wamid', ignoreDuplicates: true },
      ),
      'claimInbound.upsert',
    );
    const row = must(
      await this.sb.from('wa_inbound').select('processed_at').eq('wamid', m.wamid).single(),
      'claimInbound.select',
    ) as { processed_at: string | null };
    return row.processed_at === null;
  }

  async markInboundProcessed(wamid: string): Promise<void> {
    must(
      await this.sb.from('wa_inbound').update({ processed_at: new Date().toISOString() }).eq('wamid', wamid),
      'markInboundProcessed',
    );
  }

  private async userIdByPhone(phone: string): Promise<string | null> {
    const res = await this.sb.from('users').select('id').eq('phone_e164', phone).maybeSingle();
    return (must(res, 'userIdByPhone') as { id: string } | null)?.id ?? null;
  }

  async logOutbound(to: string, wamid: string, out: Outgoing): Promise<void> {
    must(
      await this.sb.from('messages').insert({
        user_id: await this.userIdByPhone(to),
        direction: 'out',
        wamid,
        msg_type: out.type,
        summary: summarize(out),
        status: 'sent',
      }),
      'logOutbound',
    );
  }

  async applyStatus(s: StatusUpdate): Promise<void> {
    must(
      await this.sb
        .from('messages')
        .update({ status: s.error ? `${s.status}: ${s.error}`.slice(0, 200) : s.status })
        .eq('wamid', s.wamid),
      'applyStatus',
    );
  }
}
