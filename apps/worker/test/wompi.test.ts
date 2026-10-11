import { createHash } from 'node:crypto';
import type { Charge } from '@cuentasbot/conversation';
import { describe, expect, it } from 'vitest';
import { checkoutUrl, verifyEvent } from '../src/payments/wompi.js';

const charge: Charge = {
  id: 'c1',
  userId: 'u1',
  product: 'report',
  contractId: 'k1',
  periodNumber: 2,
  coversSetup: false,
  amount: 50_000,
  status: 'pending',
  method: null,
  reference: 'CF-ABC123',
};
const sha = (s: string) => createHash('sha256').update(s).digest('hex');

describe('Wompi', () => {
  it('builds a signed checkout link in cents', () => {
    const url = new URL(
      checkoutUrl({ publicKey: 'pub_test_x', integritySecret: 'test_integrity_s' }, charge),
    );
    expect(url.origin).toBe('https://checkout.wompi.co');
    expect(url.searchParams.get('amount-in-cents')).toBe('5000000');
    expect(url.searchParams.get('reference')).toBe('CF-ABC123');
    expect(url.searchParams.get('signature:integrity')).toBe(sha('CF-ABC1235000000COPtest_integrity_s'));
  });

  it('accepts a correctly signed event and rejects a tampered one', () => {
    const tx = {
      id: '1234-1610641025-49201',
      status: 'APPROVED',
      reference: 'CF-ABC123',
      amount_in_cents: 5000000,
    };
    const props = ['transaction.id', 'transaction.status', 'transaction.amount_in_cents'];
    const timestamp = 1791650000;
    const checksum = sha(`${tx.id}${tx.status}${tx.amount_in_cents}${timestamp}test_events_s`);
    const body = (t: typeof tx) =>
      JSON.stringify({
        event: 'transaction.updated',
        data: { transaction: t },
        signature: { properties: props, checksum },
        timestamp,
      });
    expect(verifyEvent('test_events_s', body(tx))).toEqual({
      id: tx.id,
      status: 'APPROVED',
      reference: 'CF-ABC123',
      amountInCents: 5000000,
    });
    expect(verifyEvent('test_events_s', body({ ...tx, amount_in_cents: 100 }))).toBeNull();
    expect(verifyEvent('other_secret', body(tx))).toBeNull();
    expect(verifyEvent('test_events_s', 'not json')).toBeNull();
  });
});
