import type { Outgoing } from '@cuentasbot/conversation';

/** WhatsApp Cloud API limits. */
const BODY_MAX = 1024;
const TEXT_MAX = 4096;

/** Phone numbers go in `to`; a business-scoped user id (user with a WhatsApp username) in `recipient`. */
function addressee(to: string): Record<string, string> {
  return /^[A-Z]{2}\.[A-Za-z0-9]+$/.test(to) ? { recipient: to } : { to: to.replace(/^\+/, '') };
}

const clip = (s: string, n: number) => (s.length <= n ? s : `${s.slice(0, n - 1)}…`);

/** An approved template: the only way to write first outside the 24-hour window. */
export interface TemplateMessage {
  name: string;
  language: string;
  /** Values for {{1}}, {{2}}… of the body. */
  body: string[];
  /** Payload of each quick-reply button, in order; it comes back as the reply id. */
  quickReplies?: string[];
}

export function templatePayload(to: string, t: TemplateMessage): Record<string, unknown> {
  return {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    ...addressee(to),
    type: 'template',
    template: {
      name: t.name,
      language: { code: t.language },
      components: [
        // Template variables cannot carry line breaks or tabs.
        {
          type: 'body',
          parameters: t.body.map((v) => ({ type: 'text', text: clip(v.replace(/\s+/g, ' ').trim(), 300) })),
        },
        ...(t.quickReplies ?? []).map((payload, index) => ({
          type: 'button',
          sub_type: 'quick_reply',
          index: String(index),
          parameters: [{ type: 'payload', payload }],
        })),
      ],
    },
  };
}

/** Builds the /messages JSON for a non-document reply (documents need an uploaded media id first). */
export function messagePayload(
  to: string,
  out: Exclude<Outgoing, { type: 'document' }>,
): Record<string, unknown> {
  const base = { messaging_product: 'whatsapp', recipient_type: 'individual', ...addressee(to) };
  switch (out.type) {
    case 'text':
      return { ...base, type: 'text', text: { body: clip(out.text, TEXT_MAX), preview_url: false } };
    case 'buttons':
      return {
        ...base,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: { text: clip(out.text, BODY_MAX) },
          action: {
            buttons: out.buttons
              .slice(0, 3)
              .map((b) => ({ type: 'reply', reply: { id: b.id, title: clip(b.title, 20) } })),
          },
        },
      };
    case 'list':
      return {
        ...base,
        type: 'interactive',
        interactive: {
          type: 'list',
          body: { text: clip(out.text, BODY_MAX) },
          action: {
            button: clip(out.button, 20),
            sections: [
              {
                title: 'Opciones',
                rows: out.rows.slice(0, 10).map((r) => ({
                  id: r.id,
                  title: clip(r.title, 24),
                  ...(r.description ? { description: clip(r.description, 72) } : {}),
                })),
              },
            ],
          },
        },
      };
    case 'cta_url':
      return {
        ...base,
        type: 'interactive',
        interactive: {
          type: 'cta_url',
          body: { text: clip(out.text, BODY_MAX) },
          action: { name: 'cta_url', parameters: { display_text: clip(out.button, 20), url: out.url } },
        },
      };
  }
}

export function documentPayload(
  to: string,
  mediaId: string,
  filename: string,
  caption?: string,
): Record<string, unknown> {
  return {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    ...addressee(to),
    type: 'document',
    document: { id: mediaId, filename, ...(caption ? { caption: clip(caption, BODY_MAX) } : {}) },
  };
}
