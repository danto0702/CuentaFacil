import type { Outgoing } from '@cuentasbot/conversation';

/** WhatsApp Cloud API limits. */
const BODY_MAX = 1024;
const TEXT_MAX = 4096;

const clip = (s: string, n: number) => (s.length <= n ? s : `${s.slice(0, n - 1)}…`);

/** Builds the /messages JSON for a non-document reply (documents need an uploaded media id first). */
export function messagePayload(
  to: string,
  out: Exclude<Outgoing, { type: 'document' }>,
): Record<string, unknown> {
  const base = { messaging_product: 'whatsapp', recipient_type: 'individual', to: to.replace(/^\+/, '') };
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
    to: to.replace(/^\+/, ''),
    type: 'document',
    document: { id: mediaId, filename, ...(caption ? { caption: clip(caption, BODY_MAX) } : {}) },
  };
}
