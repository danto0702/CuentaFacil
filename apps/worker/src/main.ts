/**
 * Worker entry point (Railway): consumes the `inbound` queue fed by the wa-webhook Edge Function,
 * runs the conversation and replies through the WhatsApp Cloud API.
 */
import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import Anthropic from '@anthropic-ai/sdk';
import { BogotaClock, BRAND, Orchestrator } from '@cuentasbot/conversation';
import { docxToPdf, extractPages } from '@cuentasbot/docgen';
import { formatCOP } from '@cuentasbot/shared';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { ClaudeAI } from './ai/claude-ai.js';
import { Llm } from './ai/llm.js';
import { OpenAISTT } from './ai/openai-stt.js';
import { FieldCipher } from './crypto.js';
import { AccountGenerator } from './generator.js';
import { checkoutUrl, diagnoseKeys, verifyEvent } from './payments/wompi.js';
import { SupabaseAlertDb, sendDailyAlert } from './runtime/alerts.js';
import { loadConfig } from './runtime/config.js';
import { type DeliverDeps, deliver, flushHeld, SHOW_HELD, SupabaseHeldStore } from './runtime/held.js';
import { jsonLogger as log } from './runtime/log.js';
import { InboundPipeline, type Logger, type Messenger } from './runtime/pipeline.js';
import { Queue } from './runtime/queue.js';
import { processRegistryImports, queueRegistryUploads } from './runtime/registry-import.js';
import { parseRegistryWorkbook } from './runtime/registry-xlsx.js';
import { SupabaseReminderDb, sendSupportReminders } from './runtime/reminders.js';
import { purgeExpiredFiles } from './runtime/retention.js';
import { SupabasePipelineDb } from './runtime/supabase-db.js';
import { turnId } from './runtime/turn-ids.js';
import { SupabaseStore } from './store/supabase-store.js';
import { StorageTemplateProvider } from './templates.js';
import { WhatsAppClient } from './whatsapp/client.js';
import { parseWebhook } from './whatsapp/parse.js';
import { TEMPLATES } from './whatsapp/wa-templates.js';

const cfg = loadConfig();
const sb = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

