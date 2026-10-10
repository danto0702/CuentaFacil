import type { Inbound, Outgoing } from '@cuentasbot/conversation';
import { parseWebhook, type RawMessage, type StatusUpdate } from '../whatsapp/parse.js';
import { verifySignature } from '../whatsapp/signature.js';

export interface InboxItem {
  id: number;
  provider: string;
  signature: string | null;
  body: string;
  status: string;
}

/** Persistence the pipeline needs (Supabase in production, in-memory in tests). */
export interface PipelineDb {
  getInbox(id: number): Promise<InboxItem | null>;
  markInbox(id: number, status: 'processed' | 'rejected' | 'failed', error?: string): Promise<void>;
  /** Records the inbound message; returns false if it was already processed (Meta retries deliveries). */
  claimInbound(m: RawMessage): Promise<boolean>;
  markInboundProcessed(wamid: string): Promise<void>;
  logOutbound(to: string, wamid: string, out: Outgoing): Promise<void>;
  applyStatus(s: StatusUpdate): Promise<void>;
}

export interface Messenger {
  send(to: string, out: Outgoing): Promise<string>;
  downloadMedia(mediaId: string): Promise<{ data: Buffer; mime: string }>;
  markRead(wamid: string): Promise<void>;
}

export interface Conversation {
  handle(msg: Inbound): Promise<Outgoing[]>;
}

export interface Logger {
  info(event: string, data?: Record<string, unknown>): void;
  error(event: string, data?: Record<string, unknown>): void;
}

export interface PipelineDeps {
  db: PipelineDb;
  messenger: Messenger;
  conversation: Conversation;
  appSecret: string;
  log: Logger;
  /** Retries for a single outgoing message (rate limits, 5xx). */
  sendAttempts?: number;
  sleep?: (ms: number) => Promise<void>;
}

const UNSUPPORTED =
  'Por ahora entiendo mensajes de texto, notas de voz, fotos y documentos (PDF). ¿Me lo puedes enviar de alguna de esas formas?';

/** Turns one stored webhook delivery into conversation turns and replies. */
export class InboundPipeline {
  private readonly sleep: (ms: number) => Promise<void>;

  constructor(private readonly deps: PipelineDeps) {
    this.sleep = deps.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
  }

  async processInbox(inboxId: number): Promise<void> {
    const { db, log } = this.deps;
    const item = await db.getInbox(inboxId);
    if (!item || item.status !== 'pending') return;

    if (!verifySignature(this.deps.appSecret, item.body, item.signature)) {
      log.error('webhook.bad_signature', { inboxId });
      await db.markInbox(inboxId, 'rejected', 'invalid signature');
      return;
    }

    let parsed: ReturnType<typeof parseWebhook>;
    try {
      parsed = parseWebhook(JSON.parse(item.body));
    } catch (e) {
      log.error('webhook.unparseable', { inboxId, error: String(e) });
      await db.markInbox(inboxId, 'rejected', 'unparseable payload');
      return;
    }

    for (const s of parsed.statuses) await db.applyStatus(s);
    for (const m of parsed.messages) await this.processMessage(m);
    await db.markInbox(inboxId, 'processed');
  }

  private async processMessage(m: RawMessage): Promise<void> {
    const { db, messenger, conversation, log } = this.deps;
    if (!(await db.claimInbound(m))) return;
    messenger.markRead(m.wamid).catch(() => undefined);
    log.info('message.in', { wamid: m.wamid, kind: m.kind });

    let replies: Outgoing[];
    if (m.kind === 'unsupported') {
      replies = [{ type: 'text', text: UNSUPPORTED }];
    } else {
      const inbound: Inbound = {
        id: m.wamid,
        from: m.from,
        at: m.at,
        kind: m.kind,
        ...(m.text !== undefined ? { text: m.text } : {}),
        ...(m.replyId !== undefined ? { replyId: m.replyId } : {}),
      };
      if (m.media) {
        const file = await messenger.downloadMedia(m.media.id);
        inbound.media = {
          data: file.data,
          mime: file.mime || m.media.mime,
          ...(m.media.filename ? { filename: m.media.filename } : {}),
        };
      }
      replies = await conversation.handle(inbound);
    }

    for (const out of replies) {
      const wamid = await this.sendWithRetry(m.from, out);
      await db.logOutbound(m.from, wamid, out);
    }
    await db.markInboundProcessed(m.wamid);
  }

  private async sendWithRetry(to: string, out: Outgoing): Promise<string> {
    const attempts = this.deps.sendAttempts ?? 3;
    for (let i = 1; ; i++) {
      try {
        return await this.deps.messenger.send(to, out);
      } catch (e) {
        const retryable = (e as { retryable?: boolean }).retryable === true;
        if (!retryable || i >= attempts) throw e;
        await this.sleep(1000 * 2 ** (i - 1));
      }
    }
  }
}
