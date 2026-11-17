import 'server-only';
import { createHash } from 'node:crypto';

/**
 * Wompi web checkout for the portal's «Pagar en línea» (same link the chat sends, ADR-034). The keys are the
 * worker's, shared with the panel service as reference variables; without them the button is hidden.
 */
export function wompiConfigured(): boolean {
  return Boolean(process.env.WOMPI_PUBLIC_KEY && process.env.WOMPI_INTEGRITY_SECRET);
}

export function checkoutUrl(charge: { reference: string; amount: number }, redirectUrl?: string): string {
  const cents = charge.amount * 100;
  const params = new URLSearchParams({
    'public-key': process.env.WOMPI_PUBLIC_KEY ?? '',
    currency: 'COP',
    'amount-in-cents': String(cents),
    reference: charge.reference,
    // Integrity signature: SHA256(reference + amount in cents + currency + integrity secret).
    'signature:integrity': createHash('sha256')
      .update(`${charge.reference}${cents}COP${process.env.WOMPI_INTEGRITY_SECRET ?? ''}`)
      .digest('hex'),
  });
  if (redirectUrl) params.set('redirect-url', redirectUrl);
  return `https://checkout.wompi.co/p/?${params.toString()}`;
}
