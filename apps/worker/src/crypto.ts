import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'node:crypto';

/**
 * Application-level encryption for document and bank-account numbers (ADR-005):
 * AES-256-GCM ciphertext as "<keyId>:<iv>:<tag>:<data>" (base64url), plus an HMAC blind index for lookups.
 */
export class FieldCipher {
  private readonly key: Buffer;
  private readonly indexKey: Buffer;

  constructor(
    encryptionKeyB64: string,
    blindIndexKeyB64: string,
    private readonly keyId = 'v1',
  ) {
    this.key = Buffer.from(encryptionKeyB64, 'base64');
    this.indexKey = Buffer.from(blindIndexKeyB64, 'base64');
    if (this.key.length !== 32) throw new Error('ENCRYPTION_KEY must be 32 bytes (base64)');
    if (this.indexKey.length < 32) throw new Error('BLIND_INDEX_KEY must be at least 32 bytes (base64)');
  }

  encrypt(plain: string): string {
    const iv = randomBytes(12);
    const c = createCipheriv('aes-256-gcm', this.key, iv);
    const data = Buffer.concat([c.update(plain, 'utf8'), c.final()]);
    return [this.keyId, iv, c.getAuthTag(), data]
      .map((p) => (typeof p === 'string' ? p : p.toString('base64url')))
      .join(':');
  }

  decrypt(token: string): string {
    const [, iv, tag, data] = token.split(':');
    if (!iv || !tag || !data) throw new Error('malformed ciphertext');
    const d = createDecipheriv('aes-256-gcm', this.key, Buffer.from(iv, 'base64url'));
    d.setAuthTag(Buffer.from(tag, 'base64url'));
    return Buffer.concat([d.update(Buffer.from(data, 'base64url')), d.final()]).toString('utf8');
  }

  /** Deterministic index over the normalized value (digits only for document numbers). */
  blindIndex(value: string): string {
    return createHmac('sha256', this.indexKey).update(value.replace(/\D/g, '')).digest('base64url');
  }
}

export const last4 = (value: string) => value.replace(/\D/g, '').slice(-4);
