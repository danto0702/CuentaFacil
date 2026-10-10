import type { Outgoing } from '@cuentasbot/conversation';
import { documentPayload, messagePayload } from './payload.js';

export interface WhatsAppConfig {
  accessToken: string;
  phoneNumberId: string;
  graphVersion: string;
  /** Injected in tests. */
  fetch?: typeof fetch;
}

export interface PhoneNumberInfo {
  display_phone_number?: string;
  verified_name?: string;
  quality_rating?: string;
  code_verification_status?: string;
  platform_type?: string;
  status?: string;
  name_status?: string;
}

export class WhatsAppError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: number,
  ) {
    super(message);
  }
  /** Rate limits and server errors are worth retrying; bad requests are not. */
  get retryable(): boolean {
    return this.status === 429 || this.status >= 500 || this.code === 130429 || this.code === 131056;
  }
}

/** Thin WhatsApp Cloud API client: send, upload/download media, mark as read. */
export class WhatsAppClient {
  private readonly base: string;
  private readonly http: typeof fetch;

  constructor(private readonly cfg: WhatsAppConfig) {
    this.base = `https://graph.facebook.com/${cfg.graphVersion}`;
    this.http = cfg.fetch ?? fetch;
  }

  private async call<T>(path: string, init: RequestInit): Promise<T> {
    const res = await this.http(`${this.base}/${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${this.cfg.accessToken}`, ...(init.headers ?? {}) },
    });
    const body = (await res.json().catch(() => ({}))) as {
      error?: { message?: string; code?: number };
    } & T;
    if (!res.ok) {
      throw new WhatsAppError(body.error?.message ?? `HTTP ${res.status}`, res.status, body.error?.code);
    }
    return body;
  }

  private postJson<T>(path: string, payload: unknown): Promise<T> {
    return this.call<T>(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  /** Sends one reply and returns its wamid. */
  async send(to: string, out: Outgoing): Promise<string> {
    const payload =
      out.type === 'document'
        ? documentPayload(
            to,
            await this.uploadMedia(out.data, out.mime, out.filename),
            out.filename,
            out.caption,
          )
        : messagePayload(to, out);
    const res = await this.postJson<{ messages: { id: string }[] }>(
      `${this.cfg.phoneNumberId}/messages`,
      payload,
    );
    const id = res.messages?.[0]?.id;
    if (!id) throw new WhatsAppError('WhatsApp did not return a message id', 502);
    return id;
  }

  async uploadMedia(data: Buffer, mime: string, filename: string): Promise<string> {
    const form = new FormData();
    form.append('messaging_product', 'whatsapp');
    form.append('type', mime);
    form.append('file', new Blob([new Uint8Array(data)], { type: mime }), filename);
    const res = await this.call<{ id: string }>(`${this.cfg.phoneNumberId}/media`, {
      method: 'POST',
      body: form,
    });
    return res.id;
  }

  async downloadMedia(mediaId: string): Promise<{ data: Buffer; mime: string }> {
    const meta = await this.call<{ url: string; mime_type: string }>(mediaId, { method: 'GET' });
    const res = await this.http(meta.url, { headers: { Authorization: `Bearer ${this.cfg.accessToken}` } });
    if (!res.ok) throw new WhatsAppError(`media download failed: HTTP ${res.status}`, res.status);
    return { data: Buffer.from(await res.arrayBuffer()), mime: meta.mime_type };
  }

  /** Status of the sending number, for the startup diagnostic. */
  phoneNumberInfo(): Promise<PhoneNumberInfo> {
    return this.call<PhoneNumberInfo>(
      `${this.cfg.phoneNumberId}?fields=display_phone_number,verified_name,quality_rating,code_verification_status,platform_type,status,name_status`,
      { method: 'GET' },
    );
  }

  /**
   * Makes sure the business account sends its webhooks to this app. Without this subscription Meta
   * verifies the callback URL but never delivers messages. Returns true when it had to subscribe.
   */
  async ensureSubscribed(businessAccountId: string): Promise<boolean> {
    const apps = await this.call<{ data: unknown[] }>(`${businessAccountId}/subscribed_apps`, {
      method: 'GET',
    });
    if (apps.data?.length) return false;
    await this.postJson(`${businessAccountId}/subscribed_apps`, {});
    return true;
  }

  async markRead(wamid: string): Promise<void> {
    await this.postJson(`${this.cfg.phoneNumberId}/messages`, {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: wamid,
    });
  }
}
