import type { Outgoing } from '@cuentasbot/conversation';

/**
 * Requests from the contractor portal (ADR-061), as stored in webhook_inbox by portal_request and
 * portal_recovery: a turn of the conversation (answered in the WhatsApp chat) or a password link.
 */
export type PortalRequest =
  | { action: 'turn'; userId: string; text?: string; reply?: string }
  | { action: 'recovery'; userId: string };

export function parsePortalRequest(body: string): PortalRequest | null {
  try {
    const b = JSON.parse(body) as { action?: unknown; user_id?: unknown; text?: unknown; reply?: unknown };
    if (typeof b.user_id !== 'string') return null;
    if (b.action === 'recovery') return { action: 'recovery', userId: b.user_id };
    if (b.action !== 'turn') return null;
    if (typeof b.text === 'string' && b.text) return { action: 'turn', userId: b.user_id, text: b.text };
    if (typeof b.reply === 'string' && b.reply) return { action: 'turn', userId: b.user_id, reply: b.reply };
    return null;
  } catch {
    return null;
  }
}

/** What the notice template says is waiting when the 24-hour window is closed (ADR-043). */
export const PORTAL_WAITING = 'la respuesta a lo que pediste en tu cuenta web';
export const RECOVERY_WAITING = 'el enlace para cambiar tu contraseña';

/** Where the recovery link lands: the portal verifies it and asks for the new password. */
export function recoveryUrl(portalUrl: string, hashedToken: string): string {
  const u = new URL('/auth/confirm', portalUrl);
  u.searchParams.set('token_hash', hashedToken);
  u.searchParams.set('type', 'recovery');
  u.searchParams.set('next', '/restablecer');
  return u.toString();
}

export function recoveryMessage(url: string): Outgoing {
  return {
    type: 'text',
    text: `🔑 Pediste cambiar la contraseña de tu cuenta web de CuentaFacil. Toca este enlace para crear una nueva (vence en 1 hora):\n${url}\n\nSi no fuiste tú, ignora este mensaje: tu contraseña sigue igual.`,
  };
}
