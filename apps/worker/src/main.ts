/**
 * Worker entry point (Railway): consumes the `inbound` queue fed by the wa-webhook Edge Function,
 * runs the conversation and replies through the WhatsApp Cloud API.
 */
import { randomUUID } from 'node:crypto';
import Anthropic from '@anthropic-ai/sdk';
import { BogotaClock, Orchestrator } from '@cuentasbot/conversation';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { ClaudeAI } from './ai/claude-ai.js';
import { Llm } from './ai/llm.js';
import { OpenAISTT } from './ai/openai-stt.js';
import { FieldCipher } from './crypto.js';
import { AccountGenerator } from './generator.js';
import { loadConfig } from './runtime/config.js';
import { jsonLogger as log } from './runtime/log.js';
import { InboundPipeline } from './runtime/pipeline.js';
import { Queue } from './runtime/queue.js';
import { SupabasePipelineDb } from './runtime/supabase-db.js';
import { SupabaseStore } from './store/supabase-store.js';
import { CodeTemplateProvider } from './templates.js';
import { WhatsAppClient } from './whatsapp/client.js';
import { parseWebhook } from './whatsapp/parse.js';

const cfg = loadConfig();
const sb = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const cipher =
  cfg.ENCRYPTION_KEY && cfg.BLIND_INDEX_KEY ? new FieldCipher(cfg.ENCRYPTION_KEY, cfg.BLIND_INDEX_KEY) : null;
if (!cipher)
  log.info('worker.no_encryption_keys', { note: 'contract onboarding disabled until keys are set' });

const store = new SupabaseStore(sb, cipher);
const clock = new BogotaClock();
const llm = new Llm(new Anthropic({ apiKey: cfg.ANTHROPIC_API_KEY }), async (u) => {
  const { error } = await sb.from('ai_usage').insert({
    purpose: u.purpose,
    prompt_version: 'v1',
    model: u.model,
    input_tokens: u.inputTokens,
    output_tokens: u.outputTokens,
    cache_read_tokens: u.cacheReadTokens,
    cache_write_tokens: u.cacheWriteTokens,
    cost_usd_micros: u.costUsdMicros,
  });
  if (error) log.error('ai_usage.insert_failed', { error: error.message });
});

const messenger = new WhatsAppClient({
  accessToken: cfg.WA_ACCESS_TOKEN,
  phoneNumberId: cfg.WA_PHONE_NUMBER_ID,
  graphVersion: cfg.WA_GRAPH_API_VERSION,
});

const orchestrator = new Orchestrator({
  store,
  ai: new ClaudeAI(llm, { fast: cfg.AI_MODEL_FAST, smart: cfg.AI_MODEL_SMART, setup: cfg.AI_MODEL_SETUP }),
  stt: new OpenAISTT(new OpenAI({ apiKey: cfg.OPENAI_API_KEY }), cfg.STT_MODEL),
  clock,
  generator: new AccountGenerator({ store, clock, templates: new CodeTemplateProvider() }),
  newId: randomUUID,
  confidenceThreshold: cfg.AI_CONFIDENCE_THRESHOLD,
  // Interim "working on it" messages go out only on the first attempt, so retries don't repeat them.
  progress: async (to, out) => {
    if (currentAttempt <= 1) await messenger.send(to, out);
  },
});

const pipeline = new InboundPipeline({
  db: new SupabasePipelineDb(sb),
  messenger,
  conversation: orchestrator,
  appSecret: cfg.WA_APP_SECRET,
  log,
});

/** Logs the sending number's status and subscribes the business account to the app if needed. */
async function whatsappDiagnostic(): Promise<void> {
  try {
    log.info('whatsapp.number', { ...(await messenger.phoneNumberInfo()) });
  } catch (e) {
    log.error('whatsapp.number_failed', { error: (e as Error).message });
  }
  if (!cfg.WA_BUSINESS_ACCOUNT_ID) return;
  try {
    const subscribed = await messenger.ensureSubscribed(cfg.WA_BUSINESS_ACCOUNT_ID);
    log.info('whatsapp.subscription', { action: subscribed ? 'subscribed' : 'already_subscribed' });
  } catch (e) {
    log.error('whatsapp.subscription_failed', { error: (e as Error).message });
  }
}

let currentAttempt = 1;

const FAILURE_TEXT =
  'Lo siento, tuve un problema procesando tu último mensaje y no lo pude completar. 🙏 Por favor envíalo de nuevo en unos minutos; si sigue fallando, escribe *soporte*.';

/** Tells the sender that their message could not be processed after every retry. */
async function notifyFailure(inboxId: number): Promise<void> {
  const { data } = await sb.from('webhook_inbox').select('body').eq('id', inboxId).single();
  if (!data) return;
  const senders = new Set(parseWebhook(JSON.parse(data.body)).messages.map((m) => m.from));
  for (const to of senders) await messenger.send(to, { type: 'text', text: FAILURE_TEXT });
}

const inbound = new Queue<{ inbox_id: number; provider: string }>(sb, 'inbound');
const VISIBILITY_SECONDS = 180;
let stopping = false;

async function failed(msgId: number, payload: unknown, error: unknown, attempts: number): Promise<void> {
  await inbound.archive(msgId);
  await sb
    .from('job_failures')
    .insert({ queue: 'inbound', msg_id: msgId, payload, error: String(error), attempts });
  const inboxId = (payload as { inbox_id?: number }).inbox_id;
  if (inboxId) {
    await sb
      .from('webhook_inbox')
      .update({ status: 'failed', error: String(error).slice(0, 500) })
      .eq('id', inboxId);
    await notifyFailure(inboxId).catch((e) => log.error('inbound.notify_failed', { error: String(e) }));
  }
}

async function loop(): Promise<void> {
  log.info('worker.started', { queue: inbound.name });
  void whatsappDiagnostic();
  while (!stopping) {
    let batch: Awaited<ReturnType<typeof inbound.read>> = [];
    try {
      batch = await inbound.read(VISIBILITY_SECONDS, 5);
    } catch (e) {
      log.error('queue.read_failed', { error: String(e) });
    }
    if (!batch.length) {
      await new Promise((r) => setTimeout(r, cfg.WORKER_POLL_MS));
      continue;
    }
    for (const m of batch) {
      try {
        currentAttempt = m.readCount;
        if (m.message.provider === 'whatsapp') await pipeline.processInbox(m.message.inbox_id);
        await inbound.delete(m.msgId);
      } catch (e) {
        log.error('inbound.failed', { msgId: m.msgId, attempt: m.readCount, error: String(e) });
        if (m.readCount >= cfg.WORKER_MAX_ATTEMPTS)
          await failed(m.msgId, m.message, e, m.readCount).catch(() => undefined);
      }
    }
  }
  log.info('worker.stopped');
}

for (const sig of ['SIGTERM', 'SIGINT'] as const) process.on(sig, () => (stopping = true));
loop().catch((e) => {
  log.error('worker.crashed', { error: String(e) });
  process.exit(1);
});
