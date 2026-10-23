import type { Outgoing } from '@cuentasbot/conversation';

/** What the notice template says is waiting when the 24-hour window is closed (ADR-043). */
export const STAFF_WAITING = 'un mensaje del equipo de CuentaFácil';

/** A message the owner wrote in the panel (ADR-057), as stored in webhook_inbox. */
export interface StaffMessage {
  userId: string;
  text: string;
}

export function parseStaffMessage(body: string): StaffMessage | null {
  try {
    const b = JSON.parse(body) as { user_id?: unknown; text?: unknown };
    if (typeof b.user_id !== 'string' || typeof b.text !== 'string' || !b.text.trim()) return null;
    return { userId: b.user_id, text: b.text.trim() };
  } catch {
    return null;
  }
}

/** Signed, so the contractor knows a person wrote it and not Pascal. */
export function staffOutgoing(text: string): Outgoing {
  return { type: 'text', text: `👤 *Equipo CuentaFácil*\n\n${text}` };
}