/** Logger whose errors also go to job_failures, so they show up in the panel's start page. */
const alertLog: Logger = {
  info: log.info,
  error: (event, data = {}) => {
    log.error(event, data);
    void sb
      .from('job_failures')
      .insert({ queue: 'warning', payload: { event, ...data }, error: event, attempts: 0 })
      .then(({ error }) => error && log.error('job_failures.insert_failed', { error: error.message }));
  },
};

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
  ai: new ClaudeAI(
    llm,
    { fast: cfg.AI_MODEL_FAST, smart: cfg.AI_MODEL_SMART, setup: cfg.AI_MODEL_SETUP },
    (doc) => docxToPdf(doc),
  ),
  stt: new OpenAISTT(new OpenAI({ apiKey: cfg.OPENAI_API_KEY }), cfg.STT_MODEL),
  clock,
  generator: new AccountGenerator({ store, clock, templates: new StorageTemplateProvider(sb) }),
  newId: turnId,
  confidenceThreshold: cfg.AI_CONFIDENCE_THRESHOLD,
  warn: (event, data) => alertLog.error(event, data),
  // Interim "working on it" messages go out only on the first attempt, so retries don't repeat them.
  extractPages,
  ...(wompi ? { payments: { checkoutUrl: (charge) => checkoutUrl(wompi, charge) } } : {}),
  // Gestor (ADR-042): the authorization request goes as the approved template; it fails (and the
  // gestor is told to ask the person to write) while Meta has not approved it.
  inviteDelegate: async (d, managerName) => {
    const body = [d.personName.split(' ')[0] ?? d.personName, managerName];
    const wamid = await messenger.sendTemplate(d.personPhone, {
      name: 'autorizar_gestor',
      language: 'es',
      body,
      quickReplies: [`dlg:yes:${d.id}`, `dlg:no:${d.id}`],
    });
    await pipelineDb
      .logOutbound(d.personPhone, wamid, {
        type: 'text',
        text: `[plantilla autorizar_gestor] ${body.join(' · ')}`,
      })
      .catch(() => undefined);
  },
  notify: async (to, out) => {
    const user = await store.getUserByPhone(to);
    if (user) await deliver(deliverDeps, recipient(user), out, 'un mensaje sobre tus cuentas');
  },
  progress: async (to, out) => {
    if ((attemptScope.getStore() ?? 1) <= 1) await messenger.send(to, out);
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

/** Messages Pascal sends on its own: held while the 24-hour window is closed (ADR-043). */
const deliverDeps: DeliverDeps = {
  held: new SupabaseHeldStore(sb),
  send: async (to, out) => {
    const wamid = await outbound.send(to, out);
    await pipelineDb.logOutbound(to, wamid, out).catch(() => undefined);
    return wamid;
  },
  sendTemplate: (to, t) => messenger.sendTemplate(to, t),
  log: alertLog,
};
const recipient = (u: { id: string; phone: string; fullName: string }) => ({
  userId: u.id,
  phone: u.phone,
  name: u.fullName.split(' ')[0] || 'hola',
});

const pipeline = new InboundPipeline({
  db: new SupabasePipelineDb(sb),
  messenger: outbound,
  conversation: orchestrator,
  appSecret: cfg.WA_APP_SECRET,
  log: alertLog,
  beforeTurn: async (from, replyId) => {
    const user = await store.getUserByPhone(from);
    if (!user) return false;
    const sent = await flushHeld(deliverDeps, user.id, from);
    if (replyId !== SHOW_HELD) return false;
    if (!sent)
      await deliverDeps.send(from, { type: 'text', text: 'Ya te envié todo lo que tenía pendiente. 👍' });
    return true;
  },
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
  for (const t of TEMPLATES) {
    try {
      const r = await messenger.ensureTemplate(cfg.WA_BUSINESS_ACCOUNT_ID, t);
      log.info('whatsapp.template', { name: t.name, ...r });
    } catch (e) {
      log.error('whatsapp.template_failed', { name: t.name, error: (e as Error).message });
    }
  }
}

/** Attempt of the message being processed: several are processed at once. */
const attemptScope = new AsyncLocalStorage<number>();

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
/** Queue messages read at once; their senders are served in parallel. */
const BATCH_SIZE = 10;
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
    reminder: (userId, contractId, recipientId) =>
      orchestrator.supportsReminder(userId, contractId, recipientId),
    managersOf: async (userId) => (await store.managersOf(userId)).map((u) => u.id),
    send: async (to, out) => {
      const wamid = await outbound.send(to, out);
      await pipelineDb.logOutbound(to, wamid, out).catch(() => undefined);
      return wamid;
    },
    sendTemplate: (to, t) => messenger.sendTemplate(to, t),
    now,
    today: clock.today(),
    hour: new Date(now.getTime() - 5 * 3600_000).getUTCHours(), // Bogotá, UTC-5 all year
    log: alertLog,
  });
}

/** Daily failure summary to the owner (ADR-045), checked with the reminders. */
const alertDb = new SupabaseAlertDb(sb);

async function dailyAlert(): Promise<void> {
  const now = new Date();
  await sendDailyAlert({
    settings: () => alertDb.settings(),
    failuresSince: (since) => alertDb.failuresSince(since),
    claim: (userId, key) => alertDb.claim(userId, key),
    send: async (userId, out) => {
      await deliver(deliverDeps, recipient(await store.getUser(userId)), [out], 'un resumen de fallas');
    },
    now,
    today: clock.today(),
    hour: new Date(now.getTime() - 5 * 3600_000).getUTCHours(), // Bogotá, UTC-5 all year
  });
}

