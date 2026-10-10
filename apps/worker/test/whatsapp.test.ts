import { createHmac } from 'node:crypto';
import type { Inbound, Outgoing } from '@cuentasbot/conversation';
import { describe, expect, it } from 'vitest';
import { InboundPipeline, type InboxItem, type PipelineDb } from '../src/runtime/pipeline.js';
import { WhatsAppClient } from '../src/whatsapp/client.js';
import { parseWebhook, type RawMessage, type StatusUpdate } from '../src/whatsapp/parse.js';
import { messagePayload } from '../src/whatsapp/payload.js';
import { verifySignature } from '../src/whatsapp/signature.js';

const SECRET = 'test-app-secret';
const sign = (body: string) => `sha256=${createHmac('sha256', SECRET).update(body).digest('hex')}`;

const webhook = (messages: unknown[], statuses: unknown[] = []) =>
  JSON.stringify({
    object: 'whatsapp_business_account',
    entry: [
      {
        id: 'WABA',
        changes: [{ field: 'messages', value: { messaging_product: 'whatsapp', messages, statuses } }],
      },
    ],
  });

const textMsg = (id: string, body: string, ts = '1791650000') => ({
  id,
  from: '573001112233',
  timestamp: ts,
  type: 'text',
  text: { body },
});

describe('signature', () => {
  it('accepts the right HMAC and rejects anything else', () => {
    const body = '{"a":1}';
    expect(verifySignature(SECRET, body, sign(body))).toBe(true);
    expect(verifySignature(SECRET, `${body} `, sign(body))).toBe(false);
    expect(verifySignature(SECRET, body, 'sha256=00')).toBe(false);
    expect(verifySignature(SECRET, body, null)).toBe(false);
    expect(verifySignature('', body, sign(body))).toBe(false);
  });
});

describe('parseWebhook', () => {
  it('maps text, replies, media and statuses; sorts by time', () => {
    const body = JSON.parse(
      webhook(
        [
          textMsg('w2', 'hola', '1791650010'),
          {
            id: 'w1',
            from: '573001112233',
            timestamp: '1791650000',
            type: 'interactive',
            interactive: { type: 'button_reply', button_reply: { id: 'menu:about', title: 'Conocer' } },
          },
          {
            id: 'w3',
            from: '573001112233',
            timestamp: '1791650020',
            type: 'audio',
            audio: { id: 'M1', mime_type: 'audio/ogg; codecs=opus', voice: true },
          },
          {
            id: 'w4',
            from: '573001112233',
            timestamp: '1791650030',
            type: 'document',
            document: { id: 'M2', mime_type: 'application/pdf', filename: 'contrato.pdf' },
          },
          { id: 'w5', from: '573001112233', timestamp: '1791650040', type: 'sticker', sticker: { id: 'S' } },
        ],
        [
          {
            id: 'out1',
            status: 'delivered',
            timestamp: '1791650050',
            recipient_id: '573001112233',
            pricing: { category: 'service' },
          },
        ],
      ),
    );
    const { messages, statuses } = parseWebhook(body);
    expect(messages.map((m) => [m.wamid, m.kind])).toEqual([
      ['w1', 'reply'],
      ['w2', 'text'],
      ['w3', 'audio'],
      ['w4', 'document'],
      ['w5', 'unsupported'],
    ]);
    expect(messages[0]).toMatchObject({ from: '+573001112233', replyId: 'menu:about' });
    expect(messages[3]?.media).toEqual({ id: 'M2', mime: 'application/pdf', filename: 'contrato.pdf' });
    expect(statuses).toEqual([
      {
        wamid: 'out1',
        status: 'delivered',
        recipient: '+573001112233',
        at: new Date(1791650050_000),
        pricingCategory: 'service',
      },
    ]);
  });

  it('rejects payloads that are not WhatsApp notifications', () => {
    expect(() => parseWebhook({ object: 'page', entry: [] })).toThrow();
  });
});

describe('messagePayload', () => {
  it('builds interactive buttons, lists and cta_url within Meta limits', () => {
    const b = messagePayload('+573001112233', {
      type: 'buttons',
      text: 'x',
      buttons: [{ id: 'a', title: 'Un título demasiado largo' }],
    });
    expect(b).toMatchObject({ to: '573001112233', type: 'interactive' });
    expect(JSON.stringify(b)).toContain('"title":"Un título demasiado…"');
    const l = messagePayload('+57300', {
      type: 'list',
      text: 'x',
      button: 'Elegir',
      rows: [{ id: 'r', title: 'Fila', description: 'd' }],
    });
    expect(l).toMatchObject({ interactive: { type: 'list', action: { button: 'Elegir' } } });
    const c = messagePayload('+57300', {
      type: 'cta_url',
      text: 'x',
      button: 'Ir',
      url: 'https://pascalia.lat/',
    });
    expect(c).toMatchObject({
      interactive: {
        type: 'cta_url',
        action: { name: 'cta_url', parameters: { url: 'https://pascalia.lat/' } },
      },
    });
  });
});

