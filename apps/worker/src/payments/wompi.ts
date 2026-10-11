import { createHash, timingSafeEqual } from 'node:crypto';
import type { Charge } from '@cuentasbot/conversation';

/**
 * Wompi (Bancolombia) web checkout and event verification. Sandbox or production is decided by the keys
 * (pub_test_… / pub_prod_…); the checkout URL is the same.
 */
export interface WompiConfig {
  publicKey: string;
  integritySecret: string;
  eventsSecret?: string;
  /** Where Wompi sends the contractor after paying (back to the WhatsApp chat). */
  redirectUrl?: string;
}

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

export function checkoutUrl(cfg: WompiConfig, charge: Charge): string {
  const cents = charge.amount * 100;
  const params = new URLSearchParams({
    'public-key': cfg.publicKey,
    currency: 'COP',
    'amount-in-cents': String(cents),
    reference: charge.reference,
    // Integrity signature: SHA256(reference + amount in cents + currency + integrity secret).
    'signature:integrity': sha256(`${charge.reference}${cents}COP${cfg.integritySecret}`),
  });
  if (cfg.redirectUrl) params.set('redirect-url', cfg.redirectUrl);
  return `https://checkout.wompi.co/p/?${params.toString()}`;
}

export interface WompiTransaction {
  id: string;
  status: 'APPROVED' | 'DECLINED' | 'VOIDED' | 'ERROR' | 'PENDING' | string;
  reference: string;
  amountInCents: number;
}

/**
 * Verifies an event with the events secret: SHA256 of the values named in signature.properties (paths
 * inside `data`), then the timestamp, then the secret. Returns the transaction, or null if it is not
 * a valid transaction.updated event.
 */
export function verifyEvent(eventsSecret: string, body: string): WompiTransaction | null {
  let e: {
    event?: string;
    data?: { transaction?: Record<string, unknown> };
    signature?: { properties?: string[]; checksum?: string };
    timestamp?: number;
  };
  try {
    e = JSON.parse(body);
  } catch {
    return null;
  }
  const props = e.signature?.properties;
  const checksum = e.signature?.checksum;
  if (!e.data || !props?.length || !checksum || e.timestamp === undefined) return null;
  const value = (path: string) =>
    path.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown> | undefined)?.[k], e.data);
  const expected = sha256(
    `${props.map((p) => String(value(p) ?? '')).join('')}${e.timestamp}${eventsSecret}`,
  );
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(checksum.toLowerCase(), 'utf8');
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const t = e.data.transaction;
  if (e.event !== 'transaction.updated' || !t) return null;
  return {
    id: String(t.id ?? ''),
    status: String(t.status ?? ''),
    reference: String(t.reference ?? ''),
    amountInCents: Number(t.amount_in_cents ?? 0),
  };
}