/** Retention purge (ADR-048): files past their term, checked once a day. */
const RETENTION_CHECK_MS = 24 * 3600_000;

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
  // The one who asked for the payment: the contractor, or their gestor (ADR-042).
  const user = await store.getUser(charge.requestedBy ?? charge.userId);
  if (tx.status === 'APPROVED') {
    if (tx.amountInCents !== charge.amount * 100) {
      log.error('wompi.amount_mismatch', { inboxId, reference: tx.reference });
      await pipelineDb.markInbox(inboxId, 'failed', 'amount mismatch');
      return;
    }
    if (charge.status === 'pending') {
      await store.settleCharge(charge.id, 'paid', 'wompi', tx.id);
      const { out } = await orchestrator.chargePaid(charge.id);
      await deliver(
        deliverDeps,
        recipient(user),
        out,
        charge.product === 'report' ? 'los documentos de tu cuenta' : 'la confirmación de tu pago',
      );
    }
  } else if (tx.status === 'DECLINED' || tx.status === 'ERROR' || tx.status === 'VOIDED') {
    const o = {
      type: 'text' as const,
      text: `❌ Tu pago de ${formatCOP(charge.amount)} no fue aprobado. Puedes intentarlo de nuevo con el mismo enlace o escribir *soporte*.`,
    };
    await deliver(deliverDeps, recipient(user), [o], 'una novedad sobre tu pago');
  }
  await pipelineDb.markInbox(inboxId, 'processed');
}

type InboundItem = Awaited<ReturnType<typeof inbound.read>>[number];

/** Who sent a stored webhook delivery, to keep each person's messages in order. */
async function senderOf(inboxId: number): Promise<string | null> {
  const { data } = await sb.from('webhook_inbox').select('body').eq('id', inboxId).single();
  if (!data) return null;
  return parseWebhook(JSON.parse(data.body)).messages[0]?.from ?? null;
}

async function processQueued(m: InboundItem): Promise<void> {
  try {
    await attemptScope.run(m.readCount, async () => {
      if (m.message.provider === 'whatsapp') await pipeline.processInbox(m.message.inbox_id);
      else if (m.message.provider === 'wompi') await processWompi(m.message.inbox_id);
    });
    await inbound.delete(m.msgId);
  } catch (e) {
    log.error('inbound.failed', { msgId: m.msgId, attempt: m.readCount, error: String(e) });
    if (m.readCount >= cfg.WORKER_MAX_ATTEMPTS)
      await failed(m.msgId, m.message, e, m.readCount).catch(() => undefined);
  }
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
  let nextRetentionCheck = 0;
  while (!stopping) {
    if (Date.now() >= nextReminderCheck) {
      nextReminderCheck = Date.now() + REMINDER_CHECK_MS;
      await supportReminders().catch((e) => log.error('reminders.check_failed', { error: String(e) }));
      await dailyAlert().catch((e) => log.error('alerts.check_failed', { error: String(e) }));
    }
    if (Date.now() >= nextRetentionCheck) {
      nextRetentionCheck = Date.now() + RETENTION_CHECK_MS;
      await purgeExpiredFiles(sb, new Date(), log).catch((e) =>
        alertLog.error('retention.failed', { error: String(e) }),
      );
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
      batch = await inbound.read(VISIBILITY_SECONDS, BATCH_SIZE);
    } catch (e) {
      log.error('queue.read_failed', { error: String(e) });
    }
    if (!batch.length) {
      await new Promise((r) => setTimeout(r, cfg.WORKER_POLL_MS));
      continue;
    }
    // Each sender's messages in order; different senders at the same time, so one long report does
    // not hold everyone else. Wompi events go after, one by one: they write the payer's conversation.
    const bySender = new Map<string, InboundItem[]>();
    const payments: InboundItem[] = [];
    for (const m of batch) {
      if (m.message.provider !== 'whatsapp') {
        payments.push(m);
        continue;
      }
      const key = await senderOf(m.message.inbox_id).catch(() => null);
      const k = key ?? `inbox:${m.message.inbox_id}`;
      bySender.set(k, [...(bySender.get(k) ?? []), m]);
    }
    await Promise.all(
      [...bySender.values()].map(async (ms) => {
        for (const m of ms) await processQueued(m);
      }),
    );
    for (const m of payments) await processQueued(m);
  }
  log.info('worker.stopped');
}

for (const sig of ['SIGTERM', 'SIGINT'] as const) process.on(sig, () => (stopping = true));
loop()
  .then(() => process.exit(0))
  .catch((e) => {
    log.error('worker.crashed', { error: String(e) });
    process.exit(1);
  });