class MemoryDb implements PipelineDb {
  inbox = new Map<number, InboxItem>();
  inbound = new Map<string, boolean>();
  out: { to: string; wamid: string; out: Outgoing }[] = [];
  statuses: StatusUpdate[] = [];
  async getInbox(id: number) {
    return this.inbox.get(id) ?? null;
  }
  async markInbox(id: number, status: 'processed' | 'rejected' | 'failed', error?: string) {
    const it = this.inbox.get(id);
    if (it) this.inbox.set(id, { ...it, status: error ? `${status}:${error}` : status });
  }
  async claimInbound(m: RawMessage) {
    if (!this.inbound.has(m.wamid)) this.inbound.set(m.wamid, false);
    return this.inbound.get(m.wamid) === false;
  }
  async markInboundProcessed(wamid: string) {
    this.inbound.set(wamid, true);
  }
  async logOutbound(to: string, wamid: string, out: Outgoing) {
    this.out.push({ to, wamid, out });
  }
  async applyStatus(s: StatusUpdate) {
    this.statuses.push(s);
  }
}

function setup(sendImpl?: (n: number) => void) {
  const db = new MemoryDb();
  const seen: Inbound[] = [];
  let sends = 0;
  const pipeline = new InboundPipeline({
    db,
    appSecret: SECRET,
    log: { info: () => undefined, error: () => undefined },
    sleep: async () => undefined,
    messenger: {
      send: async () => {
        sends++;
        sendImpl?.(sends);
        return `out-${sends}`;
      },
      downloadMedia: async () => ({ data: Buffer.from('pdf'), mime: 'application/pdf' }),
      markRead: async () => undefined,
    },
    conversation: {
      handle: async (m) => {
        seen.push(m);
        return [{ type: 'text', text: `eco: ${m.text ?? m.kind}` }];
      },
    },
  });
  const put = (id: number, body: string, signature = sign(body)) =>
    db.inbox.set(id, { id, provider: 'whatsapp', signature, body, status: 'pending' });
  return { db, seen, pipeline, put };
}

describe('InboundPipeline', () => {
  it('verifies, runs the conversation once per wamid and logs replies', async () => {
    const { db, seen, pipeline, put } = setup();
    const body = webhook([textMsg('w1', 'hola')]);
    put(1, body);
    put(2, body); // Meta retry of the same message
    await pipeline.processInbox(1);
    await pipeline.processInbox(2);
    expect(seen).toHaveLength(1);
    expect(seen[0]).toMatchObject({ id: 'w1', from: '+573001112233', kind: 'text', text: 'hola' });
    expect(db.out.map((o) => o.wamid)).toEqual(['out-1']);
    expect(db.inbox.get(1)?.status).toBe('processed');
  });

  it('rejects bad signatures without touching the conversation', async () => {
    const { db, seen, pipeline, put } = setup();
    put(1, webhook([textMsg('w1', 'hola')]), 'sha256=deadbeef');
    await pipeline.processInbox(1);
    expect(seen).toHaveLength(0);
    expect(db.inbox.get(1)?.status).toBe('rejected:invalid signature');
  });

  it('downloads media and retries retryable send errors', async () => {
    const { db, seen, pipeline, put } = setup((n) => {
      if (n === 1) throw Object.assign(new Error('rate limited'), { retryable: true });
    });
    put(
      1,
      webhook([
        {
          id: 'w9',
          from: '573001112233',
          timestamp: '1791650000',
          type: 'document',
          document: { id: 'M', mime_type: 'application/pdf', filename: 'c.pdf' },
        },
      ]),
    );
    await pipeline.processInbox(1);
    expect(seen[0]?.media).toMatchObject({ mime: 'application/pdf', filename: 'c.pdf' });
    expect(db.out).toHaveLength(1);
  });

  it('answers unsupported message types without calling the conversation', async () => {
    const { db, seen, pipeline, put } = setup();
    put(
      1,
      webhook([
        { id: 'w5', from: '573001112233', timestamp: '1791650000', type: 'sticker', sticker: { id: 'S' } },
      ]),
    );
    await pipeline.processInbox(1);
    expect(seen).toHaveLength(0);
    expect(db.out[0]?.out.type).toBe('text');
  });
});

describe('WhatsAppClient.ensureSubscribed', () => {
  function client(existing: unknown[]) {
    const calls: string[] = [];
    const fake = (async (url: string, init?: RequestInit) => {
      calls.push(`${init?.method ?? 'GET'} ${url.replace('https://graph.facebook.com/v23.0/', '')}`);
      const body = init?.method === 'POST' ? { success: true } : { data: existing };
      return new Response(JSON.stringify(body), { status: 200 });
    }) as typeof fetch;
    return {
      calls,
      wa: new WhatsAppClient({ accessToken: 't', phoneNumberId: '1', graphVersion: 'v23.0', fetch: fake }),
    };
  }

  it('subscribes the business account only when no app is subscribed', async () => {
    const empty = client([]);
    expect(await empty.wa.ensureSubscribed('99')).toBe(true);
    expect(empty.calls).toEqual(['GET 99/subscribed_apps', 'POST 99/subscribed_apps']);
    const done = client([{ whatsapp_business_api_data: { id: 'app' } }]);
    expect(await done.wa.ensureSubscribed('99')).toBe(false);
    expect(done.calls).toEqual(['GET 99/subscribed_apps']);
  });
});
