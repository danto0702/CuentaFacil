import type { Outgoing } from '@cuentasbot/conversation';
import { BRAND } from '@cuentasbot/conversation';
import type { StatusUpdate } from '../whatsapp/parse.js';

/** Marks the logged copy of the authorization template (main.ts inviteDelegate). */
export const DELEGATION_TEMPLATE_TAG = '[plantilla autorizar_gestor]';

export interface DelegationFailedDeps {
  /** Summary of the logged outgoing message with this wamid, if any. */
  summaryOf(wamid: string): Promise<string | null>;
  pendingDelegationsFor(phone: string): Promise<{ managerId: string; personName: string }[]>;
  notifyUser(userId: string, out: Outgoing): Promise<void>;
}

export function delegationFailedNotice(personName: string, phone: string): Outgoing {
  const name = personName.split(/\s+/).slice(0, 3).join(' ') || 'la persona';
  return {
    type: 'text',
    text:
      `⚠️ WhatsApp no le entregó a *${name}* (${phone}) la solicitud para que autorice que prepares sus cuentas.\n\n` +
      `Pídele que me escriba *Hola* a este número: https://wa.me/${BRAND.whatsapp}\n` +
      'Apenas me escriba, le pido la autorización ahí mismo.',
  };
}

/**
 * Meta can refuse a template after accepting it (e.g. 131049): the gestor was already told it was
 * sent, so they get a second message saying it did not arrive and how to fix it (ADR-064).
 */
export async function onDelegationTemplateFailed(
  deps: DelegationFailedDeps,
  s: StatusUpdate,
): Promise<boolean> {
  if (s.status !== 'failed') return false;
  const summary = await deps.summaryOf(s.wamid);
  if (!summary?.startsWith(DELEGATION_TEMPLATE_TAG)) return false;
  const pending = await deps.pendingDelegationsFor(s.recipient);
  for (const d of pending)
    await deps.notifyUser(d.managerId, delegationFailedNotice(d.personName, s.recipient));
  return pending.length > 0;
}
