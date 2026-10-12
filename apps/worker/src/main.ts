/**
 * Worker entry point (Railway): consumes the `inbound` queue fed by the wa-webhook Edge Function,
 * runs the conversation and replies through the WhatsApp Cloud API.
 */
import { randomUUID } from 'node:crypto';
import Anthropic from '@anthropic-ai/sdk';
import { BogotaClock, BRAND, Orchestrator } from '@cuentasbot/conversation';
import { extractPages } from '@cuentasbot/docgen';
import { formatCOP } from '@cuentasbot/shared';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { ClaudeAI } from './ai/claude-ai.js';
import { Llm } from './ai/llm.js';
import { OpenAISTT } from './ai/openai-stt.js';
import { FieldCipher } from './crypto.js';
import { AccountGenerator } from './generator.js';
import { checkoutUrl, diagnoseKeys, verifyEvent } from './payments/wompi.js';
import { loadConfig } from './runtime/config.js';
import { jsonLogger as log } from './runtime/log.js';
import { InboundPipeline, type Messenger } from './runtime/pipeline.js';
import { Queue } from './runtime/queue.js';
import { processRegistryImports, queueRegistryUploads } from './runtime/registry-import.js';
import { parseRegistryWorkbook } from './runtime/registry-xlsx.js';
import { SupabaseReminderDb, sendSupportReminders } from './runtime/reminders.js';
import { SupabasePipelineDb } from './runtime/supabase-db.js';
import { SupabaseStore } from './store/supabase-store.js';
import { StorageTemplateProvider } from './templates.js';
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

const wompi =
  cfg.WOMPI_PUBLIC_KEY && cfg.WOMPI_INTEGRITY_SECRET
    ? {
        publicKey: cfg.WOMPI_PUBLIC_KEY,
        integritySecret: cfg.WOMPI_INTEGRITY_SECRET,
        // After paying, back to the WhatsApp chat.
        redirectUrl: `https://wa.me/${BRAND.whatsapp}`,
      }
    : null;

const orchestrator = new Orchestrator({
  store,
  ai: new ClaudeAI(llm, { fast: cfg.AI_MODEL_FAST, smart: cfg.AI_MODEL_SMART, setup: cfg.AI_MODEL_SETUP }),
  stt: new OpenAISTT(new OpenAI({ apiKey: cfg.OPENAI_API_KEY }), cfg.STT_MODEL),
  clock,
  generator: new AccountGenerator({ store, clock, templates: new StorageTemplateProvider(sb) }),
  newId: randomUUID,
  confidenceThreshold: cfg.AI_CONFIDENCE_THRESHOLD,
  // Interim "working on it" messages go out only on the first attempt, so retries don't repeat them.
  extractPages,
  ...(wompi ? { payments: { checkoutUrl: (charge) => checkoutUrl(wompi, charge) } } : {}),
  progress: async (to, out) => {
    if (currentAttempt <= 1) await messenger.send(to, out);
  },
});

/** WhatsApp does not accept ZIP files: the package goes to Storage and the contractor gets a link. */
const ZIP_LINK_SECONDS = 7 * 24 * 3600;
const outbound: Messenger = {
  async send(to, out) {
    if (out.type !== 'document' || out.mime !== 'application/zip') return messenger.send(to, out);
    const path = `packages/${randomUUID()}/${out.filename}`;
    const bucket = sb.storage.from('outputs');
    const up = await bucket.upload(path, out.data, { contentType: 'application/zip' });
    if (up.error) throw new Error(`zip upload: ${up.error.message}`);
    const { data, error } = await bucket.createSignedUrl(path, ZIP_LINK_SECONDS, { download: out.filename });
    if (error || !data) throw new Error(`zip link: ${error?.message}`);
    return messenger.send(to, {
      type: 'text',
      text: `📦 *${out.filename}*: el paquete completo para cargar en SECOP II. Descárgalo aquí (el enlace vence en 7 días):\n${data.signedUrl}`,
    });
  },
  downloadMedia: (id) => messenger.downloadMedia(id),
  markRead: (wamid) => messenger.markRead(wamid),
};

