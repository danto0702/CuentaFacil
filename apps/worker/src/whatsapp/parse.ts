import { z } from 'zod';

/** One user message from a WhatsApp Cloud API webhook, before media is downloaded. */
export interface RawMessage {
  wamid: string;
  /** E.164 with leading "+". */
  from: string;
  at: Date;
  kind: 'text' | 'reply' | 'image' | 'document' | 'audio' | 'unsupported';
  text?: string;
  replyId?: string;
  media?: { id: string; mime: string; filename?: string };
  /** Original Meta type, for logs ("sticker", "location"…). */
  metaType: string;
}

export interface StatusUpdate {
  wamid: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  recipient: string;
  at: Date;
  pricingCategory?: string;
  error?: string;
}

const media = z.object({
  id: z.string(),
  mime_type: z.string(),
  caption: z.string().optional(),
  filename: z.string().optional(),
});

const message = z.object({
  id: z.string(),
  from: z.string(),
  timestamp: z.string(),
  type: z.string(),
  text: z.object({ body: z.string() }).optional(),
  interactive: z
    .object({
      type: z.string(),
      button_reply: z.object({ id: z.string(), title: z.string() }).optional(),
      list_reply: z.object({ id: z.string(), title: z.string() }).optional(),
    })
    .optional(),
  button: z.object({ payload: z.string().optional(), text: z.string() }).optional(),
  image: media.optional(),
  document: media.optional(),
  audio: media.optional(),
});

const status = z.object({
  id: z.string(),
  status: z.enum(['sent', 'delivered', 'read', 'failed']),
  timestamp: z.string(),
  recipient_id: z.string(),
  pricing: z.object({ category: z.string().optional() }).optional(),
  errors: z.array(z.object({ code: z.number().optional(), title: z.string().optional() })).optional(),
});

const webhook = z.object({
  object: z.literal('whatsapp_business_account'),
  entry: z.array(
    z.object({
      changes: z.array(
        z.object({
          field: z.string(),
          value: z.object({
            messages: z.array(message).optional(),
            statuses: z.array(status).optional(),
          }),
        }),
      ),
    }),
  ),
});

const e164 = (waId: string) => (waId.startsWith('+') ? waId : `+${waId}`);
const fromUnix = (s: string) => new Date(Number(s) * 1000);

function toRaw(m: z.infer<typeof message>): RawMessage {
  const base = { wamid: m.id, from: e164(m.from), at: fromUnix(m.timestamp), metaType: m.type };
  switch (m.type) {
    case 'text':
      return { ...base, kind: 'text', text: m.text?.body ?? '' };
    case 'interactive': {
      const r = m.interactive?.button_reply ?? m.interactive?.list_reply;
      return r ? { ...base, kind: 'reply', replyId: r.id, text: r.title } : { ...base, kind: 'unsupported' };
    }
    case 'button':
      return { ...base, kind: 'reply', replyId: m.button?.payload ?? m.button?.text, text: m.button?.text };
    case 'image':
    case 'document':
    case 'audio': {
      const md = m[m.type];
      if (!md) return { ...base, kind: 'unsupported' };
      return {
        ...base,
        kind: m.type,
        ...(md.caption ? { text: md.caption } : {}),
        media: { id: md.id, mime: md.mime_type, ...(md.filename ? { filename: md.filename } : {}) },
      };
    }
    default:
      return { ...base, kind: 'unsupported' };
  }
}

/** Parses a webhook body. Throws on payloads that are not WhatsApp Business Account notifications. */
export function parseWebhook(body: unknown): { messages: RawMessage[]; statuses: StatusUpdate[] } {
  const parsed = webhook.parse(body);
  const messages: RawMessage[] = [];
  const statuses: StatusUpdate[] = [];
  for (const entry of parsed.entry) {
    for (const change of entry.changes) {
      if (change.field !== 'messages') continue;
      for (const m of change.value.messages ?? []) messages.push(toRaw(m));
      for (const s of change.value.statuses ?? []) {
        const err = s.errors?.[0];
        statuses.push({
          wamid: s.id,
          status: s.status,
          recipient: e164(s.recipient_id),
          at: fromUnix(s.timestamp),
          ...(s.pricing?.category ? { pricingCategory: s.pricing.category } : {}),
          ...(err ? { error: `${err.code ?? ''} ${err.title ?? ''}`.trim() } : {}),
        });
      }
    }
  }
  messages.sort((a, b) => a.at.getTime() - b.at.getTime());
  return { messages, statuses };
}
