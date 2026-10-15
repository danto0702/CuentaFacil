import { randomUUID } from 'node:crypto';
import type { Outgoing } from '@cuentasbot/conversation';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { TemplateMessage } from '../whatsapp/payload.js';
import type { Logger } from './pipeline.js';

/** WhatsApp: the 24-hour window is closed, only templates can be sent. */
export const WINDOW_CLOSED = 131047;

/** Payload of the notice's quick reply; any message from the person delivers what was held too. */
export const SHOW_HELD = 'held:show';

/** Approved template that tells the person something is waiting (docs/WHATSAPP_TEMPLATES.md). */
export const NOTICE_TEMPLATE = 'aviso_pendiente';

/** A held message as stored: documents go to Storage, the row keeps their path. */
type Stored =
  | Exclude<Outgoing, { type: 'document' }>
  | { type: 'document'; filename: string; mime: string; path: string; caption?: string };

export interface HeldStore {
  hold(userId: string, outs: Outgoing[]): Promise<void>;
  /** Messages held for the user, oldest first, each with a function that marks it sent. */
  pending(userId: string): Promise<{ out: Outgoing; done: (wamid: string) => Promise<void> }[]>;
}

export interface DeliverDeps {
  held: HeldStore;
  send(to: string, out: Outgoing): Promise<string>;
  sendTemplate(to: string, t: TemplateMessage): Promise<string>;
  log: Logger;
}

const isWindowClosed = (e: unknown) => (e as { code?: number }).code === WINDOW_CLOSED;

/**
 * Sends messages Pascal writes on its own (a payment confirmed, a gestor's notice). Outside the 24-hour
 * window WhatsApp refuses them: they are kept, and an approved template tells the person to tap
 * «Ver ahora» to receive them (ADR-043).
 */
export async function deliver(
  d: DeliverDeps,
  to: { userId: string; phone: string; name: string },
  outs: Outgoing[],
  /** What is waiting, for the template: «los documentos de tu cuenta». */
  what: string,
): Promise<'sent' | 'held'> {
  for (let i = 0; i < outs.length; i++) {
    try {
      await d.send(to.phone, outs[i]!);
    } catch (e) {
      if (!isWindowClosed(e)) {
        d.log.error('deliver.send_failed', { userId: to.userId, error: String(e) });
        continue;
      }
      await d.held.hold(to.userId, outs.slice(i));
      try {
        await d.sendTemplate(to.phone, {
          name: NOTICE_TEMPLATE,
          language: 'es',
          body: [to.name, what],
          quickReplies: [SHOW_HELD],
        });
      } catch (t) {
        // Template not approved yet: the messages wait until the person writes.
        d.log.error('deliver.notice_failed', { userId: to.userId, error: String(t) });
      }
      return 'held';
    }
  }
  return 'sent';
}

/** Sends what was held for the user, in order; how many went out. */
export async function flushHeld(
  d: Pick<DeliverDeps, 'held' | 'send' | 'log'>,
  userId: string,
  phone: string,
): Promise<number> {
  let sent = 0;
  for (const h of await d.held.pending(userId)) {
    try {
      await h.done(await d.send(phone, h.out));
      sent++;
    } catch (e) {
      d.log.error('held.send_failed', { userId, error: String(e) });
      break;
    }
  }
  return sent;
}

const BUCKET = 'outputs';

export class SupabaseHeldStore implements HeldStore {
  constructor(private readonly sb: SupabaseClient) {}

  async hold(userId: string, outs: Outgoing[]): Promise<void> {
    for (const out of outs) {
      let stored: Stored;
      if (out.type === 'document') {
        const path = `held/${randomUUID()}/${out.filename}`;
        const up = await this.sb.storage.from(BUCKET).upload(path, out.data, { contentType: out.mime });
        if (up.error) throw new Error(`hold upload: ${up.error.message}`);
        stored = {
          type: 'document',
          filename: out.filename,
          mime: out.mime,
          path,
          ...(out.caption ? { caption: out.caption } : {}),
        };
      } else stored = out;
      const { error } = await this.sb.from('outbound_messages').insert({
        user_id: userId,
        idempotency_key: `held:${randomUUID()}`,
        kind: 'free',
        payload: stored,
        status: 'queued',
      });
      if (error) throw new Error(`hold: ${error.message}`);
    }
  }

  async pending(userId: string) {
    const { data, error } = await this.sb
      .from('outbound_messages')
      .select('id, payload')
      .eq('user_id', userId)
      .eq('status', 'queued')
      .like('idempotency_key', 'held:%')
      .order('created_at');
    if (error) throw new Error(`held: ${error.message}`);
    const out = [];
    for (const r of data ?? []) {
      const p = r.payload as Stored;
      let msg: Outgoing;
      if (p.type === 'document') {
        const { data: blob, error: e } = await this.sb.storage.from(BUCKET).download(p.path);
        if (e || !blob) throw new Error(`held download: ${e?.message}`);
        msg = {
          type: 'document',
          filename: p.filename,
          mime: p.mime,
          data: Buffer.from(await blob.arrayBuffer()),
          ...(p.caption ? { caption: p.caption } : {}),
        };
      } else msg = p;
      out.push({
        out: msg,
        done: async (wamid: string) => {
          await this.sb
            .from('outbound_messages')
            .update({ status: 'sent', wamid, attempts: 1, sent_at: new Date().toISOString() })
            .eq('id', r.id);
        },
      });
    }
    return out;
  }
}