const pipeline = new InboundPipeline({
  db: new SupabasePipelineDb(sb),
  messenger: outbound,
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
/** Programa de Aliados: the previous month is evaluated (idempotently) every hour. */
const ALLY_CHECK_MS = 60 * 60_000;

async function evaluateAllies(): Promise<void> {
  const today = clock.today(); // Bogotá
  const [y, m] = today.split('-').map(Number) as [number, number];
  const prev = m === 1 ? `${y - 1}-12-01` : `${y}-${String(m - 1).padStart(2, '0')}-01`;
  const { data, error } = await sb.rpc('evaluate_allies', { p_month: prev });
  if (error) throw new Error(error.message);
  if (data) log.info('allies.levels_granted', { month: prev, granted: data });
}

/** Missing-supports reminders (ADR-036): checked every 15 minutes, sent once per period. */
const REMINDER_CHECK_MS = 15 * 60_000;
const reminderDb = new SupabaseReminderDb(sb);

async function supportReminders(): Promise<void> {
  const now = new Date();
  await sendSupportReminders({
    db: reminderDb,
    reminder: (userId, contractId) => orchestrator.supportsReminder(userId, contractId),
    send: async (to, out) => {
      const wamid = await outbound.send(to, out);
      await pipelineDb.logOutbound(to, wamid, out).catch(() => undefined);
      return wamid;
    },
    sendTemplate: (to, t) => messenger.sendTemplate(to, t),
    now,
    today: clock.today(),
    hour: new Date(now.getTime() - 5 * 3600_000).getUTCHours(), // Bogotá, UTC-5 all year
    log,
  });
}

/** How often the worker looks for new entity contract registry uploads. */
const REGISTRY_CHECK_MS = 60_000;
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

const pipelineDb = new SupabasePipelineDb(sb);

/** Wompi event: verify it, settle the charge and deliver the report (ADR-034). */
async function processWompi(inboxId: number): Promise<void> {
  const item = await pipelineDb.getInbox(inboxId);
  if (!item || item.status !== 'pending') return;
  const tx = cfg.WOMPI_EVENTS_SECRET ? verifyEvent(cfg.WOMPI_EVENTS_SECRET, item.body) : null;
  if (!tx) {
    log.error('wompi.bad_event', { inboxId });
    await pipelineDb.markInbox(inboxId, 'rejected', 'invalid or unverified event');
    return;
  }
  const charge = await store.chargeByReference(tx.reference);
  if (!charge) {
    await pipelineDb.markInbox(inboxId, 'rejected', `unknown reference ${tx.reference}`);
    return;
  }
  const user = await store.getUser(charge.userId);
  if (tx.status === 'APPROVED') {
    if (tx.amountInCents !== charge.amount * 100) {
      log.error('wompi.amount_mismatch', { inboxId, reference: tx.reference });
      await pipelineDb.markInbox(inboxId, 'failed', 'amount mismatch');
      return;
    }
    if (charge.status === 'pending') {
      await store.settleCharge(charge.id, 'paid', 'wompi', tx.id);
      const { to, out } = await orchestrator.chargePaid(charge.id);
      for (const o of out) {
        try {
          await pipelineDb.logOutbound(to, await outbound.send(to, o), o);
        } catch (e) {
          log.error('wompi.send_failed', { inboxId, error: String(e) });
        }
      }
    }
  } else if (tx.status === 'DECLINED' || tx.status === 'ERROR' || tx.status === 'VOIDED') {
    const o = {
      type: 'text' as const,
      text: `❌ Tu pago de ${formatCOP(charge.amount)} no fue aprobado. Puedes intentarlo de nuevo con el mismo enlace o escribir *soporte*.`,
    };
    await pipelineDb.logOutbound(user.phone, await outbound.send(user.phone, o), o).catch(() => undefined);
  }
  await pipelineDb.markInbox(inboxId, 'processed');
}

async function loop(): Promise<void> {
  log.info('worker.started', { queue: inbound.name });
  if (cfg.WOMPI_PUBLIC_KEY || cfg.WOMPI_INTEGRITY_SECRET || cfg.WOMPI_EVENTS_SECRET) {
    const d = diagnoseKeys({
      publicKey: cfg.WOMPI_PUBLIC_KEY,
      integritySecret: cfg.WOMPI_INTEGRITY_SECRET,
      eventsSecret: cfg.WOMPI_EVENTS_SECRET,
    });
    (d.ok ? log.info : log.error)('wompi.keys', { ...d, problems: d.problems.join('; ') });
  }
  void whatsappDiagnostic();
  let nextRegistryCheck = 0;
  let nextAllyCheck = 0;
  let nextReminderCheck = 0;
  while (!stopping) {
    if (Date.now() >= nextReminderCheck) {
      nextReminderCheck = Date.now() + REMINDER_CHECK_MS;
      await supportReminders().catch((e) => log.error('reminders.check_failed', { error: String(e) }));
    }
    if (Date.now() >= nextAllyCheck) {
      nextAllyCheck = Date.now() + ALLY_CHECK_MS;
      await evaluateAllies().catch((e) => log.error('allies.evaluate_failed', { error: String(e) }));
    }
    if (cipher && Date.now() >= nextRegistryCheck) {
      nextRegistryCheck = Date.now() + REGISTRY_CHECK_MS;
      await queueRegistryUploads(sb, parseRegistryWorkbook, log)
        .then(() => processRegistryImports(sb, cipher, log, parseRegistryWorkbook))
        .catch((e) => log.error('registry.check_failed', { error: String(e) }));
    }
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
        else if (m.message.provider === 'wompi') await processWompi(m.message.inbox_id);
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
