import { createHmac, timingSafeEqual } from 'node:crypto';

/** Verifies Meta's X-Hub-Signature-256 header ("sha256=<hex>") over the raw request body. */
export function verifySignature(
  appSecret: string,
  rawBody: string,
  header: string | null | undefined,
): boolean {
  if (!appSecret || !header?.startsWith('sha256=')) return false;
  const expected = createHmac('sha256', appSecret).update(rawBody, 'utf8').digest();
  const given = Buffer.from(header.slice('sha256='.length), 'hex');
  return given.length === expected.length && timingSafeEqual(given, expected);
}
