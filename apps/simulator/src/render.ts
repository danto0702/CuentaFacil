import type { Outgoing } from '@cuentasbot/conversation';

/** Renders bot messages as a chat in the terminal; interactive options are numbered. */
export function renderOutgoing(o: Outgoing, savedPath?: string): string {
  switch (o.type) {
    case 'text':
      return `🤖 ${o.text}`;
    case 'buttons':
      return `🤖 ${o.text}\n${o.buttons.map((b, i) => `   [${i + 1}] ${b.title}`).join('\n')}`;
    case 'list':
      return `🤖 ${o.text}\n   ☰ ${o.button}\n${o.rows.map((r, i) => `   (${i + 1}) ${r.title}${r.description ? ` — ${r.description}` : ''}`).join('\n')}`;
    case 'cta_url':
      return `🤖 ${o.text}\n   [🔗 ${o.button}] ${o.url}`;
    case 'document':
      return `🤖 📎 ${o.filename}${savedPath ? `  →  ${savedPath}` : ''}`;
  }
}
