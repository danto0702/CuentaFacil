import type { Inbound, Outgoing } from '@cuentasbot/conversation';

/**
 * Requests from the contractor portal (ADR-061), as stored in webhook_inbox by portal_request and
 * portal_recovery: a turn of the conversation (answered in the WhatsApp chat) or a password link.
 */
export type PortalRequest =
  | {
      action: 'turn';
      userId: string;
      text?: string;
      reply?: string;
      /** The contract the page is about: answers «¿De cuál contrato?» (ADR-065). */
      contractId?: string;
      /** A gestor asking for this person (ADR-065): the turn runs from the gestor's WhatsApp. */
      actorId?: string;
    }
  | { action: 'recovery'; userId: string };

export function parsePortalRequest(body: string): PortalRequest | null {
  try {
    const b = JSON.parse(body) as Record<string, unknown>;
    if (typeof b.user_id !== 'string') return null;
    if (b.action === 'recovery') return { action: 'recovery', userId: b.user_id };
    if (b.action !== 'turn') return null;
    const extra = {
      ...(typeof b.contract_id === 'string' && b.contract_id ? { contractId: b.contract_id } : {}),
      ...(typeof b.actor_id === 'string' && b.actor_id ? { actorId: b.actor_id } : {}),
    };
    if (typeof b.text === 'string' && b.text)
      return { action: 'turn', userId: b.user_id, text: b.text, ...extra };
    if (typeof b.reply === 'string' && b.reply)
      return { action: 'turn', userId: b.user_id, reply: b.reply, ...extra };
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

const offers = (o: Outgoing, id: string): boolean =>
  (o.type === 'buttons' && o.buttons.some((b) => b.id === id)) ||
  (o.type === 'list' && o.rows.some((r) => r.id === id));

/**
 * A portal request as conversation turns (ADR-065). A gestor's request first switches their chat to the
 * person («who:<id>»); when Pascal asks which contract, the page's contract answers for them.
 */
export async function runPortalTurn(
  handle: (msg: Inbound) => Promise<Outgoing[]>,
  req: Extract<PortalRequest, { action: 'turn' }>,
  msg: { id: string; from: string; at: Date },
): Promise<Outgoing[]> {
  if (req.actorId) {
    const switched = await handle({
      ...msg,
      id: `${msg.id}-who`,
      kind: 'reply',
      replyId: `who:${req.userId}`,
    });
    // Not authorized any more: that is the answer.
    if (switched.some((o) => o.type === 'text' && o.text.startsWith('No tengo autorización')))
      return switched;
  }
  const out = await handle({
    ...msg,
    kind: req.text ? 'text' : 'reply',
    ...(req.text ? { text: req.text } : { replyId: req.reply! }),
  });
  const pick = req.contractId ? `c:${req.contractId}` : null;
  const at = pick ? out.findIndex((o) => offers(o, pick)) : -1;
  if (pick && at >= 0) {
    out.splice(at, 1);
    out.push(...(await handle({ ...msg, id: `${msg.id}-pick`, kind: 'reply', replyId: pick })));
  }
  return out;
}
