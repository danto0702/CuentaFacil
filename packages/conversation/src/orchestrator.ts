import {
  addDays,
  compareIso,
  formatCOP,
  formatDdMmYyyy,
  formatRangeLong,
  formatReportNumber,
  type IsoDate,
  monthNameEs,
  type PeriodMode,
  planPeriodAmounts,
  recutPeriods,
} from '@cuentasbot/shared';
import { allyStatusText, findAllyCode, levelUpText, NOT_ALLY_TEXT, referralText } from './ally.js';
import { BRAND, SIGNATURE } from './brand.js';
import type {
  Charge,
  Contract,
  ConversationState,
  Delegation,
  Draft,
  Note,
  Obligation,
  Period,
  SupportFile,
  SupportSegment,
  SupportType,
  User,
} from './domain.js';
import { noteSupports, pilaMonthFor } from './domain.js';
import { type Command, forcedNote, matchCommand, matchMonthRequest } from './intents.js';
import { type NoteSuspicion, PHOTO_RECORD_PREFIX, suspectNote } from './note-check.js';
import type { Deps, Inbound, ListRow, MessageIntent, MessageIntentKind, Outgoing } from './ports.js';
import { POLICY_VERSION, SETUP_FLOW, SetupFlow, TERMS_VERSION } from './setup.js';
import { type ActivityWhen, clip, MONTHS, normalize, parseActivityDate, parseActivityWhen } from './text.js';

const MAX_BUTTONS = 3;
const MAX_ROWS = 10;
/** A photo without caption offers the activities registered in the last days. */
const PHOTO_RECENT_DAYS = 7;
const PHOTO_RECENT_NOTES = 8;
/** An earlier report not delivered yet counts as "being worked on" for this many days after it closes. */
const OPEN_REPORT_DAYS = 62;
/** Conversation context kept when the flow changes. */
const STICKY_KEYS = ['working', 'checkedNotes', 'actingFor', 'dlgAsked'] as const;
const CONTRACT_ACTIVE =
  '🎉 ¡Tu contrato quedó activo! Desde ya cuéntame lo que haces cada día: texto, audio o fotos. Escribe *menú* para ver todas las opciones.';

/** What still works while every contract waits for its configuration payment: never a dead end. */
const OPEN_WHILE_UNPAID: Command[] = [
  'support',
  'about',
  'help',
  'add_contract',
  'my_data',
  'ally',
  'stop_reminders',
  'start_reminders',
];

type Ctx = Record<string, unknown>;

/** Button titles (max 20 characters) for the likely meaning of an unclear message. */
const INTENT_TITLES: Record<Exclude<MessageIntentKind, 'activity' | 'unclear'>, string> = {
  redo: 'Rehacer informe',
  reset: 'Reiniciar informe',
  open_report: 'Trabajar el informe',
  draft: 'Ver borrador',
  generate: 'Generar documentos',
  status: '¿Qué me falta?',
  guide: 'Guía de soportes',
  contracts: 'Mis contratos',
  add_contract: 'Agregar contrato',
  my_data: 'Mis datos',
  signature: 'Cargar mi firma',
  undo_note: 'Borrar última nota',
  move_note: 'Mover actividad',
  support: 'Hablar con soporte',
  help: 'Ayuda',
  menu: 'Ver menú',
};

/** Certificates guide: one missing support at a time (ADR-035). */
const GUIDE_FLOW = 'support_guide';
interface GuideCtx {
  contractId: string;
  total: number;
  skipped: string[];
  current?: string;
}

interface Turn {
  /** Whose accounts are being worked: the sender, or the person a gestor acts for (ADR-042). */
  user: User;
  /** Who is writing (the WhatsApp number); receives every reply. Defaults to `user`. */
  actor?: User;
  /** Name the gestor gave for `user`, until their contract fills in the real one. */
  personLabel?: string;
  state: ConversationState;
  out: Outgoing[];
}

/** The WhatsApp number writing in this turn. */
const actorOf = (turn: Turn): User => turn.actor ?? turn.user;

const text = (t: string): Outgoing => ({ type: 'text', text: t });

function buttons(body: string, items: { id: string; title: string }[]): Outgoing {
  return {
    type: 'buttons',
    text: body,
    buttons: items.slice(0, MAX_BUTTONS).map((b) => ({ ...b, title: clip(b.title, 20) })),
  };
}

function list(body: string, button: string, rows: ListRow[]): Outgoing {
  return {
    type: 'list',
    text: body,
    button: clip(button, 20),
    rows: rows.slice(0, MAX_ROWS).map((r) => ({
      id: r.id,
      title: clip(r.title, 24),
      ...(r.description ? { description: clip(r.description, 72) } : {}),
    })),
  };
}

/** Lets the user pick among items: buttons when ≤ 3, a list otherwise (paginated past 10). */
function choose(
  body: string,
  items: { id: string; title: string; description?: string }[],
  page = 0,
  moreId = 'more',
): Outgoing {
  if (items.length <= MAX_BUTTONS) return buttons(body, items);
  const pageSize = MAX_ROWS - 1;
  const slice = items.slice(page * pageSize, (page + 1) * pageSize);
  const rows: ListRow[] = slice.map((i) => ({
    id: i.id,
    title: i.title,
    ...(i.description ? { description: i.description } : {}),
  }));
  if (items.length > (page + 1) * pageSize) rows.push({ id: `${moreId}:${page + 1}`, title: 'Ver más…' });
  else if (items.length === MAX_ROWS)
    rows.push({ id: items[MAX_ROWS - 1]!.id, title: items[MAX_ROWS - 1]!.title });
  return list(body, 'Elegir', rows);
}

function obligationTitle(o: Obligation): string {
  return `${o.number}. ${o.text}`;
}

function obligationRow(o: Obligation): { id: string; title: string; description: string } {
  return { id: `o:${o.key}`, title: clip(obligationTitle(o), 24), description: clip(o.text, 72) };
}

export class Orchestrator {
  private readonly setup: SetupFlow;

  constructor(private readonly deps: Deps) {
    this.setup = new SetupFlow(deps);
  }

  /** Handles one inbound WhatsApp message and returns the replies to send, in order. */
  async handle(msg: Inbound): Promise<Outgoing[]> {
    const { store } = this.deps;
    if (msg.kind === 'reply' && /^dlg:(yes|no):/.test(msg.replyId ?? '')) return this.onDelegationAnswer(msg);
    const user = await store.getUserByPhone(msg.from);
    if (!user) {
      // A gestor asked this number for authorization: that question comes first.
      const pending = await store.pendingDelegationsFor(msg.from);
      if (pending.length) return this.askDelegation(pending[0]!, msg.from);
      // Unregistered numbers: nothing is stored until the person accepts the data policy.
      if (msg.kind === 'reply' && msg.replyId === 'consent:no') return this.setup.declined();
      if (
        msg.kind === 'reply' &&
        (msg.replyId === 'consent:yes' || msg.replyId?.startsWith('consent:yes:'))
      ) {
        const created = await store.createUser(msg.from);
        await store.recordConsent({
          userId: created.id,
          phone: msg.from,
          policyVersion: POLICY_VERSION,
          accepted: true,
          wamid: msg.id,
        });
        // The registration message covers the data policy and the terms of service.
        await store.recordConsent({
          userId: created.id,
          phone: msg.from,
          kind: 'terms',
          policyVersion: TERMS_VERSION,
          accepted: true,
          wamid: msg.id,
        });
        const turn: Turn = { user: created, state: this.idle(created.id), out: [] };
        const allyCode = msg.replyId.startsWith('consent:yes:')
          ? msg.replyId.slice('consent:yes:'.length)
          : null;
        if (allyCode) turn.out.push(referralText(await store.applyReferral(created.id, allyCode), allyCode));
        await this.setup.start(turn);
        turn.state.updatedAt = this.deps.clock.now().toISOString();
        await store.saveConversation(turn.state);
        return turn.out;
      }
      if (msg.kind === 'text' && msg.text && matchCommand(msg.text) === 'about') return this.about();
      return this.setup.welcome(msg.kind === 'text' && msg.text ? findAllyCode(msg.text) : null);
    }
    const state = (await store.getConversation(user.id)) ?? this.idle(user.id);
    const turn: Turn = { user, state, out: [] };
    // Levels reached since the last message: tell the Aliado first (no template needed in the 24 h window).
    const ally = await store.allyStatus(user.id);
    if (ally?.newLevels.length) {
      for (const level of ally.newLevels) turn.out.push(levelUpText(level));
      await store.markAllyLevelsNotified(user.id);
    }
    if (await this.termsGate(turn, msg)) {
      // asked to accept the terms in force (or declined)
    } else if (turn.state.flow === 'profile_doc_issued_in' && (await this.onDocIssuedIn(turn, msg))) {
      // answered
    } else if (await this.askPendingDelegation(turn)) {
      // a gestor asked this contractor for authorization
    } else {
      await this.actAs(turn);
      await this.dispatch(turn, msg);
      await this.askMissingProfile(turn);
      this.markPerson(turn);
    }
    turn.state.updatedAt = this.deps.clock.now().toISOString();
    await store.saveConversation(turn.state);
    return turn.out;
  }

  // -------------------------------------------------------------------------
  // Gestor (ADR-042): one WhatsApp number preparing the accounts of several people, each of whom
  // authorizes it from their own WhatsApp. The active person is kept in the conversation.
  // -------------------------------------------------------------------------

  /** Works the accounts of the active person, if the gestor still has their authorization. */
  private async actAs(turn: Turn): Promise<void> {
    const id = turn.state.context.actingFor as string | undefined;
    if (!id || id === turn.user.id) return;
    const d = (await this.deps.store.listDelegations(turn.user.id)).find(
      (x) => x.personId === id && x.status === 'active',
    );
    if (!d) {
      turn.state.context = { ...turn.state.context, actingFor: undefined };
      turn.out.push(
        text('⚠️ Ya no tienes autorización para las cuentas de esa persona; volvimos a las tuyas.'),
      );
      return;
    }
    turn.actor = turn.user;
    turn.user = await this.deps.store.getUser(id);
    turn.personLabel = d.personName;
  }

  private personName(u: User, fallback = ''): string {
    return (u.fullName || fallback).split(/\s+/).slice(0, 3).join(' ') || 'la persona';
  }

  /** Short name of the person whose accounts are being worked. */
  private labelOf(turn: Turn): string {
    return this.personName(turn.user, turn.personLabel);
  }

  /** While working someone else's accounts, the first reply says whose they are. */
  private markPerson(turn: Turn): void {
    if (!turn.actor || turn.actor.id === turn.user.id) return;
    const first = turn.out.find((o) => o.type !== 'document') as { text: string } | undefined;
    if (first) first.text = `👤 *${this.labelOf(turn)}*\n${first.text}`;
  }

  /** "Cambiar persona": the gestor's own accounts and the people they manage. */
  private async showPeople(turn: Turn): Promise<void> {
    const me = actorOf(turn);
    const ds = await this.deps.store.listDelegations(me.id);
    const active = ds.filter((d) => d.status === 'active' && d.personId);
    const pending = ds.filter((d) => d.status === 'pending');
    const current = (turn.state.context.actingFor as string | undefined) ?? me.id;
    const rows = [
      {
        id: 'who:me',
        title: `${current === me.id ? '✅ ' : ''}Mis cuentas`,
        description: this.personName(me),
      },
      ...active.map((d) => ({
        id: `who:${d.personId}`,
        title: `${current === d.personId ? '✅ ' : ''}${d.personName.split(/\s+/).slice(0, 2).join(' ')}`,
        description: d.personName,
      })),
      { id: 'menu:add_person', title: '➕ Agregar persona', description: 'Hacer las cuentas de alguien más' },
    ];
    const waiting = `${
      pending.length ? `\n\n⏳ Esperando autorización: ${pending.map((d) => d.personName).join(', ')}.` : ''
    }${active.length ? '\n\nPara dejar de manejar las cuentas de alguien, escribe *revocar autorización*.' : ''}`;
    turn.out.push(choose(`👥 ¿De quién son las cuentas que vamos a trabajar?${waiting}`, rows));
  }

  /** Switches the active person ("who:me", "who:<id>", optionally ":status" to show the checklist). */
  private async switchPerson(turn: Turn, replyId: string): Promise<void> {
    const me = actorOf(turn);
    const [, id, then] = replyId.split(':');
    const target = id === 'me' ? me.id : id!;
    if (target !== me.id) {
      const d = (await this.deps.store.listDelegations(me.id)).find(
        (x) => x.personId === target && x.status === 'active',
      );
      if (!d) {
        turn.out.push(text('No tengo autorización para las cuentas de esa persona.'));
        return;
      }
      turn.personLabel = d.personName;
    }
    turn.user = me;
    turn.actor = undefined;
    this.setFlow(turn, 'idle', 'start', {});
    // The open report and the reviewed notes belong to the previous person.
    turn.state.context = {
      ...turn.state.context,
      actingFor: target === me.id ? undefined : target,
      working: undefined,
      checkedNotes: undefined,
    };
    if (target !== me.id) {
      turn.actor = me;
      turn.user = await this.deps.store.getUser(target);
    }
    turn.out.push(
      text(
        target === me.id
          ? '👥 Listo, volvimos a *tus* cuentas.'
          : `👥 Listo, ahora trabajamos con las cuentas de *${this.labelOf(turn)}*. Todo lo que me envíes queda en sus cuentas hasta que escribas *cambiar persona*.`,
      ),
    );
    if (then === 'status') await this.command(turn, 'status');
  }

  /**
   * "Revocar autorización": the gestores who manage my accounts and the people I manage; either side
   * can end it, and the other one is told.
   */
  private async showAuthorizations(turn: Turn): Promise<void> {
    // Button titles fit 20 characters: first name and first surname.
    const short = (name: string) => name.split(/\s+/).slice(0, 2).join(' ');
    const me = actorOf(turn);
    const { store } = this.deps;
    const mine = await store.delegationsOf(me.id);
    const managed = (await store.listDelegations(me.id)).filter((d) => d.status === 'active');
    if (!mine.length && !managed.length) {
      turn.out.push(
        text(
          'No tienes autorizaciones activas: nadie maneja tus cuentas y tú no manejas las de otra persona.',
        ),
      );
      return;
    }
    const rows = [
      ...(await Promise.all(
        mine.map(async (d) => ({
          id: `rvk:ask:${d.id}`,
          title: short(this.personName(await store.getUser(d.managerId))),
          description: 'Maneja tus cuentas: quitarle el acceso',
        })),
      )),
      ...managed.map((d) => ({
        id: `rvk:ask:${d.id}`,
        title: short(d.personName),
        description: 'Manejas sus cuentas: dejar de hacerlo',
      })),
    ];
    turn.out.push(choose('🔐 ¿Qué autorización quieres revocar?', rows));
  }

  private async onRevoke(turn: Turn, replyId: string): Promise<void> {
    const me = actorOf(turn);
    const { store } = this.deps;
    const [, step, id] = replyId.split(':');
    const d = id ? await store.getDelegation(id) : null;
    const asPerson = d?.personId === me.id;
    const asManager = d?.managerId === me.id;
    if (!d || d.status !== 'active' || (!asPerson && !asManager)) {
      turn.out.push(text('Esa autorización ya no está activa.'));
      return;
    }
    const manager = asPerson ? await store.getUser(d.managerId) : me;
    if (step === 'no') {
      turn.out.push(text('Listo, no cambié nada.'));
      return;
    }
    if (step === 'ask') {
      turn.out.push(
        buttons(
          asPerson
            ? `¿Le quito a *${this.personName(manager)}* el acceso a tus cuentas de cobro? Ya no podrá registrar actividades, cargar soportes ni recibir tus documentos.`
            : `¿Dejas de manejar las cuentas de *${d.personName}*? Para volver a hacerlo, tendría que autorizarte de nuevo.`,
          [
            { id: `rvk:yes:${d.id}`, title: 'Sí, revocar' },
            { id: `rvk:no:${d.id}`, title: 'No' },
          ],
        ),
      );
      return;
    }
    await store.revokeDelegation(d.id);
    // The gestor who was working this person's accounts goes back to their own.
    if (asManager && turn.state.context.actingFor === d.personId) {
      turn.state.context = {
        ...turn.state.context,
        actingFor: undefined,
        working: undefined,
        checkedNotes: undefined,
      };
      turn.user = me;
      turn.actor = undefined;
    }
    if (asPerson) {
      await this.deps
        .notify?.(manager.phone, [
          text(`🔐 *${d.personName}* revocó tu autorización: ya no puedes manejar sus cuentas de cobro.`),
        ])
        .catch(() => undefined);
      turn.out.push(text(`✅ Listo, *${this.personName(manager)}* ya no tiene acceso a tus cuentas.`));
    } else {
      await this.deps
        .notify?.(d.personPhone, [
          text(
            `🔐 *${this.personName(me)}* dejó de manejar tus cuentas de cobro. Puedes seguir usándolas desde tu WhatsApp.`,
          ),
        ])
        .catch(() => undefined);
      turn.out.push(text(`✅ Listo, ya no manejas las cuentas de *${d.personName}*.`));
    }
  }

  private async startAddPerson(turn: Turn): Promise<void> {
    this.setFlow(turn, 'person_phone', 'ask');
    turn.out.push(
      text(
        '➕ Vamos a agregar a una persona para hacer sus cuentas.\n\n📱 Escríbeme su número de WhatsApp, por ejemplo *3001234567*. Le voy a escribir para que autorice que prepares sus cuentas.',
      ),
    );
  }

  private async onPersonPhone(turn: Turn, msg: Inbound): Promise<void> {
    const raw = (msg.text ?? '').replace(/[^\d+]/g, '');
    const phone = /^3\d{9}$/.test(raw)
      ? `+57${raw}`
      : /^57\d{10}$/.test(raw)
        ? `+${raw}`
        : /^\+\d{8,15}$/.test(raw)
          ? raw
          : null;
    if (!phone) {
      if (msg.kind === 'text' && msg.text && msg.text.trim().split(/\s+/).length > 4) {
        this.reset(turn);
        return this.freeText(turn, msg.text);
      }
      turn.out.push(
        text('Escríbeme el número de WhatsApp de la persona con 10 dígitos, por ejemplo *3001234567*.'),
      );
      return;
    }
    if (phone === actorOf(turn).phone) {
      turn.out.push(text('Ese es tu propio número. Escríbeme el número de la otra persona.'));
      return;
    }
    this.setFlow(turn, 'person_name', 'ask', { personPhone: phone });
    turn.out.push(text('✍️ ¿Cuál es su *nombre completo*?'));
  }

  private async onPersonName(turn: Turn, msg: Inbound): Promise<void> {
    const name = (msg.text ?? '').trim().replace(/\s+/g, ' ');
    if (name.length < 5 || name.length > 80 || /\d/.test(name)) {
      turn.out.push(text('Escríbeme su nombre completo, por ejemplo *Ana María Pérez Gómez*.'));
      return;
    }
    const { personPhone } = turn.state.context as { personPhone: string };
    const me = actorOf(turn);
    const d = await this.deps.store.createDelegation({ managerId: me.id, personName: name, personPhone });
    this.reset(turn);
    if (d.status === 'active') {
      turn.out.push(
        buttons(`✅ *${d.personName}* ya te había autorizado.`, [
          { id: `who:${d.personId}`, title: 'Trabajar sus cuentas' },
        ]),
      );
      return;
    }
    const sent = this.deps.inviteDelegate
      ? await this.deps.inviteDelegate(d, this.personName(me)).then(
          () => true,
          () => false,
        )
      : false;
    turn.out.push(
      text(
        sent
          ? `📨 Le escribí a *${d.personName}* para que autorice que prepares sus cuentas. Te aviso apenas responda.`
          : `📨 Pídele a *${d.personName}* que me escriba desde su WhatsApp (+57 312 388 5012); ahí le pregunto si autoriza que prepares sus cuentas. Te aviso apenas responda.`,
      ),
    );
  }

  /** Registered contractor with a pending request from a gestor: asked once, before anything else. */
  private async askPendingDelegation(turn: Turn): Promise<boolean> {
    const asked = (turn.state.context.dlgAsked as string[] | undefined) ?? [];
    const d = (await this.deps.store.pendingDelegationsFor(turn.user.phone)).find(
      (x) => !asked.includes(x.id),
    );
    if (!d) return false;
    turn.state.context = { ...turn.state.context, dlgAsked: [...asked, d.id] };
    turn.out.push(...(await this.askDelegation(d, turn.user.phone)));
    return true;
  }

  /** The authorization question, with the data policy and the terms (Ley 1581). */
  private async askDelegation(d: Delegation, _to: string): Promise<Outgoing[]> {
    const manager = await this.deps.store.getUser(d.managerId);
    return [
      {
        type: 'cta_url',
        text: `👋 Hola ${d.personName.split(' ')[0]}. *${this.personName(manager)}* quiere preparar tus cuentas de cobro con ${SIGNATURE}.\n\nSi lo autorizas, podrá registrar tus actividades, cargar tus soportes y recibir tus documentos, y aceptas nuestra política de tratamiento de datos (Ley 1581 de 2012) y los términos del servicio: ${BRAND.terms}`,
        button: 'Ver política',
        url: BRAND.privacyPolicy,
      },
      buttons('¿Autorizas que prepare tus cuentas de cobro?', [
        { id: `dlg:yes:${d.id}`, title: 'Autorizo' },
        { id: `dlg:no:${d.id}`, title: 'No autorizo' },
      ]),
    ];
  }

  /** The person answers the gestor's request (from the template or from Pascal's question). */
  private async onDelegationAnswer(msg: Inbound): Promise<Outgoing[]> {
    const { store } = this.deps;
    const [, answer, id] = (msg.replyId ?? '').split(':');
    const d = id ? await store.getDelegation(id) : null;
    if (!d || d.personPhone !== msg.from || d.status !== 'pending')
      return [text('Esa solicitud ya no está vigente.')];
    const manager = await store.getUser(d.managerId);
    if (answer === 'no') {
      await store.answerDelegation(d.id, { accepted: false });
      await this.deps
        .notify?.(manager.phone, [text(`❌ *${d.personName}* no autorizó que prepares sus cuentas.`)])
        .catch(() => undefined);
      return [text('Entendido, no lo autoricé. 🙌')];
    }
    const person = (await store.getUserByPhone(msg.from)) ?? (await store.createUser(msg.from));
    // Accepting covers the data policy and the terms in force for this person.
    await store.recordConsent({
      userId: person.id,
      phone: msg.from,
      policyVersion: POLICY_VERSION,
      accepted: true,
      wamid: msg.id,
    });
    await store.recordConsent({
      userId: person.id,
      phone: msg.from,
      kind: 'terms',
      policyVersion: TERMS_VERSION,
      accepted: true,
      wamid: msg.id,
    });
    await store.answerDelegation(d.id, { accepted: true, personId: person.id });
    await this.deps
      .notify?.(manager.phone, [
        buttons(`✅ *${d.personName}* autorizó que prepares sus cuentas.`, [
          { id: `who:${person.id}`, title: 'Trabajar sus cuentas' },
        ]),
      ])
      .catch(() => undefined);
    return [
      text(
        `✅ Listo, autorizaste a *${this.personName(manager)}* para preparar tus cuentas de cobro. Tú también puedes escribirme cuando quieras: lo que registres queda en las mismas cuentas. Si quieres quitarle el acceso, escribe *revocar autorización*.`,
      ),
    ];
  }

  /**
   * Contractors configured before a profile question existed (e.g. place of issue of the ID) are asked
   * once, after their message is handled, so the documents never go out with that field empty.
   */
  private async askMissingProfile(turn: Turn): Promise<void> {
    if (turn.state.flow !== 'idle' || turn.user.docIssuedIn.trim()) return;
    if ((await this.deps.store.listContracts(turn.user.id)).length === 0) return;
    this.setFlow(turn, 'profile_doc_issued_in', 'ask');
    turn.out.push(
      text(
        '🪪 Me falta un dato para tus documentos: ¿en qué municipio fue *expedida tu cédula*? Escríbelo así: Ábrego, Norte de Santander',
      ),
    );
  }

  /**
   * Answer to the place-of-issue question, confirmed with a button so a daily note is never taken for
   * a municipality. Returns false when the message is something else, which is then handled normally.
   */
  private async onDocIssuedIn(turn: Turn, msg: Inbound): Promise<boolean> {
    const candidate = turn.state.context.candidate as string | undefined;
    if (msg.kind === 'reply' && msg.replyId === 'doc:yes' && candidate) {
      const user = { ...turn.user, docIssuedIn: candidate };
      await this.deps.store.saveUserProfile(user);
      turn.user = user;
      this.reset(turn);
      turn.out.push(text(`✅ Listo, guardé que tu cédula fue expedida en *${candidate}*.`));
      return true;
    }
    if (msg.kind === 'reply' && msg.replyId === 'doc:no') {
      this.setFlow(turn, 'profile_doc_issued_in', 'ask');
      turn.out.push(text('Escríbeme de nuevo el municipio, así: Ábrego, Norte de Santander'));
      return true;
    }
    const place = msg.kind === 'text' ? msg.text?.trim().replace(/\s+/g, ' ') : undefined;
    if (
      !place ||
      place.length < 3 ||
      place.length > 60 ||
      /\d/.test(place) ||
      matchCommand(place) ||
      findAllyCode(place)
    ) {
      this.reset(turn);
      return false;
    }
    this.setFlow(turn, 'profile_doc_issued_in', 'confirm', { candidate: place });
    turn.out.push(
      buttons(`¿Tu cédula fue expedida en *${place}*?`, [
        { id: 'doc:yes', title: '✅ Sí' },
        { id: 'doc:no', title: 'Corregir' },
      ]),
    );
    return true;
  }

  private idle(userId: string): ConversationState {
    return { userId, flow: 'idle', step: 'start', context: {}, updatedAt: new Date(0).toISOString() };
  }

  private setFlow(turn: Turn, flow: string, step: string, context: Ctx = {}): void {
    // Remembered across flows: the report the contractor opened ("vamos con septiembre") and the notes
    // already reviewed before drafting.
    const sticky: Ctx = {};
    for (const k of STICKY_KEYS) {
      const v = turn.state.context?.[k];
      if (v !== undefined && context[k] === undefined) sticky[k] = v;
    }
    turn.state.flow = flow;
    turn.state.step = step;
    turn.state.context = { ...context, ...sticky };
  }

  private reset(turn: Turn): void {
    const pending = turn.state.context.pendingEvidence;
    this.setFlow(turn, 'idle', 'start', pending ? { pendingEvidence: pending } : {});
  }

  /**
   * Reports a dateless activity or photo could belong to: today's report, and earlier ones not
   * delivered yet that are being worked on (opened by the contractor, or closed in the last two
   * months with activities already). When an earlier one is open Pascal asks instead of assuming today.
   */
  private async candidatePeriods(
    turn: Turn,
    contracts: Contract[],
  ): Promise<{ c: Contract; p: Period; current: boolean }[]> {
    const today = this.deps.clock.today();
    const working = turn.state.context.working as { contractId: string; number: number } | undefined;
    const out: { c: Contract; p: Period; current: boolean }[] = [];
    for (const c of contracts) {
      for (const p of await this.deps.store.listPeriods(c.id)) {
        if (p.status === 'delivered' || compareIso(p.from, today) > 0) continue;
        const current = compareIso(today, p.to) <= 0;
        const opened = working?.contractId === c.id && working.number === p.number;
        // A recent earlier report counts once it has activities (one done outside Pascal does not).
        const inProgress =
          compareIso(p.to, addDays(today, -OPEN_REPORT_DAYS)) >= 0 &&
          (await this.deps.store.listNotes(c.id, p.from, p.to)).length > 0;
        if (current || opened || inProgress) out.push({ c, p, current });
      }
    }
    return out.sort((a, b) => compareIso(a.p.from, b.p.from));
  }

  /** «Septiembre 2026», or «12 jul – 11 ago» for a period across two months (button title). */
  private periodTitle(p: Period): string {
    const short = (d: IsoDate) => `${Number(d.slice(8, 10))} ${monthNameEs(d).toLowerCase().slice(0, 3)}`;
    if (p.from.slice(0, 7) === p.to.slice(0, 7)) {
      const m = monthNameEs(p.from);
      return `${m.charAt(0).toUpperCase()}${m.slice(1).toLowerCase()} ${p.from.slice(0, 4)}`;
    }
    return `${short(p.from)} – ${short(p.to)}`;
  }

  // -------------------------------------------------------------------------
  // Dispatch
  // -------------------------------------------------------------------------
  private async dispatch(turn: Turn, msg: Inbound): Promise<void> {
    if (msg.kind === 'audio' && msg.media) {
      let transcript = '';
      try {
        transcript = await this.deps.stt.transcribe(msg.media.data, msg.media.mime);
      } catch (e) {
        // No credits, provider down…: say so instead of failing the whole message.
        this.deps.warn?.('stt.failed', { userId: turn.user.id, error: String(e) });
      }
      if (!transcript.trim()) {
        turn.out.push(
          text(
            '🎙️ No pude escuchar bien tu nota de voz. ¿Me la escribes, o me la envías de nuevo en unos minutos?',
          ),
        );
        return;
      }
      turn.out.push(text(`🎙️ Te entendí: «${clip(transcript, 300)}»`));
      return this.dispatch(turn, { ...msg, kind: 'text', text: transcript });
    }

    const allyCode = msg.kind === 'text' && msg.text ? findAllyCode(msg.text) : null;
    if (allyCode) {
      turn.out.push(referralText(await this.deps.store.applyReferral(turn.user.id, allyCode), allyCode));
      return;
    }

    // Contracts whose configuration is not paid yet are not active (terms, section 5).
    if (!turn.state.flow.startsWith('pay_') && turn.state.flow !== SETUP_FLOW) {
      const cmd =
        msg.kind === 'text' && msg.text
          ? matchCommand(msg.text)
          : msg.replyId?.startsWith('menu:')
            ? (msg.replyId.slice(5) as Command)
            : null;
      const open = cmd && OPEN_WHILE_UNPAID.includes(cmd);
      if (!open && (await this.setupGate(turn, false))) return;
    }

    if (turn.state.flow === SETUP_FLOW) {
      const cmd = msg.kind === 'text' && msg.text ? matchCommand(msg.text) : null;
      // There is always a way out: "cancelar", "menú", "olvídalo", "ayuda" or a menu button.
      const leave =
        cmd === 'cancel' ||
        cmd === 'menu' ||
        cmd === 'help' ||
        msg.replyId === 'setup:leave' ||
        (msg.replyId?.startsWith('menu:') ?? false);
      if (leave) {
        const hadContracts = (await this.deps.store.listContracts(turn.user.id)).length > 0;
        this.reset(turn);
        turn.out.push(
          text('Listo, dejé la configuración en pausa. Cuando quieras retomarla escribe *agregar contrato*.'),
        );
        if (msg.replyId?.startsWith('menu:') && msg.replyId !== 'menu:menu')
          return this.command(turn, msg.replyId.slice(5) as Command);
        if (hadContracts) this.menu(turn, cmd === 'help');
        return;
      }
      if (cmd !== 'about' && cmd !== 'support' && cmd !== 'ally') {
        const before = turn.state.step;
        await this.setup.handle(turn, msg);
        // A contract configured in live mode starts with its configuration charge pending.
        if (turn.state.flow !== SETUP_FLOW) return void (await this.setupGate(turn, true));
        // Asked the same thing again: from the second time, offer the way out with a button.
        const ctx = turn.state.context as { setupRetries?: number };
        const retries = turn.state.step === before ? (ctx.setupRetries ?? 0) + 1 : 0;
        turn.state.context = { ...turn.state.context, setupRetries: retries };
        if (retries >= 2)
          turn.out.push(
            buttons('¿Prefieres dejar la configuración para después?', [
              { id: 'setup:leave', title: 'Salir y ver menú' },
            ]),
          );
        return;
      }
    }

    if (msg.kind === 'text' && msg.text) {
      const forced = forcedNote(msg.text);
      if (forced) {
        this.reset(turn);
        return this.startNote(turn, forced);
      }
      const monthReq = matchMonthRequest(msg.text);
      if (monthReq && (await this.activeContracts(turn)).length) {
        this.reset(turn);
        return this.startMonthReport(turn, monthReq.month, monthReq.redo, monthReq.reset);
      }
      const cmd = matchCommand(msg.text);
      // No contract yet: greetings and the menu go to the setup (or the pending-institution notice).
      if (
        (cmd === 'menu' || cmd === 'help') &&
        (await this.deps.store.listContracts(turn.user.id)).length === 0
      )
        return this.onIdle(turn, msg);
      if (cmd) return this.command(turn, cmd);
    }

    // Photos can arrive at any moment (albums, late attachments).
    if (msg.kind === 'image' && msg.media && turn.state.flow === 'signature_upload') {
      return this.saveSignature(turn, msg);
    }
    if (msg.kind === 'image' && msg.media && turn.state.flow === 'photo_pick') {
      // More photos of the same album while we ask which activity they belong to.
      const id = this.deps.newId();
      await this.deps.store.addEvidence({
        id,
        userId: turn.user.id,
        data: msg.media.data,
        mime: msg.media.mime,
      });
      const ctx = turn.state.context as { pendingEvidence?: string[] };
      ctx.pendingEvidence = [...(ctx.pendingEvidence ?? []), id];
      return;
    }
    if (msg.kind === 'image' && msg.media && turn.state.flow === GUIDE_FLOW) {
      turn.out.push(
        text(
          '📸 Para los certificados necesito el *PDF*. Si la página no tiene botón de descarga, usa *Compartir → Imprimir → Guardar como PDF* en el navegador y envíame ese archivo.\nSi era una foto de una actividad, escribe *terminar* y vuelve a enviarla.',
        ),
      );
      return;
    }
    if (msg.kind === 'image' && msg.media && turn.state.flow !== 'idle') {
      // More photos while Pascal asks about the note they belong to.
      if (['note_contract', 'note_period', 'note_when'].includes(turn.state.flow)) {
        const id = this.deps.newId();
        await this.deps.store.addEvidence({
          id,
          userId: turn.user.id,
          data: msg.media.data,
          mime: msg.media.mime,
        });
        const ctx = turn.state.context as { evidenceIds: string[] };
        ctx.evidenceIds = [...(ctx.evidenceIds ?? []), id];
        return;
      }
      this.reset(turn);
    }
    if (msg.kind === 'document' && msg.media && turn.state.flow === GUIDE_FLOW) {
      const guide = turn.state.context as unknown as GuideCtx;
      await this.receiveSupport(turn, msg, guide);
      // When the document was not recognized Pascal asks what it is; the guide resumes after the answer.
      if (turn.state.flow === GUIDE_FLOW) await this.guideStep(turn, guide);
      return;
    }
    if (msg.kind === 'document' && msg.media && turn.state.flow !== 'idle') this.reset(turn);

    if (msg.kind === 'reply' && msg.replyId?.startsWith('guide:')) {
      this.reset(turn);
      const c = (await this.activeContracts(turn)).find((x) => x.id === msg.replyId!.slice(6));
      if (c) return this.startGuide(turn, c);
    }

    if (msg.kind === 'reply' && msg.replyId?.startsWith('redo:')) {
      this.reset(turn);
      const [contractId, n] = msg.replyId.slice(5).split(':');
      const c = (await this.activeContracts(turn)).find((x) => x.id === contractId);
      if (c) return this.startGenerate(turn, c, true, Number(n));
    }
    if (msg.kind === 'reply' && msg.replyId?.startsWith('who:')) return this.switchPerson(turn, msg.replyId);
    if (msg.kind === 'reply' && msg.replyId?.startsWith('rvk:')) return this.onRevoke(turn, msg.replyId);
    // Corrections of a recorded activity work whatever Pascal was asking.
    if (msg.kind === 'reply' && msg.replyId?.startsWith('chg:')) {
      this.reset(turn);
      return this.askCorrection(turn, msg.replyId.slice(4));
    }
    if (msg.kind === 'reply' && msg.replyId?.startsWith('cob:'))
      return this.askObligation(turn, msg.replyId.slice(4));
    if (msg.kind === 'reply' && msg.replyId?.startsWith('mvq:'))
      return this.askMoveNote(turn, msg.replyId.slice(4));
    if (msg.kind === 'reply' && msg.replyId?.startsWith('mv:') && msg.replyId !== 'mv:other') {
      const [noteId, n] = msg.replyId.slice(3).split(':');
      return this.moveNote(turn, noteId!, Number(n));
    }
    if (msg.kind === 'reply' && msg.replyId?.startsWith('rst:')) {
      this.reset(turn);
      const [contractId, n] = msg.replyId.slice(4).split(':');
      const c = (await this.activeContracts(turn)).find((x) => x.id === contractId);
      const p = c && (await this.deps.store.listPeriods(c.id)).find((x) => x.number === Number(n));
      if (c && p) return this.resetReport(turn, c, p);
    }
    if (msg.kind === 'reply' && msg.replyId?.startsWith('dft:')) {
      this.reset(turn);
      const [contractId, n] = msg.replyId.slice(4).split(':');
      const c = (await this.activeContracts(turn)).find((x) => x.id === contractId);
      const p = c && (await this.deps.store.listPeriods(c.id)).find((x) => x.number === Number(n));
      if (c && p) return this.startDraft(turn, c, p);
    }
    if (msg.kind === 'reply' && msg.replyId?.startsWith('menu:')) {
      return this.command(turn, msg.replyId.slice(5) as Command);
    }

    switch (turn.state.flow) {
      case 'note_contract':
        return this.onNoteContract(turn, msg);
      case 'person_phone':
        return this.onPersonPhone(turn, msg);
      case 'person_name':
        return this.onPersonName(turn, msg);
      case 'note_redate':
        return this.onNoteRedate(turn, msg);
      case 'note_check':
        return this.onNoteCheck(turn, msg);
      case 'note_period':
        return this.onNotePeriod(turn, msg);
      case 'photo_period':
        return this.onPhotoPeriod(turn, msg);
      case 'note_when':
        return this.onNoteWhen(turn, msg);
      case 'note_obligation':
        return this.onNoteObligation(turn, msg);
      case 'note_extra_obligation':
        return this.onExtraObligation(turn, msg);
      case 'draft_pick_contract':
        return this.onPickContract(turn, msg, (c) => this.startDraft(turn, c));
      case 'pay_wait':
      case 'pay_code':
        return this.onPayment(turn, msg);
      case 'expired_ask':
        return this.onExpired(turn, msg);
      case 'photo_pick':
        return this.onPhotoPick(turn, msg);
      case 'amount_confirm':
      case 'amount_cert':
        return this.onAmountChoice(turn, msg);
      case 'amount_write':
        return this.onAmountWrite(turn, msg);
      case 'generate_no_pila': {
        const ctx = turn.state.context as { contractId: string; periodNumber: number; resend: boolean };
        if (msg.replyId !== 'nopila:go') break;
        const c = await this.deps.store.getContract(ctx.contractId);
        turn.state.context = { noPila: `${c.id}:${ctx.periodNumber}` };
        await this.startGenerate(turn, c, ctx.resend, ctx.periodNumber);
        this.reset(turn);
        return;
      }
      case 'generate_pick_contract':
        return this.onPickContract(turn, msg, (c) => this.startGenerate(turn, c));
      case 'status_pick_contract':
        return this.onPickContract(turn, msg, (c) => this.startStatus(turn, [c]));
      case 'guide_pick_contract':
        return this.onPickContract(turn, msg, (c) => this.startGuide(turn, c));
      case GUIDE_FLOW:
        return this.onGuide(turn, msg);
      case 'signature_upload':
        turn.out.push(
          text('Envíame la firma como *foto* (imagen), no como documento. Para salir escribe *menú*.'),
        );
        return;
      case 'short_unclear': {
        const t = (turn.state.context as { noteText: string }).noteText;
        this.reset(turn);
        if (msg.replyId === 'short:note') return this.startNote(turn, t);
        if (msg.replyId?.startsWith('short:do:')) {
          const [intent, month] = msg.replyId.slice(9).split(':');
          return this.runIntent(turn, t, intent as MessageIntentKind, month ? Number(month) : null);
        }
        if (msg.kind === 'text' && msg.text) return this.freeText(turn, msg.text);
        return this.menu(turn, false);
      }
      case 'reset_pick_contract':
        return this.onPickContract(turn, msg, async (c) => {
          const p = await this.currentPeriod(c);
          if (!p) turn.out.push(text(`No tienes cuentas pendientes en ${c.shortLabel}.`));
          else await this.askReset(turn, c, p);
        });
      case 'cut_pick_contract':
        return this.onPickContract(turn, msg, (c) => this.startCut(turn, c));
      case 'draft_missing':
        return this.onDraftMissing(turn, msg);
      case 'draft_missing_text':
        return this.onDraftMissingText(turn, msg);
      case 'review':
        return this.onReview(turn, msg);
      case 'edit_pick':
        return this.onEditPick(turn, msg);
      case 'edit_text':
        return this.onEditText(turn, msg);
      case 'support_type':
        return this.onSupportType(turn, msg);
      case 'cut_mode':
        return this.onCutMode(turn, msg);
      default:
        return this.onIdle(turn, msg);
    }
  }

  private async command(turn: Turn, cmd: Command): Promise<void> {
    this.reset(turn);
    switch (cmd) {
      case 'menu':
      case 'help':
      case 'cancel':
        return this.menu(turn, cmd === 'help');
      case 'status':
        return this.withContract(turn, 'status_pick_contract', (cs) => this.startStatus(turn, cs), true);
      case 'contracts':
        return this.showContracts(turn);
      case 'draft':
        return this.withContract(turn, 'draft_pick_contract', (cs) => this.startDraft(turn, cs[0]!));
      case 'generate':
        return this.withContract(turn, 'generate_pick_contract', (cs) => this.startGenerate(turn, cs[0]!));
      case 'resend':
        return this.withContract(turn, 'generate_pick_contract', (cs) =>
          this.startGenerate(turn, cs[0]!, true),
        );
      case 'cut_mode':
        return this.withContract(turn, 'cut_pick_contract', (cs) => this.startCut(turn, cs[0]!));
      case 'reset':
        return this.withContract(turn, 'reset_pick_contract', async (cs) => {
          const p = await this.currentPeriod(cs[0]!);
          if (!p) turn.out.push(text(`No tienes cuentas pendientes en ${cs[0]!.shortLabel}.`));
          else await this.askReset(turn, cs[0]!, p);
        });
      case 'support':
        await this.deps.store.openSupportTicket(turn.user.id, 'Hablar con una persona');
        turn.out.push(
          text('🙋 Listo, le aviso a una persona del equipo de soporte. Te escribiremos por aquí.'),
        );
        return;
      case 'stop_reminders':
        await this.deps.store.setRemindersOptOut(turn.user.id, true);
        turn.out.push(
          text(
            '🔕 Desactivé tus recordatorios. Puedes seguir usando el servicio normalmente; si los quieres de nuevo, escribe *activar recordatorios*.',
          ),
        );
        return;
      case 'start_reminders':
        await this.deps.store.setRemindersOptOut(turn.user.id, false);
        turn.out.push(text('🔔 Listo, activé tus recordatorios.'));
        return;
      case 'about':
        turn.out.push(...this.about());
        return;
      case 'undo_note': {
        const note = await this.deps.store.lastNote(turn.user.id);
        if (!note) {
          turn.out.push(text('No tienes notas para borrar.'));
          return;
        }
        turn.out.push(
          buttons(`🗑️ ¿Borro tu última nota (${formatDdMmYyyy(note.date)})?\n«${clip(note.text, 300)}»`, [
            { id: `del:${note.id}`, title: 'Sí, borrarla' },
            { id: 'del:no', title: 'No' },
          ]),
        );
        return;
      }
      case 'ally': {
        const status = await this.deps.store.allyStatus(turn.user.id);
        turn.out.push(...(status ? allyStatusText(status) : [NOT_ALLY_TEXT]));
        return;
      }
      case 'add_contract':
        await this.setup.start(turn, 'another');
        return;
      case 'people':
        return this.showPeople(turn);
      case 'add_person':
        return this.startAddPerson(turn);
      case 'revoke':
        return this.showAuthorizations(turn);
      case 'signature':
        return this.askSignature(turn);
      case 'guide':
        return this.withContract(turn, 'guide_pick_contract', (cs) => this.startGuide(turn, cs[0]!));
      case 'my_data':
        turn.out.push(
          text(
            `👤 ${turn.user.fullName}\nC.C. ****${turn.user.docNumber.slice(-4)} de ${turn.user.docIssuedIn}\nCuenta ${turn.user.accountType} ${turn.user.bankName} ****${turn.user.accountNumber.slice(-4)}\nRégimen ${turn.user.regime === 'comun' ? 'común' : 'simplificado'}`,
          ),
        );
        return;
    }
  }

  private menu(turn: Turn, help: boolean): void {
    const first = turn.user.fullName.split(' ')[0];
    if (help) {
      turn.out.push(
        text(
          `Soy ${SIGNATURE}. Así me usas:\n1️⃣ Durante el mes, cuéntame lo que haces: texto, audio o fotos. Yo lo anoto en la obligación que corresponde.\n2️⃣ Envíame los soportes (planilla, antecedentes, afiliaciones) cuando los tengas.\n3️⃣ Al cierre escribe *genera el informe* (o *ver borrador*): redacto el informe y tú lo apruebas.\n4️⃣ Escribe *generar* y te envío los documentos listos para firmar.\n↩️ Si una nota quedó mal, escribe *borra la última nota*; para empezar un informe de cero, *reiniciar*.\n✍️ Para cargar o cambiar tu firma, escribe *firma*.\n👥 Para hacer las cuentas de otra persona, escribe *agregar persona*; para cambiar entre cuentas, *cambiar persona*.`,
        ),
      );
      turn.out.push(
        buttons('🙋 ¿Necesitas hablar con una persona del equipo?', [
          { id: 'menu:support', title: 'Hablar con soporte' },
        ]),
      );
    }
    turn.out.push(
      list(
        `Hola ${first} 👋 ¿Qué quieres hacer? También puedes contarme directamente lo que hiciste hoy.`,
        'Ver opciones',
        [
          { id: 'menu:status', title: '¿Qué me falta?', description: 'Checklist de tu cuenta del periodo' },
          { id: 'menu:draft', title: 'Ver borrador', description: 'Redactar y revisar el informe' },
          {
            id: 'menu:generate',
            title: 'Generar documentos',
            description: 'Informes y paquetes listos para firmar',
          },
          { id: 'menu:contracts', title: 'Mis contratos' },
          { id: 'menu:add_contract', title: 'Agregar contrato', description: 'Configurar un contrato nuevo' },
          { id: 'menu:cut_mode', title: 'Cambiar corte', description: 'Fin de mes o fecha a fecha' },
          { id: 'menu:my_data', title: 'Mis datos' },
          {
            id: 'menu:signature',
            title: 'Cargar mi firma',
            description: 'Para que tus informes vayan firmados',
          },
          { id: 'menu:help', title: 'Ayuda y soporte', description: 'Cómo usarme o hablar con una persona' },
          {
            id: 'menu:people',
            title: 'Cuentas de otra persona',
            description: 'Hacer o cambiar las cuentas de alguien más',
          },
        ],
      ),
    );
  }

  /** Who we are and where to learn more (answers "conocer PascalIA", "servicios", etc.). */
  private about(): Outgoing[] {
    return [
      {
        type: 'cta_url',
        text: `🌼 ${BRAND.company} crea soluciones de inteligencia artificial para organizaciones y personas: consultoría, desarrollo y capacitación. ${BRAND.service} es nuestro servicio para contratistas del Estado.\n\nConoce todos nuestros servicios en nuestra página.`,
        button: `Ir a ${BRAND.company}`,
        url: BRAND.website,
      },
    ];
  }

  private async activeContracts(turn: Turn, date?: IsoDate): Promise<Contract[]> {
    const d = date ?? this.deps.clock.today();
    const all = await this.unpaidFilter(await this.deps.store.listContracts(turn.user.id));
    const active = all.filter((c) => compareIso(c.startDate, d) <= 0 && compareIso(d, c.endDate) <= 0);
    if (active.length || date) return active;
    // Nothing in force today: fall back to contracts with a pending period.
    const withPending: Contract[] = [];
    for (const c of all) {
      const ps = await this.deps.store.listPeriods(c.id);
      if (ps.some((p) => p.status !== 'delivered')) withPending.push(c);
    }
    return withPending.length ? withPending : all;
  }

  private async withContract(
    turn: Turn,
    pickFlow: string,
    run: (cs: Contract[]) => Promise<void>,
    allowAll = false,
  ): Promise<void> {
    const cs = await this.activeContracts(turn);
    if (cs.length === 0) {
      turn.out.push(
        text('Aún no tienes contratos configurados. Escribe *agregar contrato* para configurar uno.'),
      );
      return;
    }
    if (cs.length === 1 || allowAll) return run(cs);
    this.setFlow(turn, pickFlow, 'pick');
    turn.out.push(
      choose(
        '¿De cuál contrato?',
        cs.map((c) => ({ id: `c:${c.id}`, title: c.shortLabel })),
      ),
    );
  }

  private async onPickContract(turn: Turn, msg: Inbound, run: (c: Contract) => Promise<void>): Promise<void> {
    const id = msg.replyId?.startsWith('c:') ? msg.replyId.slice(2) : null;
    const cs = await this.activeContracts(turn);
    const c = cs.find((x) => x.id === id) ?? this.matchContractByText(cs, msg.text);
    if (!c) {
      turn.out.push(
        choose(
          'Elige uno de tus contratos:',
          cs.map((x) => ({ id: `c:${x.id}`, title: x.shortLabel })),
        ),
      );
      return;
    }
    this.reset(turn);
    await run(c);
  }

  private matchContractByText(cs: Contract[], t?: string): Contract | undefined {
    if (!t) return undefined;
    const n = t.replace(/\D/g, '');
    return n ? cs.find((c) => c.number.endsWith(n) || c.fullNumber.includes(n)) : undefined;
  }

  private async showContracts(turn: Turn): Promise<void> {
    const cs = await this.deps.store.listContracts(turn.user.id);
    if (!cs.length) {
      turn.out.push(text('Aún no tienes contratos registrados.'));
      return;
    }
    const lines = await Promise.all(
      cs.map(async (c) => {
        const e = await this.deps.store.getEntity(c.entityId);
        const mode = c.periodMode === 'month_end' ? 'corte a fin de mes' : 'corte fecha a fecha';
        return `📄 *${c.fullNumber}* – ${e.shortName}\n${clip(c.object, 120)}\n${formatDdMmYyyy(c.startDate)} a ${formatDdMmYyyy(c.endDate)} · ${formatCOP(c.totalValue)} · ${c.paymentsCount} pagos · ${mode}`;
      }),
    );
    turn.out.push(text(lines.join('\n\n')));
  }

  // -------------------------------------------------------------------------
  // Notes and evidences
  // -------------------------------------------------------------------------
  private async onIdle(turn: Turn, msg: Inbound): Promise<void> {
    if ((await this.deps.store.listContracts(turn.user.id)).length === 0) {
      const pending = await this.deps.store.pendingInstitutionRequest(turn.user.id);
      if (pending && !(msg.kind === 'text' && msg.text && matchCommand(msg.text) === 'add_contract')) {
        turn.out.push(
          text(
            `⏳ Estamos configurando *${pending}*; te escribimos por aquí cuando esté lista.\nSi tienes un contrato con otra institución, escribe *agregar contrato*.`,
          ),
        );
        return;
      }
      await this.setup.start(turn, 'first');
      return;
    }
    if (msg.kind === 'image' && msg.media) {
      const id = this.deps.newId();
      await this.deps.store.addEvidence({
        id,
        userId: turn.user.id,
        data: msg.media.data,
        mime: msg.media.mime,
      });
      const pending = [...((turn.state.context.pendingEvidence as string[]) ?? []), id];
      turn.state.context = { ...turn.state.context, pendingEvidence: pending };
      // Photo with a caption: the caption is the activity, so the note is saved right away.
      const caption = msg.text?.trim();
      if (caption) return this.startNote(turn, caption);
      // Albums arrive as several messages: ask only once.
      if (pending.length === 1) await this.askPhotoActivity(turn, pending);
      return;
    }
    if (msg.kind === 'document' && msg.media) return this.receiveSupport(turn, msg);
    if (msg.kind === 'text' && msg.text) return this.freeText(turn, msg.text);
    if (msg.kind === 'reply' && msg.replyId?.startsWith('del:')) {
      const id = msg.replyId.slice(4);
      if (id !== 'no') await this.deps.store.deleteNote(id);
      turn.out.push(text(id === 'no' ? 'Listo, no borré nada.' : '🗑️ Borré la nota.'));
      return;
    }
    if (msg.kind === 'reply' && msg.replyId?.startsWith('add:'))
      return this.askExtraObligation(turn, msg.replyId.slice(4));
    if (msg.kind === 'reply' && msg.replyId?.startsWith('nok:')) {
      const note = await this.deps.store.getNote(msg.replyId.slice(4));
      await this.deps.store.updateNote({ ...note, confidence: 1 });
      turn.out.push(text('👍 Perfecto.'));
      return;
    }
    return this.menu(turn, false);
  }

  // -------------------------------------------------------------------------
  // Expired supports (antecedentes, afiliaciones): generate with them or upload them again
  // -------------------------------------------------------------------------
  private async askExpired(turn: Turn, expired: { type: SupportType; supportId: string }[]): Promise<void> {
    this.setFlow(turn, 'expired_ask', 'ask', {
      supportIds: expired.map((e) => e.supportId),
      types: expired.map((e) => ({ label: e.type.label, url: e.type.officialUrl ?? null })),
    });
    const names = [...new Set(expired.map((e) => e.type.label))].join(', ');
    turn.out.push(
      buttons(
        `⚠️ ${expired.length === 1 ? 'Este documento está vencido' : 'Estos documentos están vencidos'}: ${names}. La entidad puede devolver la cuenta por eso.\n\n¿Quieres generar el informe con estos documentos o prefieres volver a cargarlos actualizados?`,
        [
          { id: 'exp:ok', title: 'Generar así' },
          { id: 'exp:reload', title: 'Volver a cargar' },
        ],
      ),
    );
  }

  private async onExpired(turn: Turn, msg: Inbound): Promise<void> {
    const ctx = turn.state.context as {
      supportIds: string[];
      types: { label: string; url: string | null }[];
    };
    if (msg.replyId === 'exp:ok') {
      await this.deps.store.acceptExpiredSupports(ctx.supportIds);
      this.reset(turn);
      turn.out.push(
        text('Listo, usaré estos documentos aunque estén vencidos; quedan bajo tu responsabilidad.'),
      );
      return this.command(turn, 'generate');
    }
    if (msg.replyId === 'exp:reload') {
      this.reset(turn);
      const links = ctx.types
        .filter((t) => t.url)
        .map((t) => `🔗 ${t.label}: ${t.url}`)
        .join('\n');
      turn.out.push(
        text(
          `Perfecto. Descarga los documentos actualizados y envíamelos en PDF; cuando los tenga, escribe *generar*.${links ? `\n\n${links}` : ''}`,
        ),
      );
      return;
    }
    // Anything else: leave the question and handle the message normally.
    this.reset(turn);
    return this.dispatch(turn, msg);
  }

  // -------------------------------------------------------------------------
  // Photos without a caption: attach them to an activity already registered, to an obligation by its
  // number, or describe a new activity.
  // -------------------------------------------------------------------------
  private async recentNotes(turn: Turn): Promise<Note[]> {
    const today = this.deps.clock.today();
    const notes: Note[] = [];
    for (const c of await this.activeContracts(turn))
      notes.push(...(await this.deps.store.listNotes(c.id, addDays(today, -PHOTO_RECENT_DAYS), today)));
    return notes.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, PHOTO_RECENT_NOTES);
  }

  private async askPhotoActivity(turn: Turn, pending: string[]): Promise<void> {
    const notes = await this.recentNotes(turn);
    if (!notes.length) {
      turn.out.push(
        text(
          '📷 Recibí tu foto. ¿Qué actividad muestra? Cuéntamelo en un mensaje, o escribe el *número de la obligación* a la que corresponde.',
        ),
      );
      this.setFlow(turn, 'photo_pick', 'ask', { pendingEvidence: pending });
      return;
    }
    const contracts = await this.deps.store.listContracts(turn.user.id);
    const oblNumber = (n: Note) => {
      const c = contracts.find((x) => x.id === n.contractId);
      return c?.obligations.find((o) => o.key === n.obligationKey)?.number;
    };
    this.setFlow(turn, 'photo_pick', 'ask', { pendingEvidence: pending });
    turn.out.push(
      list(
        '📷 Recibí tu foto. ¿De qué actividad es? Elige una de las que ya registraste, escribe el *número de la obligación* o cuéntame la actividad en un mensaje.',
        'Elegir actividad',
        [
          ...notes.map((n) => ({
            id: `ph:${n.id}`,
            title: clip(n.text, 24),
            description: clip(
              `${formatDdMmYyyy(n.date)}${oblNumber(n) ? ` · obligación ${oblNumber(n)}` : ''} · ${n.text}`,
              72,
            ),
          })),
          { id: 'ph:new', title: 'Es otra actividad', description: 'La describo en un mensaje' },
        ],
      ),
    );
  }

  private async onPhotoPick(turn: Turn, msg: Inbound): Promise<void> {
    const pending = ((turn.state.context as { pendingEvidence?: string[] }).pendingEvidence ?? []).slice();
    const photos = (n: number) => (n === 1 ? 'la foto' : `las ${n} fotos`);
    // An activity already registered.
    if (msg.replyId?.startsWith('ph:') && msg.replyId !== 'ph:new') {
      const note = await this.deps.store.getNote(msg.replyId.slice(3));
      await this.deps.store.updateNote({ ...note, evidenceIds: [...note.evidenceIds, ...pending] });
      this.setFlow(turn, 'idle', 'start', {}); // the photos are placed
      const c = await this.deps.store.getContract(note.contractId);
      turn.out.push(
        text(
          `✅ Agregué ${photos(pending.length)} a «${clip(note.text, 80)}».\n${await this.periodLine(c, note.date)}`,
        ),
      );
      return;
    }
    if (msg.replyId === 'ph:new') {
      this.setFlow(turn, 'idle', 'start', { pendingEvidence: pending });
      turn.out.push(text('Cuéntame en un mensaje qué actividad muestra.'));
      return;
    }
    const t = (msg.text ?? '').trim();
    // The obligation number: the latest activity of that obligation in the open report gets the photos;
    // if it has none yet, a photo record is created for it.
    const num = /^(?:obligaci[oó]n\s*)?(\d{1,3})$/i.exec(t);
    if (num) {
      const n = Number(num[1]);
      const cs = await this.activeContracts(turn);
      const c = cs.find((x) => x.obligations.some((o) => o.number === n));
      const o = c?.obligations.find((x) => x.number === n);
      if (!c || !o) {
        turn.out.push(
          text(
            `No encuentro la obligación ${n} en tus contratos. Escribe otro número o cuéntame la actividad.`,
          ),
        );
        return;
      }
      // An earlier report still open: ask which one instead of assuming today's.
      const options = await this.candidatePeriods(turn, [c]);
      if (options.length > 1) {
        this.setFlow(turn, 'photo_period', 'ask', {
          pendingEvidence: pending,
          contractId: c.id,
          obligation: n,
        });
        const rows = options.map(({ p, current }) => ({
          id: `pp:${p.number}`,
          title: current ? `${this.periodTitle(p)} (hoy)`.slice(0, 20) : this.periodTitle(p),
        }));
        const body = `📅 ¿A qué informe ${pending.length === 1 ? 'corresponde la foto' : 'corresponden las fotos'} de la obligación ${n}?`;
        turn.out.push(rows.length <= MAX_BUTTONS ? buttons(body, rows) : choose(body, rows));
        return;
      }
      const p = options[0]?.p ?? (await this.currentPeriod(c));
      return this.placePhotos(turn, c, o, p, pending);
    }
    // Anything else describes the activity: a new note with the photos.
    this.setFlow(turn, 'idle', 'start', { pendingEvidence: pending });
    if (msg.kind === 'text' && t) return this.freeText(turn, t);
    return this.dispatch(turn, msg);
  }

  /**
   * Free text that matched no command. Real activities are usually described in several words; a short
   * message ("Rehace agosto", "ok", "vamos con julio") is checked with the AI before saving it as an
   * activity, so requests are never recorded as work done.
   */
  /**
   * Free text that matched no command: the cheapest model decides whether it is a work activity or a
   * request to Pascal ("vamos a iniciar el informe de septiembre"), and Pascal asks when it is not
   * sure instead of saving it as an activity (ADR-037).
   */
  private async freeText(turn: Turn, text: string): Promise<void> {
    const today = this.deps.clock.today();
    const r = await this.deps.ai
      .interpretMessage(text, today)
      .catch(
        (): MessageIntent => ({ intent: 'activity', month: null, guess: null, question: null, date: null }),
      );
    if (r.intent === 'activity') {
      // The dates Pascal reads itself come first; the model covers "la semana pasada", "el lunes pasado"…
      const when = parseActivityWhen(text, today) ?? this.aiWhen(r, today);
      return this.startNote(turn, text, when ?? undefined);
    }
    if (r.intent !== 'unclear') return this.runIntent(turn, text, r.intent, r.month);
    this.setFlow(turn, 'short_unclear', 'ask', { noteText: text });
    const guess = r.guess && r.guess !== 'activity' && r.guess !== 'unclear' ? r.guess : null;
    const question =
      r.question?.trim() ||
      `No estoy seguro de qué quieres hacer con «${clip(text, 60)}». ¿Es una actividad que hiciste o quieres que haga algo?`;
    turn.out.push(
      buttons(clip(question, 900), [
        ...(guess
          ? [{ id: `short:do:${guess}${r.month ? `:${r.month}` : ''}`, title: INTENT_TITLES[guess] }]
          : []),
        { id: 'short:note', title: 'Anotar actividad' },
        { id: 'menu:menu', title: 'Ver menú' },
      ]),
    );
  }

  /** The activity's date as understood by the model, when it is a plausible past date. */
  private aiWhen(r: MessageIntent, today: IsoDate): ActivityWhen | null {
    if (r.date && /^\d{4}-\d{2}-\d{2}$/.test(r.date) && compareIso(r.date, today) <= 0) {
      if (compareIso(r.date, addDays(today, -400)) >= 0) return { kind: 'day', date: r.date };
    }
    return null;
  }

  /** Acts on what a free-text message means. */
  private async runIntent(
    turn: Turn,
    text: string,
    intent: MessageIntentKind,
    month: number | null,
  ): Promise<void> {
    if (intent === 'activity' || intent === 'unclear') return this.startNote(turn, text);
    if (intent === 'move_note') return this.moveLastNote(turn, month);
    if (month && ['redo', 'reset', 'open_report', 'draft', 'generate'].includes(intent))
      return this.startMonthReport(turn, month, intent === 'redo', intent === 'reset');
    const cmd: Record<Exclude<MessageIntentKind, 'activity' | 'unclear' | 'move_note'>, Command> = {
      redo: 'resend',
      reset: 'reset',
      open_report: 'status',
      draft: 'draft',
      generate: 'generate',
      status: 'status',
      guide: 'guide',
      contracts: 'contracts',
      add_contract: 'add_contract',
      my_data: 'my_data',
      signature: 'signature',
      undo_note: 'undo_note',
      support: 'support',
      help: 'help',
      menu: 'menu',
    };
    return this.command(turn, cmd[intent]);
  }

  private async startNote(turn: Turn, noteText: string, whenOverride?: ActivityWhen): Promise<void> {
    const today = this.deps.clock.today();
    const evidenceIds = (turn.state.context.pendingEvidence as string[]) ?? [];
    const when = whenOverride ?? parseActivityWhen(noteText, today);
    const all = await this.deps.store.listContracts(turn.user.id);
    const overlaps = (c: Contract, from: IsoDate, to: IsoDate) =>
      compareIso(c.startDate, to) <= 0 && compareIso(from, c.endDate) <= 0;
    let cs: Contract[];
    let date: IsoDate;
    let label: string | undefined;
    if (!when) {
      // No date while an earlier report is still open: ask which report, never assume today.
      const options = await this.candidatePeriods(turn, all);
      if (options.some((o) => !o.current)) return this.askNotePeriod(turn, noteText, evidenceIds, options);
      // Otherwise today if a contract is in force, or ask when it happened.
      cs = all.filter((c) => overlaps(c, today, today));
      date = today;
    } else if (when.kind === 'day') {
      cs = all.filter((c) => overlaps(c, when.date, when.date));
      date = when.date;
    } else {
      cs = all.filter((c) => overlaps(c, when.from, when.to));
      const firstStart = cs.map((c) => c.startDate).sort(compareIso)[0];
      date = firstStart && compareIso(firstStart, when.from) > 0 ? firstStart : when.from;
      label = `en ${monthNameEs(when.from).toLowerCase()} de ${when.from.slice(0, 4)}`;
    }
    if (cs.length === 0) {
      this.setFlow(turn, 'note_when', 'ask', { noteText, evidenceIds });
      const range = all.map(
        (c) => `${c.shortLabel}: ${formatDdMmYyyy(c.startDate)} al ${formatDdMmYyyy(c.endDate)}`,
      );
      turn.out.push(
        text(
          `📅 ¿En qué fecha o en qué mes hiciste esta actividad? Escríbelo así: *15/07/2026* o *julio*.${
            when && range.length
              ? `\nTu contrato va ${range.length > 1 ? 'así' : 'del'} ${range.join('; ')}.`
              : ''
          }`,
        ),
      );
      return;
    }
    if (cs.length === 1) {
      this.setFlow(turn, 'idle', 'start');
      return this.saveNote(turn, [cs[0]!], noteText, date, evidenceIds, label);
    }
    this.setFlow(turn, 'note_contract', 'pick', { noteText, date, evidenceIds, ...(label ? { label } : {}) });
    const items = cs.map((c) => ({ id: `c:${c.id}`, title: c.shortLabel }));
    if (cs.length === 2) items.push({ id: 'c:*', title: 'Ambos' });
    turn.out.push(choose('¿A cuál contrato corresponde?', items));
  }

  private async askNotePeriod(
    turn: Turn,
    noteText: string,
    evidenceIds: string[],
    options: { p: Period; current: boolean }[],
  ): Promise<void> {
    const seen = new Set<string>();
    const rows: { id: string; title: string }[] = [];
    for (const o of options) {
      const key = o.current ? 'today' : `${o.p.from}:${o.p.to}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push(
        o.current
          ? { id: 'np:today', title: `Hoy (${monthNameEs(this.deps.clock.today()).toLowerCase()})` }
          : { id: `np:${key}`, title: this.periodTitle(o.p) },
      );
    }
    rows.push({ id: 'np:other', title: 'Otra fecha' });
    this.setFlow(turn, 'note_period', 'ask', { noteText, evidenceIds });
    const body = `📅 Tienes un informe anterior abierto. ¿A qué informe corresponde esta actividad?\n«${clip(noteText, 120)}»\n\nTambién puedes escribirme la fecha (por ejemplo *15/09/2026*).`;
    turn.out.push(rows.length <= MAX_BUTTONS ? buttons(body, rows) : choose(body, rows));
  }

  private async onNotePeriod(turn: Turn, msg: Inbound): Promise<void> {
    const ctx = turn.state.context as { noteText: string; evidenceIds: string[] };
    const resume = (when: ActivityWhen) => {
      turn.state.context = { ...turn.state.context, pendingEvidence: ctx.evidenceIds };
      this.setFlow(turn, 'idle', 'start', { pendingEvidence: ctx.evidenceIds });
      return this.startNote(turn, ctx.noteText, when);
    };
    const id = msg.replyId;
    if (id === 'np:today') return resume({ kind: 'day', date: this.deps.clock.today() });
    if (id === 'np:other') {
      this.setFlow(turn, 'note_when', 'ask', { noteText: ctx.noteText, evidenceIds: ctx.evidenceIds });
      turn.out.push(
        text('Escríbeme la fecha (por ejemplo *15/09/2026*) o el mes (por ejemplo *septiembre*).'),
      );
      return;
    }
    if (id?.startsWith('np:')) {
      const [from, to] = id.slice(3).split(':') as [IsoDate, IsoDate];
      return resume({ kind: 'month', from, to });
    }
    const when =
      msg.kind === 'text' && msg.text ? parseActivityWhen(msg.text, this.deps.clock.today()) : null;
    if (when) return resume(when);
    if (msg.kind === 'text' && msg.text && msg.text.trim().split(/\s+/).length > 4) {
      // A new note instead of an answer.
      this.setFlow(turn, 'idle', 'start', { pendingEvidence: ctx.evidenceIds });
      return this.freeText(turn, msg.text);
    }
    turn.out.push(text('Elige el informe en los botones o escríbeme la fecha (por ejemplo *15/09/2026*).'));
  }

  /** Photos assigned by obligation number: to its latest activity in report p, or a photo record. */
  private async placePhotos(
    turn: Turn,
    c: Contract,
    o: Obligation,
    p: Period | null,
    pending: string[],
  ): Promise<void> {
    const photos = (n: number) => (n === 1 ? 'la foto' : `las ${n} fotos`);
    const notes = p
      ? (await this.deps.store.listNotes(c.id, p.from, p.to)).filter((x) => noteSupports(x, o.key))
      : [];
    const latest = notes.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    this.setFlow(turn, 'idle', 'start', {}); // the photos are placed
    if (latest) {
      await this.deps.store.updateNote({ ...latest, evidenceIds: [...latest.evidenceIds, ...pending] });
      turn.out.push(
        text(
          `✅ Agregué ${photos(pending.length)} a la obligación ${o.number}, en «${clip(latest.text, 80)}».\n${await this.periodLine(c, latest.date)}`,
        ),
      );
      return;
    }
    // The photos belong to the report in course: a date outside its period would leave them out.
    const today = this.deps.clock.today();
    const date = !p
      ? today
      : compareIso(today, p.to) > 0
        ? p.to
        : compareIso(today, p.from) < 0
          ? p.from
          : today;
    await this.deps.store.addNote({
      id: this.deps.newId(),
      userId: turn.user.id,
      contractId: c.id,
      date,
      text: `${PHOTO_RECORD_PREFIX} ${o.number}.`,
      obligationKey: o.key,
      confidence: 1,
      evidenceIds: pending,
      createdAt: this.deps.clock.now().toISOString(),
    });
    turn.out.push(
      text(
        `✅ Guardé ${photos(pending.length)} en la obligación ${o.number}: «${clip(o.text, 80)}».\n${await this.periodLine(c, date)}\nSi quieres, cuéntame qué actividad fue para que quede en el informe.`,
      ),
    );
    return;
  }

  private async onPhotoPeriod(turn: Turn, msg: Inbound): Promise<void> {
    const ctx = turn.state.context as { pendingEvidence: string[]; contractId: string; obligation: number };
    const c = (await this.activeContracts(turn)).find((x) => x.id === ctx.contractId);
    const o = c?.obligations.find((x) => x.number === ctx.obligation);
    const number = msg.replyId?.startsWith('pp:') ? Number(msg.replyId.slice(3)) : null;
    const p =
      c && number ? (await this.deps.store.listPeriods(c.id)).find((x) => x.number === number) : undefined;
    if (c && o && p) return this.placePhotos(turn, c, o, p, ctx.pendingEvidence);
    if (msg.kind === 'text' && msg.text && msg.text.trim().split(/\s+/).length > 4) {
      // The activity instead of the report: a new note with the photos.
      this.setFlow(turn, 'idle', 'start', { pendingEvidence: ctx.pendingEvidence });
      return this.freeText(turn, msg.text);
    }
    turn.out.push(text('Elige el informe en los botones.'));
  }

  /** Answer to "¿en qué fecha o mes?" for a note that had none (or one outside the contract). */
  private async onNoteWhen(turn: Turn, msg: Inbound): Promise<void> {
    const ctx = turn.state.context as { noteText: string; evidenceIds: string[] };
    const when =
      msg.kind === 'text' && msg.text ? parseActivityWhen(msg.text, this.deps.clock.today()) : null;
    if (!when) {
      if (msg.kind === 'text' && msg.text && msg.text.trim().split(/\s+/).length > 4) {
        // A new note instead of a date.
        this.reset(turn);
        return this.freeText(turn, msg.text);
      }
      turn.out.push(text('Escríbeme la fecha (por ejemplo *15/07/2026*) o el mes (por ejemplo *julio*).'));
      return;
    }
    turn.state.context = { pendingEvidence: ctx.evidenceIds };
    return this.startNote(turn, ctx.noteText, when);
  }

  private async onNoteContract(turn: Turn, msg: Inbound): Promise<void> {
    const ctx = turn.state.context as {
      noteText: string;
      date: IsoDate;
      evidenceIds: string[];
      label?: string;
    };
    const cs = await this.activeContracts(turn, ctx.date);
    let chosen: Contract[] = [];
    if (msg.replyId === 'c:*') chosen = cs;
    else if (msg.replyId?.startsWith('c:')) chosen = cs.filter((c) => c.id === msg.replyId!.slice(2));
    else {
      const byText = this.matchContractByText(cs, msg.text);
      if (byText) chosen = [byText];
      else if (msg.kind === 'text' && msg.text) {
        // A new note while we were asking: drop the question and start over with the new text.
        this.setFlow(turn, 'idle', 'start', { pendingEvidence: ctx.evidenceIds });
        return this.freeText(turn, msg.text);
      }
    }
    if (!chosen.length) {
      turn.out.push(
        choose(
          'Elige el contrato:',
          cs.map((c) => ({ id: `c:${c.id}`, title: c.shortLabel })),
        ),
      );
      return;
    }
    this.setFlow(turn, 'idle', 'start');
    await this.saveNote(turn, chosen, ctx.noteText, ctx.date, ctx.evidenceIds, ctx.label);
  }

  private async saveNote(
    turn: Turn,
    contracts: Contract[],
    noteText: string,
    date: IsoDate,
    evidenceIds: string[],
    label?: string,
  ): Promise<void> {
    for (const c of contracts) {
      const result = await this.deps.ai.classifyNote(noteText, c.obligations);
      const note: Note = {
        id: this.deps.newId(),
        userId: turn.user.id,
        contractId: c.id,
        date,
        text: noteText,
        evidenceIds,
        createdAt: this.deps.clock.now().toISOString(),
        // Pascal always proposes the best match; the contractor confirms or changes it.
        ...(result.obligationKey
          ? { obligationKey: result.obligationKey, confidence: result.confidence }
          : {}),
      };
      await this.deps.store.addNote(note);
      const photos = evidenceIds.length
        ? ` con ${evidenceIds.length} foto${evidenceIds.length > 1 ? 's' : ''}`
        : '';
      const where = contracts.length > 1 ? ` (${c.shortLabel})` : '';
      const period = await this.periodLine(c, date);
      if (note.obligationKey) {
        const o = c.obligations.find((x) => x.key === note.obligationKey)!;
        const sure = result.confidence >= this.deps.confidenceThreshold;
        turn.out.push(
          buttons(
            sure
              ? `✅ Anotado ${label ?? `el ${formatDdMmYyyy(date)}`}${photos}${where} en la obligación ${o.number}: «${clip(o.text, 80)}»\n${period}`
              : `📝 Anotado ${label ?? `el ${formatDdMmYyyy(date)}`}${photos}${where}. Creo que va en la obligación ${o.number}: «${clip(o.text, 80)}». ¿Está bien?\n${period}`,
            [
              ...(sure ? [] : [{ id: `nok:${note.id}`, title: '✅ Está bien' }]),
              { id: `chg:${note.id}`, title: '✏️ Corregir' },
              { id: `add:${note.id}`, title: '➕ Otra obligación' },
            ],
          ),
        );
      } else {
        await this.askObligation(
          turn,
          note.id,
          `📝 Anotado ${label ?? `el ${formatDdMmYyyy(date)}`}${photos}${where}. ¿A cuál obligación corresponde?`,
        );
        if (contracts.length > 1) break; // ask one at a time; the other copy stays unassigned for the review step
      }
    }
  }

  /** "Pasa la última actividad a septiembre": moves the latest note, or asks where when no month is said. */
  private async moveLastNote(turn: Turn, month: number | null): Promise<void> {
    const note = await this.deps.store.lastNote(turn.user.id);
    if (!note) {
      turn.out.push(text('No tienes actividades registradas para mover.'));
      return;
    }
    if (month) {
      const today = this.deps.clock.today();
      const p = (await this.deps.store.listPeriods(note.contractId))
        .filter((x) => Number(x.from.slice(5, 7)) === month || Number(x.to.slice(5, 7)) === month)
        .filter((x) => compareIso(x.from, today) <= 0)
        .sort((a, b) => compareIso(b.from, a.from))[0];
      if (p) return this.moveNote(turn, note.id, p.number);
    }
    return this.askMoveNote(turn, note.id);
  }

  /** "✏️ Corregir" on a recorded activity: its obligation, its report (date) or delete it. */
  private async askCorrection(turn: Turn, noteId: string): Promise<void> {
    const note = await this.deps.store.getNote(noteId);
    const c = await this.deps.store.getContract(note.contractId);
    turn.out.push(
      buttons(
        `¿Qué corrijo de esta actividad?\n«${clip(note.text, 120)}»\n${await this.periodLine(c, note.date)}`,
        [
          { id: `cob:${noteId}`, title: 'La obligación' },
          { id: `mvq:${noteId}`, title: 'El informe o fecha' },
          { id: `del:${noteId}`, title: 'Borrarla' },
        ],
      ),
    );
  }

  /** Moves an activity to another report: the open ones as buttons, or a date written by the contractor. */
  private async askMoveNote(turn: Turn, noteId: string): Promise<void> {
    const note = await this.deps.store.getNote(noteId);
    const c = await this.deps.store.getContract(note.contractId);
    const today = this.deps.clock.today();
    const options = (await this.deps.store.listPeriods(c.id))
      .filter(
        (p) =>
          p.status !== 'delivered' &&
          compareIso(p.from, today) <= 0 &&
          !(compareIso(p.from, note.date) <= 0 && compareIso(note.date, p.to) <= 0),
      )
      .sort((a, b) => compareIso(b.from, a.from))
      .slice(0, 9);
    this.setFlow(turn, 'note_redate', 'ask', { noteId });
    const rows = [
      ...options.map((p) => ({ id: `mv:${noteId}:${p.number}`, title: this.periodTitle(p) })),
      { id: 'mv:other', title: 'Otra fecha' },
    ];
    const body = `📅 ¿A qué informe paso esta actividad?\n«${clip(note.text, 120)}»\n\nTambién puedes escribirme la fecha (por ejemplo *15/09/2026*).`;
    turn.out.push(rows.length <= MAX_BUTTONS ? buttons(body, rows) : choose(body, rows));
  }

  private async moveNote(turn: Turn, noteId: string, periodNumber: number, date?: IsoDate): Promise<void> {
    const note = await this.deps.store.getNote(noteId);
    const c = await this.deps.store.getContract(note.contractId);
    const p = (await this.deps.store.listPeriods(c.id)).find((x) => x.number === periodNumber);
    const d = date ?? p?.from;
    if (!d) return;
    await this.deps.store.updateNote({ ...note, date: d });
    this.reset(turn);
    turn.out.push(text(`✅ Listo, moví la actividad.\n${await this.periodLine(c, d)}`));
  }

  private async onNoteRedate(turn: Turn, msg: Inbound): Promise<void> {
    const { noteId } = turn.state.context as { noteId: string };
    if (msg.replyId?.startsWith('mv:') && msg.replyId !== 'mv:other') {
      const [, n] = msg.replyId.slice(3).split(':');
      return this.moveNote(turn, noteId, Number(n));
    }
    if (msg.replyId === 'mv:other') {
      turn.out.push(
        text('Escríbeme la fecha (por ejemplo *15/09/2026*) o el mes (por ejemplo *septiembre*).'),
      );
      return;
    }
    const when =
      msg.kind === 'text' && msg.text ? parseActivityWhen(msg.text, this.deps.clock.today()) : null;
    if (when) {
      const note = await this.deps.store.getNote(noteId);
      const date = when.kind === 'day' ? when.date : when.from;
      const p = (await this.deps.store.listPeriods(note.contractId)).find(
        (x) => compareIso(x.from, date) <= 0 && compareIso(date, x.to) <= 0,
      );
      if (p) return this.moveNote(turn, noteId, p.number, date);
      const c = await this.deps.store.getContract(note.contractId);
      turn.out.push(text(`${await this.periodLine(c, date)} Escríbeme otra fecha.`));
      return;
    }
    if (msg.kind === 'text' && msg.text && msg.text.trim().split(/\s+/).length > 4) {
      this.reset(turn);
      return this.freeText(turn, msg.text);
    }
    turn.out.push(text('Elige el informe en los botones o escríbeme la fecha (por ejemplo *15/09/2026*).'));
  }

  private async askObligation(
    turn: Turn,
    noteId: string,
    body = '¿A cuál obligación corresponde?',
    page = 0,
  ): Promise<void> {
    const note = await this.deps.store.getNote(noteId);
    const c = await this.deps.store.getContract(note.contractId);
    this.setFlow(turn, 'note_obligation', 'pick', { noteId });
    const head = page === 0 ? `${body}\n${await this.periodLine(c, note.date)}` : body;
    turn.out.push(choose(head, c.obligations.map(obligationRow), page, 'omore'));
  }

  /** WhatsApp lists allow one choice: further obligations are added one at a time. */
  private async askExtraObligation(turn: Turn, noteId: string, page = 0): Promise<void> {
    const note = await this.deps.store.getNote(noteId);
    const c = await this.deps.store.getContract(note.contractId);
    const free = c.obligations.filter((o) => !noteSupports(note, o.key));
    if (!free.length) {
      turn.out.push(text('Esta actividad ya está en todas las obligaciones.'));
      return;
    }
    this.setFlow(turn, 'note_extra_obligation', 'pick', { noteId });
    turn.out.push(
      choose(
        `¿En qué otra obligación va esta actividad?\n${await this.periodLine(c, note.date)}`,
        free.map(obligationRow),
        page,
        'xmore',
      ),
    );
  }

  private async onExtraObligation(turn: Turn, msg: Inbound): Promise<void> {
    const { noteId } = turn.state.context as { noteId: string };
    if (msg.replyId?.startsWith('xmore:'))
      return this.askExtraObligation(turn, noteId, Number(msg.replyId.slice(6)));
    const note = await this.deps.store.getNote(noteId);
    const c = await this.deps.store.getContract(note.contractId);
    let o: Obligation | undefined;
    if (msg.replyId?.startsWith('o:')) o = c.obligations.find((x) => x.key === msg.replyId!.slice(2));
    else if (msg.text && /^\s*\d{1,2}\s*$/.test(msg.text))
      o = c.obligations.find((x) => x.number === Number(msg.text));
    if (!o) {
      this.reset(turn);
      if (msg.kind === 'text' && msg.text) return this.freeText(turn, msg.text);
      return;
    }
    if (!noteSupports(note, o.key)) {
      await this.deps.store.updateNote(
        note.obligationKey
          ? { ...note, alsoKeys: [...(note.alsoKeys ?? []), o.key] }
          : { ...note, obligationKey: o.key, confidence: 1 },
      );
    }
    this.reset(turn);
    turn.out.push(
      buttons(`✅ También quedó en la obligación ${o.number}.\n${await this.periodLine(c, note.date)}`, [
        { id: `add:${note.id}`, title: '➕ Otra obligación' },
      ]),
    );
  }

  private async onNoteObligation(turn: Turn, msg: Inbound): Promise<void> {
    const { noteId } = turn.state.context as { noteId: string };
    if (msg.replyId?.startsWith('omore:'))
      return this.askObligation(turn, noteId, 'Más obligaciones:', Number(msg.replyId.slice(6)));
    const note = await this.deps.store.getNote(noteId);
    const c = await this.deps.store.getContract(note.contractId);
    let o: Obligation | undefined;
    if (msg.replyId?.startsWith('o:')) o = c.obligations.find((x) => x.key === msg.replyId!.slice(2));
    else if (msg.text && /^\s*\d{1,2}\s*$/.test(msg.text))
      o = c.obligations.find((x) => x.number === Number(msg.text));
    if (!o) {
      if (msg.kind === 'text' && msg.text) {
        this.reset(turn);
        return this.freeText(turn, msg.text);
      }
      return this.askObligation(turn, noteId, 'Elige la obligación de la lista:');
    }
    await this.deps.store.updateNote({
      ...note,
      obligationKey: o.key,
      alsoKeys: (note.alsoKeys ?? []).filter((k) => k !== o.key),
      confidence: 1,
    });
    this.reset(turn);
    turn.out.push(
      buttons(
        `✅ Listo, quedó en la obligación ${o.number}.\n${await this.periodLine(c, note.date)}\n¿Esta actividad sirve también para otra?`,
        [{ id: `add:${note.id}`, title: '➕ Otra obligación' }],
      ),
    );
  }

  // -------------------------------------------------------------------------
  // Supports
  // -------------------------------------------------------------------------
  private async receiveSupport(turn: Turn, msg: Inbound, guide?: GuideCtx): Promise<void> {
    const cs = await this.activeContracts(turn);
    const types = new Map<string, SupportType>();
    let maxAge = 30;
    for (const e of [...new Set(cs.map((c) => c.entityId))]) {
      maxAge = (await this.deps.store.getEntity(e)).settings.certificateMaxAgeDays;
      for (const t of await this.deps.store.listSupportTypes(e)) types.set(t.code, t);
    }
    const media = msg.media!;
    const filename = media.filename ?? 'documento.pdf';
    const isPdf = media.mime.split(';')[0]?.trim() === 'application/pdf';

    // Read the PDF and find every support inside (a single file often bundles several certificates).
    let segments: SupportSegment[] = [];
    if (isPdf) {
      await this.deps
        .progress?.(actorOf(turn).phone, text(`🔎 Estoy revisando *${filename}*…`))
        .catch(() => undefined);
      segments = await this.deps.ai.classifySupports(
        { label: filename, data: media.data, mime: media.mime },
        [...types.values()].map((t) => ({ code: t.code, label: t.label })),
      );
    }
    const known = segments.filter((g) => g.code && types.has(g.code));
    if (!known.length) return this.askSupportType(turn, msg, types, guide);

    const today = this.deps.clock.today();
    const lines: string[] = [];
    const old: { type: SupportType; supportId: string }[] = [];
    for (const g of known) {
      const t = types.get(g.code!)!;
      const data =
        this.deps.extractPages && (g.fromPage > 1 || segments.length > 1)
          ? await this.deps.extractPages(media.data, g.fromPage, g.toPage)
          : media.data;
      const supportId = this.deps.newId();
      await this.deps.store.addSupport({
        id: supportId,
        userId: turn.user.id,
        code: t.code,
        data,
        mime: 'application/pdf',
        filename: `${t.code}.pdf`,
        issuedOn: g.issuedOn ?? today,
        receivedAt: this.deps.clock.now().toISOString(),
      });
      // The payment sheet also fills table 2.1 of the supervision report.
      let ssNote = '';
      if (t.code === 'PILA') {
        const ss = await this.deps.ai
          .extractSocialSecurity({ label: `${t.code}.pdf`, data, mime: 'application/pdf' })
          .catch(() => null);
        if (ss) {
          await this.deps.store.saveSocialSecurity({ ...ss, userId: turn.user.id }, supportId);
          ssNote = ` · ${monthNameEs(ss.contributionMonth).toLowerCase()} ${ss.contributionMonth.slice(0, 4)}, total ${formatCOP(ss.total)}`;
        } else ssNote = ' · no pude leer los valores; los reviso con una persona';
      }
      const pages = g.fromPage === g.toPage ? `pág. ${g.fromPage}` : `págs. ${g.fromPage}-${g.toPage}`;
      const limit = t.maxAgeDays ?? (t.bundle ? maxAge : undefined);
      const isOld = g.issuedOn && limit && addDays(g.issuedOn, limit) < today;
      if (isOld) old.push({ type: t, supportId });
      lines.push(
        `${isOld ? '⚠️' : '✅'} ${t.label} (${pages})${ssNote || (g.note ? ` · ${g.note}` : '')}${
          isOld
            ? ` · expedido el ${formatDdMmYyyy(g.issuedOn!)}, tiene más de ${limit} días: descárgalo de nuevo`
            : ''
        }`,
      );
    }
    const unknown = segments.filter((g) => !g.code || !types.has(g.code));
    if (unknown.length)
      lines.push(
        `❓ No reconocí ${unknown.map((g) => (g.fromPage === g.toPage ? `la pág. ${g.fromPage}` : `las págs. ${g.fromPage}-${g.toPage}`)).join(', ')}.`,
      );
    turn.out.push(text(`📎 *${filename}*\n${lines.join('\n')}`));
    // Inside the guide an expired document is simply asked for again in the next step.
    if (guide) return;
    if (old.length) await this.askExpired(turn, old);
    const cert = known.find((g) => g.code === 'CERT_CUMPLIMIENTO' && g.amount);
    if (cert && cs.length === 1) await this.suggestCertificateAmount(turn, cs[0]!, cert.amount!);
  }

  /** Fallback when the document is not recognized (or is not a PDF): the contractor picks the type. */
  private async askSupportType(
    turn: Turn,
    msg: Inbound,
    types: Map<string, SupportType>,
    guide?: GuideCtx,
  ): Promise<void> {
    const id = this.deps.newId();
    await this.deps.store.addSupport({
      id,
      userId: turn.user.id,
      code: 'PENDIENTE',
      data: msg.media!.data,
      mime: msg.media!.mime,
      filename: msg.media!.filename ?? 'documento.pdf',
      receivedAt: this.deps.clock.now().toISOString(),
    });
    this.setFlow(turn, 'support_type', 'pick', guide ? { supportId: id, guide } : { supportId: id });
    const rows = [...types.values()]
      .filter((t) => t.frequency === 'every_period')
      .map((t) => ({ id: `s:${t.code}`, title: t.label }));
    rows.push({ id: 's:EVIDENCIA', title: 'Evidencia de actividad' });
    turn.out.push(text(`📎 Recibí *${msg.media!.filename ?? 'tu documento'}*, pero no reconocí qué es.`));
    turn.out.push(choose('¿Qué documento es?', rows, 0, 'smore'));
  }

  private async onSupportType(turn: Turn, msg: Inbound): Promise<void> {
    const { supportId, guide } = turn.state.context as { supportId: string; guide?: GuideCtx };
    if (msg.replyId?.startsWith('smore:')) {
      // Re-show the list from the requested page.
      const page = Number(msg.replyId.slice(6));
      const cs = await this.activeContracts(turn);
      const types = new Map<string, SupportType>();
      for (const c of cs)
        for (const t of await this.deps.store.listSupportTypes(c.entityId)) types.set(t.code, t);
      const rows = [...types.values()]
        .filter((t) => t.frequency === 'every_period')
        .map((t) => ({ id: `s:${t.code}`, title: t.label }));
      rows.push({ id: 's:EVIDENCIA', title: 'Evidencia de actividad' });
      turn.out.push(choose('¿Qué documento es?', rows, page, 'smore'));
      return;
    }
    const code = msg.replyId?.startsWith('s:') ? msg.replyId.slice(2) : null;
    if (!code) {
      turn.out.push(text('Elige el tipo de documento de la lista, o escribe *cancelar*.'));
      return;
    }
    const supports = await this.deps.store.listSupports(turn.user.id);
    const s = supports.find((x) => x.id === supportId);
    if (s) await this.deps.store.addSupport({ ...s, code, issuedOn: this.deps.clock.today() });
    if (guide) {
      turn.out.push(text('✅ Guardado.'));
      return this.guideStep(turn, guide);
    }
    this.reset(turn);
    turn.out.push(text('✅ Guardado. Escribe *¿qué me falta?* para ver tu checklist.'));
  }

  // -------------------------------------------------------------------------
  // Certificates guide: the official sites ask for a captcha that only the contractor can solve, so
  // Pascal walks them through one missing support at a time: link, steps and their document number
  // in a message of its own (easy to copy). The guide moves on when the PDF arrives.
  // -------------------------------------------------------------------------
  private async startGuide(turn: Turn, c: Contract): Promise<void> {
    const p = await this.currentPeriod(c);
    if (!p) {
      turn.out.push(text(`No tienes cuentas pendientes en ${c.shortLabel}.`));
      return;
    }
    const { missing, expired } = await this.checklist(turn, c, p);
    const total = missing.length + expired.length;
    if (!total) {
      turn.out.push(
        buttons(`✅ Tienes todos los soportes al día para tu ${this.reportLabel(c, p)}.`, [
          { id: 'menu:generate', title: 'Generar documentos' },
        ]),
      );
      return;
    }
    turn.out.push(
      text(
        `🧭 Vamos uno por uno con los soportes de tu ${this.reportLabel(c, p)}: ${total === 1 ? 'te falta 1' : `te faltan ${total}`}. Te paso el enlace y los pasos; cuando lo descargues, envíamelo aquí en PDF y seguimos con el siguiente.`,
      ),
    );
    return this.guideStep(turn, { contractId: c.id, total, skipped: [] });
  }

  private async guideStep(turn: Turn, g: GuideCtx): Promise<void> {
    const c = (await this.activeContracts(turn)).find((x) => x.id === g.contractId);
    const p = c && (await this.currentPeriod(c));
    if (!c || !p) {
      this.reset(turn);
      return;
    }
    const { missing, expired } = await this.checklist(turn, c, p);
    const all = [
      ...missing.map((t) => ({ t, expired: false })),
      ...expired.map((e) => ({ t: e.type, expired: true })),
    ];
    const pending = all.filter((x) => !g.skipped.includes(x.t.code));
    const next = pending[0];
    if (!next) {
      this.reset(turn);
      if (!all.length) {
        turn.out.push(
          buttons(
            `🎉 Ya tienes todos los soportes de tu ${this.reportLabel(c, p)}. ¿Generamos los documentos?`,
            [{ id: 'menu:generate', title: 'Generar documentos' }],
          ),
        );
        return;
      }
      turn.out.push(
        text(
          `👍 Terminamos. Quedaron pendientes: ${all.map((x) => x.t.label).join(', ')}. Envíamelos cuando los tengas, o escribe *certificados* para retomar la guía.`,
        ),
      );
      return;
    }
    this.setFlow(turn, GUIDE_FLOW, 'step', { ...g, current: next.t.code });
    const position = Math.max(1, g.total - pending.length + 1);
    const doc = turn.user.docNumber.replace(/[.\s]/g, '');
    const body = [
      `📄 *${next.t.label}*${g.total > 1 ? ` (${Math.min(position, g.total)} de ${g.total})` : ''}`,
      ...(next.expired ? ['⚠️ El que tengo está vencido; descarga uno nuevo.'] : []),
      ...(next.t.instructions ? [next.t.instructions] : []),
      ...(next.t.officialUrl ? [`🔗 ${next.t.officialUrl}`] : []),
      '',
      next.t.officialUrl && doc
        ? 'Te envío tu número de documento en el siguiente mensaje para que lo copies. Cuando tengas el PDF, envíamelo aquí.'
        : 'Cuando lo tengas, envíamelo aquí en PDF.',
    ].join('\n');
    turn.out.push(
      buttons(body, [
        { id: 'gd:skip', title: '⏭️ Saltar este' },
        { id: 'gd:stop', title: '✋ Terminar' },
      ]),
    );
    if (next.t.officialUrl && doc) turn.out.push(text(doc));
  }

  private async onGuide(turn: Turn, msg: Inbound): Promise<void> {
    const g = turn.state.context as unknown as GuideCtx;
    if (msg.replyId === 'gd:skip') {
      return this.guideStep(turn, { ...g, skipped: [...g.skipped, ...(g.current ? [g.current] : [])] });
    }
    const said = msg.kind === 'text' && msg.text ? normalize(msg.text) : '';
    if (msg.replyId === 'gd:stop' || ['terminar', 'parar', 'detener', 'luego', 'despues'].includes(said)) {
      this.reset(turn);
      turn.out.push(text('Listo. Cuando quieras retomar, escribe *certificados*.'));
      return;
    }
    if (['saltar', 'siguiente', 'no lo tengo'].includes(said)) {
      return this.guideStep(turn, { ...g, skipped: [...g.skipped, ...(g.current ? [g.current] : [])] });
    }
    // Anything else (an activity, a question): leave the guide and handle the message normally.
    this.reset(turn);
    return this.dispatch(turn, msg);
  }

  // -------------------------------------------------------------------------
  // Status / checklist
  // -------------------------------------------------------------------------
  private async currentPeriod(c: Contract): Promise<Period | null> {
    const ps = (await this.deps.store.listPeriods(c.id)).sort((a, b) => a.number - b.number);
    const today = this.deps.clock.today();
    return (
      ps.find(
        (p) => p.status !== 'delivered' && compareIso(p.from, today) <= 0 && compareIso(today, p.to) <= 0,
      ) ??
      ps.find((p) => p.status !== 'delivered' && compareIso(p.from, today) <= 0) ??
      null
    );
  }

  private async checklist(
    turn: Turn,
    c: Contract,
    p: Period,
  ): Promise<{
    lines: string[];
    missing: SupportType[];
    expired: { type: SupportType; supportId: string }[];
  }> {
    const types = (await this.deps.store.listSupportTypes(c.entityId)).filter(
      (t) =>
        t.required &&
        t.frequency === 'every_period' &&
        (!t.profiles || (c.profile && t.profiles.includes(c.profile))) &&
        // The compliance certificate only for contracts whose accounts ask for it.
        !(t.code === 'CERT_CUMPLIMIENTO' && c.requiresCertification === false),
    );
    const supports = await this.deps.store.listSupports(turn.user.id);
    const today = this.deps.clock.today();
    const lines: string[] = [];
    const missing: SupportType[] = [];
    const expired: { type: SupportType; supportId: string }[] = [];
    const maxAge = (await this.deps.store.getEntity(c.entityId)).settings.certificateMaxAgeDays;
    const later = types.filter((t) => t.stage === 'after_signature');
    for (const t of types.filter((x) => x.stage !== 'after_signature')) {
      // Certificates with a maximum age (antecedentes, afiliaciones) can be expired; the others must be
      // issued within the period (e.g. the PILA).
      const limit = t.maxAgeDays ?? (t.bundle ? maxAge : undefined);
      const mine = supports.filter((s) => s.code === t.code);
      const issued = (s: SupportFile) => s.issuedOn ?? s.receivedAt.slice(0, 10);
      const ok = mine.some((s) => {
        if (compareIso(issued(s), today) > 0) return false;
        if (s.acceptedExpired) return true;
        if (limit) return (Date.parse(today) - Date.parse(issued(s))) / 86_400_000 <= limit;
        return compareIso(issued(s), p.from) >= 0;
      });
      const newest = mine.at(-1);
      // A certificate still valid is reused in the next reports: say until when it serves.
      const validUntil = limit
        ? mine
            .filter((s) => !s.acceptedExpired && compareIso(issued(s), today) <= 0)
            .map((s) => addDays(issued(s), limit))
            .filter((d) => compareIso(d, today) >= 0)
            .sort()
            .at(-1)
        : undefined;
      if (ok)
        lines.push(
          `✅ ${t.label}${
            validUntil
              ? ` (vigente hasta el ${formatDdMmYyyy(validUntil)})`
              : mine.some((s) => s.acceptedExpired)
                ? ' (vencido, aceptado por ti)'
                : ''
          }`,
        );
      else if (limit && newest) {
        expired.push({ type: t, supportId: newest.id });
        lines.push(
          `⚠️ ${t.label}: vencido (expedido el ${formatDdMmYyyy(issued(newest))})${t.officialUrl ? `\n   🔗 ${t.officialUrl}` : ''}`,
        );
      } else {
        missing.push(t);
        lines.push(`❌ ${t.label}${t.officialUrl ? `\n   🔗 ${t.officialUrl}` : ''}`);
      }
    }
    if (later.length)
      lines.push(`📌 Después de la firma del supervisor: ${later.map((t) => t.label).join(', ')}`);
    return { lines, missing, expired };
  }

  private async startStatus(turn: Turn, cs: Contract[]): Promise<void> {
    let guideFor: Contract | null = null;
    for (const c of cs) {
      const p = await this.currentPeriod(c);
      if (!p) {
        turn.out.push(text(`📄 ${c.shortLabel}: no tienes cuentas pendientes.`));
        continue;
      }
      const notes = await this.deps.store.listNotes(c.id, p.from, p.to);
      const count = (k: string) => notes.filter((n) => noteSupports(n, k)).length;
      const obl = c.obligations
        .filter((o) => o.kind === 'specific')
        .map(
          (o) =>
            `${count(o.key) ? '✅' : '⚠️'} Obligación ${o.number}: ${count(o.key)} registro${count(o.key) === 1 ? '' : 's'}`,
        );
      const unassigned = notes.filter((n) => !n.obligationKey).length;
      const { lines, missing, expired } = await this.checklist(turn, c, p);
      if (!guideFor && missing.length + expired.length) guideFor = c;
      turn.out.push(
        text(
          [
            `📄 *${c.shortLabel}* – Informe ${formatReportNumber(p.number, c.paymentsCount, c.reportNumberFormat)} (${formatRangeLong(p.from, p.to)})`,
            '',
            '*Actividades*',
            ...obl,
            ...(unassigned ? [`❓ ${unassigned} nota(s) sin obligación asignada`] : []),
            '',
            '*Soportes*',
            ...lines,
          ].join('\n'),
        ),
      );
    }
    if (guideFor)
      turn.out.push(
        buttons('🧭 ¿Te guío para descargar los soportes que faltan, uno por uno?', [
          { id: `guide:${guideFor.id}`, title: 'Guíame' },
        ]),
      );
  }

  // -------------------------------------------------------------------------
  // Drafting and review
  // -------------------------------------------------------------------------
  private async startDraft(turn: Turn, c: Contract, period?: Period): Promise<void> {
    const p = period ?? (await this.currentPeriod(c));
    if (!p) {
      turn.out.push(text(`No tienes cuentas pendientes en ${c.shortLabel}.`));
      return;
    }
    const entity = await this.deps.store.getEntity(c.entityId);
    const notes = await this.deps.store.listNotes(c.id, p.from, p.to);
    if (notes.length === 0) return this.nothingToDraft(turn, c, p);
    // Before drafting, a look at the notes that seem to be in the wrong report or are not activities.
    const checked = (turn.state.context.checkedNotes as string[] | undefined) ?? [];
    const periods = await this.deps.store.listPeriods(c.id);
    const queue = notes
      .filter((n) => !checked.includes(n.id))
      .flatMap((n) => {
        const why = suspectNote(n, p, periods);
        return why ? [{ id: n.id, why }] : [];
      });
    if (queue.length) return this.askNoteCheck(turn, c, p, queue);
    const existing = await this.deps.store.listDrafts(c.id, p.number);
    const missing: string[] = [];
    turn.out.push(text('✍️ Estoy redactando tu informe con lo que me contaste…'));
    for (const o of c.obligations) {
      const prev = existing.find((d) => d.obligationKey === o.key);
      const mine = notes.filter((n) => noteSupports(n, o.key));
      if (
        prev &&
        (prev.status === 'approved' || prev.status === 'not_applicable') &&
        mine.every((n) => prev.sourceNoteIds.includes(n.id)) &&
        prev.sourceNoteIds.every((id) => mine.some((n) => n.id === id))
      ) {
        continue;
      }
      if (mine.length === 0) {
        if (o.kind === 'general') {
          await this.deps.store.saveDraft(
            this.draft(c, p, o, [entity.settings.defaultActivityText], 'default', []),
          );
        } else {
          missing.push(o.key);
          await this.deps.store.saveDraft(this.draft(c, p, o, [], 'needs_input', []));
        }
        continue;
      }
      const r = await this.deps.ai.draftObligation(o, mine);
      if (r.status === 'ok') {
        await this.deps.store.saveDraft(
          this.draft(
            c,
            p,
            o,
            r.paragraphs,
            'proposed',
            mine.map((n) => n.id),
          ),
        );
      } else {
        missing.push(o.key);
        await this.deps.store.saveDraft(
          this.draft(
            c,
            p,
            o,
            [],
            'needs_input',
            mine.map((n) => n.id),
          ),
        );
      }
    }
    await this.savePeriodStatus(c, p, 'draft_review');
    if (missing.length) return this.askMissing(turn, c, p, missing);
    return this.showReview(turn, c, p);
  }

  // -------------------------------------------------------------------------
  // Review before drafting (ADR-039): notes that name another month, photos without a description and
  // instructions saved as activities. One at a time; the contractor moves, deletes or keeps each one.
  // -------------------------------------------------------------------------
  private async askNoteCheck(
    turn: Turn,
    c: Contract,
    p: Period,
    queue: { id: string; why: NoteSuspicion }[],
  ): Promise<void> {
    const first = queue[0]!;
    this.setFlow(turn, 'note_check', 'ask', { contractId: c.id, periodNumber: p.number, queue });
    const note = await this.deps.store.getNote(first.id);
    const quote = `«${clip(note.text, 160)}»`;
    const count = queue.length > 1 ? ` (${queue.length} por revisar)` : '';
    const why = first.why;
    if (why.reason === 'other_month') {
      const month = MONTHS[why.month - 1]!;
      const target = why.target;
      turn.out.push(
        buttons(
          `🔎 Antes de redactar tu ${this.reportLabel(c, p)} reviso las fechas${count}. Esta actividad menciona *${month}*:\n${quote}\n${
            target ? `¿La muevo al ${this.reportLabel(c, target)}?` : '¿La dejo en este informe?'
          }`,
          [
            ...(target ? [{ id: `nc:move:${target.number}`, title: `Mover a ${month}` }] : []),
            { id: 'nc:keep', title: 'Dejarla aquí' },
            { id: 'nc:del', title: 'Borrarla' },
          ],
        ),
      );
      return;
    }
    if (why.reason === 'photo_only') {
      const o = c.obligations.find((x) => x.key === note.obligationKey);
      const k = note.evidenceIds.length;
      turn.out.push(
        buttons(
          `📷 Antes de redactar tu ${this.reportLabel(c, p)}${count}: en la obligación ${o?.number ?? ''} tengo ${k === 1 ? 'una foto' : `${k} fotos`} sin descripción. Escríbeme qué actividad fue para que quede en el informe, o elige:`,
          [
            { id: 'nc:keep', title: 'Dejarla así' },
            { id: 'nc:del', title: 'Borrarla' },
          ],
        ),
      );
      return;
    }
    turn.out.push(
      buttons(
        `🔎 Antes de redactar tu ${this.reportLabel(c, p)}${count}: esta nota parece una instrucción y no una actividad:\n${quote}`,
        [
          { id: 'nc:del', title: 'Borrarla' },
          { id: 'nc:keep', title: 'Es una actividad' },
        ],
      ),
    );
  }

  private async onNoteCheck(turn: Turn, msg: Inbound): Promise<void> {
    const ctx = turn.state.context as {
      contractId: string;
      periodNumber: number;
      queue: { id: string; why: NoteSuspicion }[];
    };
    const c = (await this.deps.store.listContracts(turn.user.id)).find((x) => x.id === ctx.contractId);
    const periods = c ? await this.deps.store.listPeriods(c.id) : [];
    const p = periods.find((x) => x.number === ctx.periodNumber);
    const item = ctx.queue[0];
    if (!c || !p || !item) {
      this.reset(turn);
      return;
    }
    const note = await this.deps.store.getNote(item.id);
    const done = () => {
      const checked = [...((turn.state.context.checkedNotes as string[] | undefined) ?? []), item.id];
      turn.state.context = { ...turn.state.context, checkedNotes: checked.slice(-200) };
    };
    if (msg.replyId === 'nc:keep') done();
    else if (msg.replyId === 'nc:del') {
      await this.deps.store.deleteNote(item.id);
      turn.out.push(text('🗑️ La borré.'));
    } else if (msg.replyId?.startsWith('nc:move:')) {
      const target = periods.find((x) => x.number === Number(msg.replyId!.slice(8)));
      if (target) {
        await this.deps.store.updateNote({ ...note, date: target.from });
        turn.out.push(text(`✅ La moví.\n${await this.periodLine(c, target.from)}`));
      }
      done();
    } else if (item.why.reason === 'photo_only' && msg.kind === 'text' && msg.text?.trim()) {
      // The description of the photo becomes the activity.
      await this.deps.store.updateNote({ ...note, text: msg.text.trim() });
      turn.out.push(text('✅ Listo, la foto quedó con esa actividad.'));
      done();
    } else if (msg.kind === 'text' && msg.text && msg.text.trim().split(/\s+/).length > 4) {
      // Something else (a new activity): leave the review; it comes back at the next draft.
      this.reset(turn);
      return this.freeText(turn, msg.text);
    } else {
      turn.out.push(text('Elige una de las opciones, o escribe *cancelar*.'));
      return;
    }
    return this.startDraft(turn, c, p);
  }

  /**
   * "Informe de julio", "rehacer julio": works on the report of that month, whatever Pascal was asking.
   * A delivered report is regenerated only when the contractor asked to redo it (or taps the button).
   */
  private async startMonthReport(turn: Turn, month: number, redo: boolean, reset = false): Promise<void> {
    const today = this.deps.clock.today();
    const found: { c: Contract; p: Period }[] = [];
    for (const c of await this.activeContracts(turn)) {
      const ps = (await this.deps.store.listPeriods(c.id))
        .filter((x) => Number(x.from.slice(5, 7)) === month && compareIso(x.from, today) <= 0)
        .sort((a, b) => compareIso(b.from, a.from));
      if (ps[0]) found.push({ c, p: ps[0] });
    }
    const name = MONTHS[month - 1]!;
    if (found.length === 0) {
      turn.out.push(
        text(`No encuentro un informe de ${name} en tus contratos. Escribe *menú* para ver las opciones.`),
      );
      return;
    }
    if (found.length > 1) {
      turn.out.push(
        choose(
          `Tienes informe de ${name} en varios contratos. ¿Cuál?`,
          found.map(({ c, p }) =>
            p.status === 'delivered'
              ? {
                  id: `redo:${c.id}:${p.number}`,
                  title: c.shortLabel,
                  description: 'Ya entregado: rehacerlo',
                }
              : { id: `dft:${c.id}:${p.number}`, title: c.shortLabel },
          ),
        ),
      );
      return;
    }
    const { c, p } = found[0]!;
    // Activities sent from now on without a date may belong to this report: Pascal will ask.
    if (p.status !== 'delivered')
      turn.state.context = { ...turn.state.context, working: { contractId: c.id, number: p.number } };
    if (reset) return this.askReset(turn, c, p);
    if (p.status !== 'delivered') return this.startDraft(turn, c, p);
    if (redo) return this.startGenerate(turn, c, true, p.number);
    turn.out.push(
      buttons(
        `El informe ${formatReportNumber(p.number, c.paymentsCount, c.reportNumberFormat)} (${formatRangeLong(p.from, p.to)}) ya te lo entregué. ¿Quieres que lo rehaga con los formatos y datos actualizados?`,
        [{ id: `redo:${c.id}:${p.number}`, title: `Rehacer ${name}` }],
      ),
    );
  }

  // -------------------------------------------------------------------------
  // Signature (optional): used only in the contractor's own documents
  // -------------------------------------------------------------------------
  private async askSignature(turn: Turn): Promise<void> {
    const has = (await this.deps.store.listSupports(turn.user.id)).some((s) => s.code === 'FIRMA');
    this.setFlow(turn, 'signature_upload', 'wait');
    turn.out.push(
      text(
        `✍️ ${has ? 'Ya tengo tu firma. Si me envías otra, la reemplazo.' : 'Así tus informes van firmados.'}\n\nEnvíame una *foto de tu firma* hecha con tinta oscura sobre una hoja blanca, bien iluminada y sin sombras. La pondré solo en tus propios informes. Para salir escribe *menú*.`,
      ),
    );
  }

  private async saveSignature(turn: Turn, msg: Inbound): Promise<void> {
    await this.deps.store.addSupport({
      id: this.deps.newId(),
      userId: turn.user.id,
      code: 'FIRMA',
      data: msg.media!.data,
      mime: msg.media!.mime,
      filename: 'firma.jpg',
      receivedAt: this.deps.clock.now().toISOString(),
    });
    this.reset(turn);
    turn.out.push(
      text(
        '✅ Guardé tu firma. Desde ahora va en tu informe de actividades y en tu línea del informe de supervisión; la del supervisor siempre queda en blanco. Para ver un informe ya entregado con la firma, escribe *rehacer* y el mes.',
      ),
    );
  }

  /**
   * Terms of service in force (section 15: substantial changes need a new acceptance). A user who
   * accepted an older version is asked once; a text they sent meanwhile is handled after accepting.
   * Returns true when this turn was used for the terms.
   */
  private async termsGate(turn: Turn, msg: Inbound): Promise<boolean> {
    const accepted = await this.deps.store.acceptedVersion(turn.user.id, 'terms');
    if (accepted === TERMS_VERSION) return false;
    const ctx = turn.state.context as { termsPending?: string };
    if (msg.replyId === 'terms:yes') {
      await this.deps.store.recordConsent({
        userId: turn.user.id,
        phone: turn.user.phone,
        kind: 'terms',
        policyVersion: TERMS_VERSION,
        accepted: true,
        wamid: msg.id,
      });
      const pending = ctx.termsPending;
      delete ctx.termsPending;
      turn.out.push(text('✅ ¡Gracias! Quedó registrada tu aceptación de los términos.'));
      if (pending) await this.dispatch(turn, { ...msg, kind: 'text', text: pending, replyId: undefined });
      else this.menu(turn, false);
      return true;
    }
    if (msg.replyId === 'terms:no') {
      delete ctx.termsPending;
      turn.out.push(
        text(
          `Entendido. Sin aceptar los términos no puedo seguir preparando tus cuentas. Tus datos se conservan según la política de datos; si quieres que los borre, escribe *borrar mis datos*. Cuando quieras continuar, escríbeme y te muestro los términos de nuevo.`,
        ),
      );
      return true;
    }
    if (msg.kind === 'text' && msg.text) ctx.termsPending = msg.text;
    turn.out.push(
      {
        type: 'cta_url',
        text: accepted
          ? `📜 Actualizamos los términos del servicio de ${BRAND.service} (versión ${TERMS_VERSION}): se agregó el Programa de Aliados. Revísalos antes de continuar.`
          : `📜 Para seguir necesito que aceptes los términos del servicio de ${BRAND.service} (versión ${TERMS_VERSION}).`,
        button: 'Ver términos',
        url: BRAND.terms,
      },
      buttons(
        `¿Aceptas los términos del servicio?${msg.kind === 'text' && msg.text ? ' Apenas aceptes, sigo con tu mensaje.' : ''}`,
        [
          { id: 'terms:yes', title: 'Acepto' },
          { id: 'terms:no', title: 'No acepto' },
        ],
      ),
    );
    return true;
  }

  /** Asks before starting a report over: only reports not yet delivered can be reset. */
  private async askReset(turn: Turn, c: Contract, p: Period): Promise<void> {
    if (p.status === 'delivered') {
      turn.out.push(
        text(
          `El ${this.reportLabel(c, p)} ya fue entregado, así que no lo reinicio. Si quieres volver a recibirlo con los datos actualizados, escribe *rehacer ${monthNameEs(p.from).toLowerCase()}*.`,
        ),
      );
      return;
    }
    const notes = await this.deps.store.listNotes(c.id, p.from, p.to);
    turn.out.push(
      buttons(
        `🗑️ ¿Reinicio el ${this.reportLabel(c, p)}? Borro sus ${notes.length} nota${notes.length === 1 ? '' : 's'} y el borrador, y empezamos de cero. Tus soportes (planilla, certificados, firma) se conservan.`,
        [
          { id: `rst:${c.id}:${p.number}`, title: 'Sí, reiniciar' },
          { id: 'menu:cancel', title: 'Cancelar' },
        ],
      ),
    );
  }

  private async resetReport(turn: Turn, c: Contract, p: Period): Promise<void> {
    if (p.status === 'delivered') return this.askReset(turn, c, p);
    const n = await this.deps.store.resetPeriod(c.id, p.number, p.from, p.to);
    await this.savePeriodStatus(c, p, 'collecting');
    turn.out.push(
      text(
        `✅ Listo, reinicié el ${this.reportLabel(c, p)}: borré ${n} nota${n === 1 ? '' : 's'} y el borrador. Cuéntame lo que hiciste con notas de voz, textos o fotos, y cuando termines escribe *genera el informe*.`,
      ),
    );
  }

  /**
   * The open period has no notes at all: asking obligation by obligation would mean writing the whole
   * report from scratch. Ask for the activities instead, and offer to redo the last delivered report
   * (usually what the contractor wants after a format change or a correction).
   */
  private async nothingToDraft(turn: Turn, c: Contract, p: Period): Promise<void> {
    const report = (x: Period) =>
      `informe ${formatReportNumber(x.number, c.paymentsCount, c.reportNumberFormat)} (${formatRangeLong(x.from, x.to)})`;
    const msg = `📭 Para el ${report(p)} todavía no tengo actividades registradas.\n\nCuéntame lo que hiciste con notas de voz, textos o fotos (si no fue hoy, dime la fecha o el mes) y después escribe *genera el informe*.`;
    const delivered = (await this.deps.store.listPeriods(c.id))
      .filter((x) => x.status === 'delivered')
      .sort((a, b) => b.number - a.number)[0];
    if (!delivered) {
      turn.out.push(text(msg));
      return;
    }
    turn.out.push(
      buttons(
        `${msg}\n\nSi lo que quieres es volver a recibir el ${report(delivered)}, con los formatos y datos actualizados, toca *Rehacer ${monthNameEs(delivered.from).toLowerCase()}*.`,
        [
          {
            id: `redo:${c.id}:${delivered.number}`,
            title: `Rehacer ${monthNameEs(delivered.from).toLowerCase()}`,
          },
        ],
      ),
    );
  }

  private draft(
    c: Contract,
    p: Period,
    o: Obligation,
    paragraphs: string[],
    status: Draft['status'],
    src: string[],
  ): Draft {
    return {
      contractId: c.id,
      periodNumber: p.number,
      obligationKey: o.key,
      paragraphs,
      status,
      sourceNoteIds: src,
    };
  }

  private async savePeriodStatus(c: Contract, p: Period, status: Period['status']): Promise<void> {
    const ps = await this.deps.store.listPeriods(c.id);
    await this.deps.store.savePeriods(
      c.id,
      ps.map((x) => (x.number === p.number ? { ...x, status } : x)),
    );
  }

  private async askMissing(turn: Turn, c: Contract, p: Period, missing: string[]): Promise<void> {
    const o = c.obligations.find((x) => x.key === missing[0])!;
    const omit = (await this.deps.store.getEntity(c.entityId)).settings.emptyObligations === 'omit';
    this.setFlow(turn, 'draft_missing', 'ask', { contractId: c.id, periodNumber: p.number, missing });
    turn.out.push(
      buttons(
        `Para la obligación ${o.number} («${clip(o.text, 90)}») no tengo registros en tu ${this.reportLabel(c, p)}. ¿Qué hiciste?`,
        [
          { id: 'mis:write', title: 'Escribir/Audio' },
          { id: 'mis:default', title: 'Texto por defecto' },
          { id: 'mis:na', title: omit ? 'Omitir' : 'No aplicó' },
        ],
      ),
    );
  }

  private async loadDraftCtx(turn: Turn) {
    const ctx = turn.state.context as {
      contractId: string;
      periodNumber: number;
      missing?: string[];
      obligationKey?: string;
    };
    const c = await this.deps.store.getContract(ctx.contractId);
    const p = (await this.deps.store.listPeriods(c.id)).find((x) => x.number === ctx.periodNumber)!;
    return { ctx, c, p };
  }

  private async onDraftMissing(turn: Turn, msg: Inbound): Promise<void> {
    const { ctx, c, p } = await this.loadDraftCtx(turn);
    const missing = ctx.missing ?? [];
    const o = c.obligations.find((x) => x.key === missing[0])!;
    const entity = await this.deps.store.getEntity(c.entityId);
    if (msg.replyId === 'mis:default') {
      await this.deps.store.saveDraft(
        this.draft(c, p, o, [entity.settings.defaultActivityText], 'default', []),
      );
    } else if (msg.replyId === 'mis:na') {
      const omit = entity.settings.emptyObligations === 'omit';
      await this.deps.store.saveDraft(
        this.draft(c, p, o, omit ? [] : [entity.settings.emptyObligationText], 'not_applicable', []),
      );
    } else if (msg.replyId === 'mis:write') {
      this.setFlow(turn, 'draft_missing_text', 'write', { ...ctx });
      turn.out.push(
        text(
          `Cuéntame qué hiciste para la obligación ${o.number} en tu ${this.reportLabel(c, p)}. Puedes escribir o mandar un audio.`,
        ),
      );
      return;
    } else if (msg.kind === 'text' && msg.text) {
      // Answered directly with the activity.
      this.setFlow(turn, 'draft_missing_text', 'write', { ...ctx });
      return this.onDraftMissingText(turn, msg);
    } else {
      return this.askMissing(turn, c, p, missing);
    }
    return this.nextMissing(turn, c, p, missing.slice(1));
  }

  private async onDraftMissingText(turn: Turn, msg: Inbound): Promise<void> {
    const { ctx, c, p } = await this.loadDraftCtx(turn);
    const missing = ctx.missing ?? [];
    const o = c.obligations.find((x) => x.key === missing[0])!;
    if (!msg.text) {
      turn.out.push(text('Escríbeme o envíame un audio con lo que hiciste.'));
      return;
    }
    const date = parseActivityDate(
      msg.text,
      compareIso(this.deps.clock.today(), p.to) > 0 ? p.to : this.deps.clock.today(),
    );
    const note: Note = {
      id: this.deps.newId(),
      userId: turn.user.id,
      contractId: c.id,
      date: compareIso(date, p.from) < 0 ? p.from : date,
      text: msg.text,
      obligationKey: o.key,
      confidence: 1,
      evidenceIds: [],
      createdAt: this.deps.clock.now().toISOString(),
    };
    await this.deps.store.addNote(note);
    const r = await this.deps.ai.draftObligation(o, [note]);
    const paragraphs = r.status === 'ok' ? r.paragraphs : [msg.text.trim()];
    await this.deps.store.saveDraft(this.draft(c, p, o, paragraphs, 'proposed', [note.id]));
    return this.nextMissing(turn, c, p, missing.slice(1));
  }

  private async nextMissing(turn: Turn, c: Contract, p: Period, rest: string[]): Promise<void> {
    if (rest.length) return this.askMissing(turn, c, p, rest);
    return this.showReview(turn, c, p);
  }

  private async showReview(turn: Turn, c: Contract, p: Period, onlyKey?: string): Promise<void> {
    const drafts = await this.deps.store.listDrafts(c.id, p.number);
    const omit = (await this.deps.store.getEntity(c.entityId)).settings.emptyObligations === 'omit';
    const blocks: string[] = [];
    const omitted: number[] = [];
    for (const o of c.obligations) {
      if (onlyKey && o.key !== onlyKey) continue;
      const d = drafts.find((x) => x.obligationKey === o.key);
      if (omit && d?.status === 'not_applicable') {
        omitted.push(o.number);
        continue;
      }
      blocks.push(`*${o.number}.* ${clip(o.text, 140)}\n→ ${(d?.paragraphs ?? []).join('\n→ ')}`);
    }
    if (omitted.length)
      blocks.push(
        `⏭️ Sin actividades este periodo (no van en el informe de actividades): ${omitted.length === 1 ? 'obligación' : 'obligaciones'} ${omitted.join(', ')}.`,
      );
    const header = onlyKey
      ? '✏️ Así quedó:'
      : `📄 *Borrador – Informe ${formatReportNumber(p.number, c.paymentsCount, c.reportNumberFormat)}* (${formatRangeLong(p.from, p.to)})`;
    // Keep each message well under WhatsApp's 4096-character limit.
    let chunk = header;
    for (const b of blocks) {
      if (chunk.length + b.length + 2 > 3500) {
        turn.out.push(text(chunk));
        chunk = b;
      } else chunk += `\n\n${b}`;
    }
    turn.out.push(text(chunk));
    this.setFlow(turn, 'review', 'decide', { contractId: c.id, periodNumber: p.number });
    turn.out.push(
      buttons('¿Lo apruebas?', [
        { id: 'rev:approve', title: '✅ Aprobar todo' },
        { id: 'rev:edit', title: '✏️ Editar una' },
      ]),
    );
  }

  private async onReview(turn: Turn, msg: Inbound): Promise<void> {
    const { c, p } = await this.loadDraftCtx(turn);
    if (
      msg.replyId === 'rev:approve' ||
      (msg.text && /^(si|sí|apruebo|aprobar|ok|listo)\b/i.test(msg.text.trim()))
    ) {
      const drafts = await this.deps.store.listDrafts(c.id, p.number);
      for (const d of drafts) {
        if (d.status === 'proposed' || d.status === 'default')
          await this.deps.store.saveDraft({ ...d, status: 'approved' });
      }
      await this.savePeriodStatus(c, p, 'approved');
      this.reset(turn);
      turn.out.push(
        buttons('✅ Borrador aprobado. Cuando quieras, genero tus documentos.', [
          { id: 'menu:generate', title: '📄 Generar' },
        ]),
      );
      return;
    }
    if (msg.replyId === 'rev:edit' || (msg.text && /editar|cambiar|corregir/i.test(msg.text))) {
      this.setFlow(turn, 'edit_pick', 'pick', { contractId: c.id, periodNumber: p.number });
      turn.out.push(choose('¿Cuál obligación quieres editar?', c.obligations.map(obligationRow), 0, 'emore'));
      return;
    }
    turn.out.push(
      buttons('¿Apruebas el borrador o quieres editar una obligación?', [
        { id: 'rev:approve', title: '✅ Aprobar todo' },
        { id: 'rev:edit', title: '✏️ Editar una' },
      ]),
    );
  }

  private async onEditPick(turn: Turn, msg: Inbound): Promise<void> {
    const { ctx, c } = await this.loadDraftCtx(turn);
    if (msg.replyId?.startsWith('emore:')) {
      turn.out.push(
        choose('Más obligaciones:', c.obligations.map(obligationRow), Number(msg.replyId.slice(6)), 'emore'),
      );
      return;
    }
    const key = msg.replyId?.startsWith('o:')
      ? msg.replyId.slice(2)
      : c.obligations.find((o) => msg.text && o.number === Number(msg.text.trim()))?.key;
    const o = c.obligations.find((x) => x.key === key);
    if (!o) {
      turn.out.push(choose('Elige la obligación:', c.obligations.map(obligationRow), 0, 'emore'));
      return;
    }
    this.setFlow(turn, 'edit_text', 'write', { ...ctx, obligationKey: o.key });
    turn.out.push(
      text(
        `Escríbeme el texto nuevo para la obligación ${o.number}, o dime qué cambiar (por ejemplo: "agrega que fueron 30 personas").`,
      ),
    );
  }

  private async onEditText(turn: Turn, msg: Inbound): Promise<void> {
    const { ctx, c, p } = await this.loadDraftCtx(turn);
    const o = c.obligations.find((x) => x.key === ctx.obligationKey)!;
    if (!msg.text) {
      turn.out.push(text('Escríbeme el cambio que quieres.'));
      return;
    }
    const drafts = await this.deps.store.listDrafts(c.id, p.number);
    const d = drafts.find((x) => x.obligationKey === o.key) ?? this.draft(c, p, o, [], 'proposed', []);
    const paragraphs = await this.deps.ai.rewrite(d.paragraphs, msg.text, o);
    await this.deps.store.saveDraft({ ...d, paragraphs, status: 'proposed' });
    await this.showReview(turn, c, p, o.key);
  }

  // -------------------------------------------------------------------------
  // Generation and delivery
  // -------------------------------------------------------------------------
  private async startGenerate(turn: Turn, c: Contract, resend = false, periodNumber?: number): Promise<void> {
    const ps = (await this.deps.store.listPeriods(c.id)).sort((a, b) => a.number - b.number);
    const p = resend
      ? [...ps]
          .reverse()
          .find((x) => x.status === 'delivered' && (!periodNumber || x.number === periodNumber))
      : (ps.find((x) => x.status === 'approved') ?? (await this.currentPeriod(c)));
    if (!p) {
      turn.out.push(
        text(
          resend ? 'Aún no tienes documentos generados.' : 'No tienes cuentas pendientes en este contrato.',
        ),
      );
      return;
    }
    if (!resend) {
      const drafts = await this.deps.store.listDrafts(c.id, p.number);
      const ready = c.obligations.every((o) =>
        drafts.some(
          (d) => d.obligationKey === o.key && (d.status === 'approved' || d.status === 'not_applicable'),
        ),
      );
      if (!ready) {
        turn.out.push(
          buttons('Antes de generar necesito que apruebes el borrador del informe.', [
            { id: 'menu:draft', title: 'Ver borrador' },
          ]),
        );
        return;
      }
      const entity = await this.deps.store.getEntity(c.entityId);
      const { missing, expired } = await this.checklist(turn, c, p);
      if (!missing.length && expired.length && !entity.settings.generateWithMissing)
        return this.askExpired(turn, expired);
      if ((missing.length || expired.length) && !entity.settings.generateWithMissing) {
        turn.out.push(
          text(
            `⚠️ Me faltan estos soportes para generar tu ${this.reportLabel(c, p)}:\n${missing
              .map((m) => `❌ ${m.label}${m.officialUrl ? `\n   🔗 ${m.officialUrl}` : ''}`)
              .concat(
                expired.map(
                  (e) =>
                    `⚠️ ${e.type.label} (vencido)${e.type.officialUrl ? `\n   🔗 ${e.type.officialUrl}` : ''}`,
                ),
              )
              .join('\n')}\n\nEnvíamelos y vuelve a escribir *generar*.`,
          ),
        );
        turn.out.push(
          buttons('🧭 ¿Te guío para descargarlos uno por uno?', [{ id: `guide:${c.id}`, title: 'Guíame' }]),
        );
        return;
      }
    }
    // The values of the contract's reports do not add up to its total: the contractor confirms this one.
    if (!resend && !(await this.amountSettled(c, p))) return this.askAmount(turn, c, p);

    // Without the PILA of the right month the social security tables go out empty: ask for it first.
    const pilaMonth = pilaMonthFor((await this.deps.store.getEntity(c.entityId)).settings, p.to);
    const noPilaOk =
      turn.state.context && (turn.state.context as { noPila?: string }).noPila === `${c.id}:${p.number}`;
    if (!noPilaOk && !(await this.deps.store.getSocialSecurity(turn.user.id, pilaMonth))) {
      const month = `${monthNameEs(pilaMonth).toLowerCase()} de ${pilaMonth.slice(0, 4)}`;
      const again = resend ? `*rehacer ${monthNameEs(p.from).toLowerCase()}*` : '*generar*';
      this.setFlow(turn, 'generate_no_pila', 'ask', { contractId: c.id, periodNumber: p.number, resend });
      turn.out.push(
        buttons(
          `🧾 Para llenar la tabla de seguridad social de tu ${this.reportLabel(c, p)} necesito la planilla PILA de *${month}* y no la tengo. Envíamela en PDF (o una foto) y luego escribe ${again}.`,
          [{ id: 'nopila:go', title: 'Generar sin planilla' }],
        ),
      );
      return;
    }
    // Configuration and report are paid before delivery (ADR-034); in the pilot nothing is charged.
    let charge: 'paid' | 'free' | 'pilot' = 'pilot';
    if (!resend) {
      const paid = await this.ensurePaid(turn, c, p);
      if (!paid) return;
      charge = paid;
    }
    turn.out.push(text('⏳ Estoy generando tus documentos, dame un momento…'));
    if (!resend) await this.savePeriodStatus(c, p, 'generating');
    const files = await this.deps.generator.generate(c.id, p.number);
    for (const group of ['pdf', 'docx', 'zip'] as const) {
      for (const f of files.filter((x) => x.group === group)) {
        turn.out.push({ type: 'document', filename: f.filename, mime: f.mime, data: f.data });
      }
    }
    if (!resend) {
      await this.savePeriodStatus(c, p, 'delivered');
      await this.deps.store.markPeriodCharge(c.id, p.number, charge);
    }
    turn.out.push(
      text(
        '🎉 ¡Listo! Lo que falta fuera de WhatsApp:\n1. Revisa y firma el informe de actividades.\n2. Entrega el borrador del informe de supervisión a tu supervisor para su firma.\n3. Carga los documentos en SECOP II (el ZIP ya tiene la carpeta *DOCUMENTOS A CARGAR*).',
      ),
    );
  }

  // -------------------------------------------------------------------------
  // Period cut mode (answer 3: month end vs date to date, editable any time)
  // -------------------------------------------------------------------------
  private async startCut(turn: Turn, c: Contract): Promise<void> {
    const current = c.periodMode === 'month_end' ? 'fin de mes' : 'fecha a fecha';
    this.setFlow(turn, 'cut_mode', 'pick', { contractId: c.id });
    turn.out.push(
      buttons(`Tu contrato ${c.shortLabel} está con corte *${current}*. ¿Cómo quieres cortar tus cuentas?`, [
        { id: 'mode:month_end', title: 'Fin de mes' },
        { id: 'mode:date_to_date', title: 'Fecha a fecha' },
      ]),
    );
  }

  private async onCutMode(turn: Turn, msg: Inbound): Promise<void> {
    const ctx = turn.state.context as { contractId: string; mode?: PeriodMode };
    const c = await this.deps.store.getContract(ctx.contractId);
    if (ctx.mode && msg.replyId === 'cut:confirm') {
      const { kept, rebuilt } = await this.recut(c, ctx.mode);
      await this.deps.store.savePeriods(c.id, [...kept, ...rebuilt]);
      await this.deps.store.updateContract({ ...c, periodMode: ctx.mode });
      this.reset(turn);
      turn.out.push(text('✅ Cambié el corte de tus cuentas. Las cuentas ya entregadas no se modificaron.'));
      return;
    }
    if (ctx.mode && msg.replyId === 'cut:cancel') {
      this.reset(turn);
      turn.out.push(text('Listo, dejé el corte como estaba.'));
      return;
    }
    const mode =
      msg.replyId === 'mode:month_end'
        ? 'month_end'
        : msg.replyId === 'mode:date_to_date'
          ? 'date_to_date'
          : null;
    if (!mode) return this.startCut(turn, c);
    const { kept, rebuilt } = await this.recut(c, mode);
    const preview = rebuilt
      .slice(0, 8)
      .map((p) => `• Cuenta ${p.number}: ${formatRangeLong(p.from, p.to)} – ${formatCOP(p.amount)}`)
      .join('\n');
    this.setFlow(turn, 'cut_mode', 'confirm', { contractId: c.id, mode });
    turn.out.push(
      buttons(
        `Así quedaría tu calendario${kept.length ? ` (las ${kept.length} cuentas ya entregadas no cambian)` : ''}:\n${preview}\n\n¿Lo confirmo?`,
        [
          { id: 'cut:confirm', title: 'Confirmar' },
          { id: 'cut:cancel', title: 'Cancelar' },
        ],
      ),
    );
  }

  // -------------------------------------------------------------------------
  // Payment before delivery (ADR-034): free report of the Aliado, cash code or Wompi link.
  // -------------------------------------------------------------------------
  /** Returns how the report is covered, or null after asking the contractor to pay. */
  private async ensurePaid(turn: Turn, c: Contract, p: Period): Promise<'paid' | 'free' | 'pilot' | null> {
    const { store } = this.deps;
    const billing = await store.getBillingSettings();
    if (billing.mode === 'pilot') return 'pilot';
    const existing = await store.findCharge(c.id, 'report', p.number);
    if (existing && existing.status !== 'pending' && existing.status !== 'cancelled')
      return existing.status === 'free' ? 'free' : existing.status === 'pilot' ? 'pilot' : 'paid';
    const charge = await store.openCharge({
      userId: turn.user.id,
      requestedBy: turn.actor?.id ?? null,
      product: 'report',
      contractId: c.id,
      periodNumber: p.number,
      coversSetup: false,
      amount: billing.prices.report,
    });
    if (await store.useFreeGrant(turn.user.id, charge.id)) {
      await store.settleCharge(charge.id, 'free', 'free_grant');
      turn.out.push(text('🎁 Usé una de tus cuentas gratis para este informe.'));
      return 'free';
    }
    return this.askPayment(turn, c, p, charge);
  }

  /** Payment request for a report (p) or for the contract's configuration (p = null). */
  private async askPayment(turn: Turn, c: Contract, p: Period | null, charge: Charge): Promise<null> {
    this.setFlow(turn, 'pay_wait', 'wait', {
      chargeId: charge.id,
      contractId: c.id,
      periodNumber: p?.number ?? null,
    });
    const intro = p
      ? `💳 Tu ${this.reportLabel(c, p)} está listo. Para entregártelo el valor es *${formatCOP(charge.amount)}*.`
      : `💳 Para activar tu contrato *${c.fullNumber}* el valor de la configuración es *${formatCOP(charge.amount)}*. Cuando se confirme el pago empezamos a registrar tus actividades.`;
    const after = p ? 'te envío los documentos' : 'te aviso';
    const url = this.deps.payments?.checkoutUrl(charge, actorOf(turn).phone);
    if (url) {
      turn.out.push({
        type: 'cta_url',
        text: `${intro}\n\nPaga en línea (tarjeta, PSE, Nequi o Bancolombia) y ${after} apenas se confirme.`,
        button: 'Pagar en línea',
        url,
      });
      turn.out.push(
        buttons('¿Pagaste en efectivo y tienes un código? ¿O prefieres hablar con una persona?', [
          { id: 'pay:code', title: 'Tengo un código' },
          { id: 'menu:support', title: 'Hablar con soporte' },
        ]),
      );
    } else {
      // No online payment configured: cash with a code, arranged with a person.
      turn.out.push(
        buttons(
          `${intro}\n\nPor ahora el pago es en efectivo o por transferencia: toca *Cómo pagar* y una persona del equipo te indica cómo hacerlo y te entrega tu código de pago. Si ya tienes el código, toca *Tengo un código*.`,
          [
            { id: 'pay:how', title: 'Cómo pagar' },
            { id: 'pay:code', title: 'Tengo un código' },
            { id: 'menu:support', title: 'Hablar con soporte' },
          ],
        ),
      );
    }
    return null;
  }

  private async onPayment(turn: Turn, msg: Inbound): Promise<void> {
    const ctx = turn.state.context as { chargeId: string; contractId: string; periodNumber: number };
    if (msg.replyId === 'pay:code') {
      this.setFlow(turn, 'pay_code', 'write', { ...ctx });
      turn.out.push(text('Escríbeme tu código de pago, por ejemplo *K7M4-Q2P9*.'));
      return;
    }
    const raw = (msg.text ?? '').trim();
    // "Pagar", "cómo pago", "quiero pagar": show the payment options again.
    const asksToPay = /^(pagar|pago|c[oó]mo pago|quiero pagar|link de pago|enlace de pago)\b/i.test(raw);
    if (msg.replyId === 'pay:how' || (asksToPay && !this.deps.payments)) {
      turn.out.push(
        text(
          '🙋 Listo, le aviso a una persona del equipo para que te indique cómo pagar en efectivo o por transferencia. Cuando pagues te enviamos tu código; escríbemelo aquí y te entrego los documentos.',
        ),
      );
      await this.deps.store.openSupportTicket(turn.user.id, 'Pago en efectivo o transferencia');
      return;
    }
    if (asksToPay) {
      const charge = await this.deps.store.getCharge(ctx.chargeId);
      const c = await this.deps.store.getContract(ctx.contractId);
      const p = ctx.periodNumber
        ? ((await this.deps.store.listPeriods(c.id)).find((x) => x.number === ctx.periodNumber) ?? null)
        : null;
      await this.askPayment(turn, c, p, charge);
      return;
    }
    const looksLikeCode = /^[A-Za-z0-9]{4}-?[A-Za-z0-9]{4}$/.test(raw);
    if (!raw || (turn.state.flow === 'pay_wait' && !looksLikeCode)) {
      // Anything else: leave the payment pending and handle the message normally.
      this.reset(turn);
      return this.dispatch(turn, msg);
    }
    const charge = await this.deps.store.getCharge(ctx.chargeId);
    if (charge.status !== 'pending') {
      this.reset(turn);
      turn.out.push(text('✅ Este informe ya está pagado. Escribe *generar* para recibir tus documentos.'));
      return;
    }
    const r = await this.deps.store.redeemCashCode(turn.user.id, raw, charge.id);
    if (!r.ok) {
      const why = {
        not_found: 'No encuentro ese código. Revísalo y escríbelo de nuevo.',
        other_user:
          'Ese código pertenece a otra persona; cada código solo funciona en la conversación de quien pagó.',
        used: 'Ese código ya se usó.',
        expired:
          'Ese código venció (duran 30 días). Escribe *soporte* y te generamos uno nuevo por el mismo valor.',
        wrong_amount: `Ese código no corresponde a este valor (${formatCOP(charge.amount)}). Escribe *soporte* si crees que es un error.`,
      }[r.reason];
      turn.out.push(text(`❌ ${why}`));
      return;
    }
    await this.deps.store.settleCharge(charge.id, 'paid', 'cash_code');
    this.reset(turn);
    turn.out.push(text(`✅ Código aceptado: ${formatCOP(charge.amount)}.`));
    if (charge.product === 'setup') {
      turn.out.push(text(CONTRACT_ACTIVE));
      return;
    }
    return this.startGenerate(turn, await this.deps.store.getContract(ctx.contractId));
  }

  /** Contracts whose configuration charge is pending are left out until it is paid. */
  private async unpaidFilter(cs: Contract[]): Promise<Contract[]> {
    const out: Contract[] = [];
    for (const c of cs)
      if ((await this.deps.store.findCharge(c.id, 'setup', null))?.status !== 'pending') out.push(c);
    return out;
  }

  /**
   * When every contract of the user waits for its configuration payment, asks for it (and returns true).
   * `justConfigured`: right after the setup, ask for the newest contract even if others are active.
   */
  private async setupGate(turn: Turn, justConfigured: boolean): Promise<boolean> {
    const all = await this.deps.store.listContracts(turn.user.id);
    if (!all.length) return false;
    const pending: { c: Contract; charge: Charge }[] = [];
    for (const c of all) {
      const charge = await this.deps.store.findCharge(c.id, 'setup', null);
      if (charge?.status === 'pending') pending.push({ c, charge });
    }
    if (!pending.length || (!justConfigured && pending.length < all.length)) return false;
    const { c, charge } = pending.at(-1)!;
    await this.askPayment(turn, c, null, charge);
    return true;
  }

  /** Online payment confirmed (Wompi): thank the contractor and deliver the report. */
  /**
   * Reminder before the period closes (ADR-036): what the contractor still lacks for the report in
   * course, or null when nothing is missing or they turned reminders off. `message` is the free-form
   * version (inside the 24-hour window); outside it the worker sends the approved template with the
   * same data.
   */
  async supportsReminder(
    userId: string,
    contractId: string,
    /** A gestor of this contractor (ADR-042); omitted, the contractor themselves. */
    recipientId?: string,
  ): Promise<{
    to: string;
    name: string;
    report: string;
    /** «septiembre de 2026»: the month of the account, for the template. */
    month: string;
    periodNumber: number;
    missing: string[];
    message: Outgoing;
    /** Payload of the template's quick reply. */
    reply: string;
  } | null> {
    const user = await this.deps.store.getUser(userId);
    const recipient =
      recipientId && recipientId !== userId ? await this.deps.store.getUser(recipientId) : user;
    if (recipient.remindersOptOut) return null;
    const c = await this.deps.store.getContract(contractId);
    const p = await this.currentPeriod(c);
    if (!p) return null;
    const turn: Turn = { user, state: this.idle(user.id), out: [] };
    const { missing, expired } = await this.checklist(turn, c, p);
    const labels = [...missing.map((t) => t.label), ...expired.map((e) => `${e.type.label} (vencido)`)];
    if (!labels.length) return null;
    const name = recipient.fullName.split(' ')[0] ?? '';
    const report = this.reportLabel(c, p);
    const month = `${monthNameEs(p.from).toLowerCase()} de ${p.from.slice(0, 4)}`;
    const list = labels.map((l) => `• ${l}`).join('\n');
    if (recipient.id !== user.id) {
      // To the gestor: whose account it is, and a button that switches to that person.
      const person = this.personName(user);
      return {
        to: recipient.phone,
        name,
        report,
        month: `${month} de ${person}`,
        periodNumber: p.number,
        missing: labels,
        reply: `who:${user.id}:status`,
        message: buttons(
          `⏰ Hola ${name}, el ${report} de *${person}* cierra pronto y aún faltan:\n${list}\n\nSi no quieres recordatorios, escribe *STOP*.`,
          [{ id: `who:${user.id}:status`, title: 'Ver sus soportes' }],
        ),
      };
    }
    return {
      to: user.phone,
      name,
      report,
      month,
      periodNumber: p.number,
      missing: labels,
      reply: 'menu:status',
      message: buttons(
        `⏰ Hola ${name}, tu ${report} cierra pronto y aún me faltan:\n${list}\n\n¿Te guío para descargarlos uno por uno? Si no quieres recordatorios, escribe *STOP*.`,
        [{ id: `guide:${c.id}`, title: 'Guíame' }],
      ),
    };
  }

  async chargePaid(chargeId: string): Promise<{ to: string; out: Outgoing[] }> {
    const { store } = this.deps;
    const charge = await store.getCharge(chargeId);
    const user = await store.getUser(charge.userId);
    // Asked for by a gestor (ADR-042): the documents go to them, in their conversation.
    const actor =
      charge.requestedBy && charge.requestedBy !== user.id
        ? await store.getUser(charge.requestedBy)
        : undefined;
    const owner = actor ?? user;
    const state = (await store.getConversation(owner.id)) ?? this.idle(owner.id);
    const turn: Turn = { user, ...(actor ? { actor } : {}), state, out: [] };
    if (turn.state.flow === 'pay_wait' || turn.state.flow === 'pay_code') this.reset(turn);
    turn.out.push(text(`✅ Recibí tu pago de ${formatCOP(charge.amount)}. ¡Gracias!`));
    if (charge.product === 'report')
      await this.startGenerate(turn, await store.getContract(charge.contractId));
    else turn.out.push(text(CONTRACT_ACTIVE));
    this.markPerson(turn);
    turn.state.updatedAt = this.deps.clock.now().toISOString();
    await store.saveConversation(turn.state);
    return { to: owner.phone, out: turn.out };
  }

  // -------------------------------------------------------------------------
  // Value to bill (ADR-033): equal payments by default; the contractor decides when it does not add up
  // or when a compliance certificate states another value.
  // -------------------------------------------------------------------------
  private async amountSettled(c: Contract, p: Period): Promise<boolean> {
    if (p.amountSource === 'contractor' || p.amountSource === 'certificate') return true;
    const ps = await this.deps.store.listPeriods(c.id);
    return ps.reduce((a, x) => a + x.amount, 0) === c.totalValue;
  }

  /** Which report a date belongs to, so every note and question says its period. */
  private async periodLine(c: Contract, date: IsoDate): Promise<string> {
    const p = (await this.deps.store.listPeriods(c.id)).find(
      (x) => compareIso(x.from, date) <= 0 && compareIso(date, x.to) <= 0,
    );
    if (!p) return `📅 El ${formatDdMmYyyy(date)} no está dentro de ningún periodo de ${c.shortLabel}.`;
    const label = this.reportLabel(c, p);
    return `📅 ${label.charAt(0).toUpperCase()}${label.slice(1)}`;
  }

  private reportLabel(c: Contract, p: Period): string {
    return `informe ${formatReportNumber(p.number, c.paymentsCount, c.reportNumberFormat)} (${formatRangeLong(p.from, p.to)})`;
  }

  private async askAmount(turn: Turn, c: Contract, p: Period): Promise<void> {
    const sum = (await this.deps.store.listPeriods(c.id)).reduce((a, x) => a + x.amount, 0);
    this.setFlow(turn, 'amount_confirm', 'ask', {
      contractId: c.id,
      periodNumber: p.number,
      thenGenerate: true,
    });
    turn.out.push(
      buttons(
        `💰 Las cuentas de tu contrato suman ${formatCOP(sum)} y el contrato vale ${formatCOP(c.totalValue)}, así que necesito que me confirmes el valor.\n\nPara el ${this.reportLabel(c, p)} tengo *${formatCOP(p.amount)}*. ¿Cobro ese valor?`,
        [
          { id: 'amt:ok', title: 'Sí, cobrar ese' },
          { id: 'amt:other', title: 'Otro valor' },
        ],
      ),
    );
  }

  private async suggestCertificateAmount(turn: Turn, c: Contract, amount: number): Promise<void> {
    const ps = (await this.deps.store.listPeriods(c.id)).sort((a, b) => a.number - b.number);
    const p = ps.find((x) => x.status === 'approved') ?? (await this.currentPeriod(c));
    if (!p) return;
    if (amount === p.amount) {
      await this.savePeriodAmount(c, p.number, amount, 'certificate');
      return;
    }
    this.setFlow(turn, 'amount_cert', 'ask', { contractId: c.id, periodNumber: p.number, amount });
    turn.out.push(
      buttons(
        `📄 Tu certificado de cumplimiento dice que se pagan *${formatCOP(amount)}*, y yo tenía *${formatCOP(p.amount)}* para el ${this.reportLabel(c, p)}. ¿Cuál cobro?`,
        [
          { id: 'cert:use', title: clip(`Cobrar ${formatCOP(amount)}`, 20) },
          { id: 'cert:keep', title: clip(`Dejar ${formatCOP(p.amount)}`, 20) },
          { id: 'amt:other', title: 'Otro valor' },
        ],
      ),
    );
  }

  private async onAmountChoice(turn: Turn, msg: Inbound): Promise<void> {
    const ctx = turn.state.context as {
      contractId: string;
      periodNumber: number;
      amount?: number;
      thenGenerate?: boolean;
    };
    const c = await this.deps.store.getContract(ctx.contractId);
    const p = (await this.deps.store.listPeriods(c.id)).find((x) => x.number === ctx.periodNumber)!;
    if (msg.replyId === 'amt:other') {
      this.setFlow(turn, 'amount_write', 'write', { ...ctx });
      turn.out.push(
        text(`Escríbeme el valor a cobrar en el ${this.reportLabel(c, p)}. Por ejemplo: *4.000.000*.`),
      );
      return;
    }
    if (msg.replyId === 'cert:use' && ctx.amount)
      await this.savePeriodAmount(c, p.number, ctx.amount, 'certificate');
    else if (msg.replyId === 'amt:ok' || msg.replyId === 'cert:keep')
      await this.savePeriodAmount(c, p.number, p.amount, 'contractor');
    else {
      turn.out.push(text('Toca una de las opciones o escribe *menú* para salir.'));
      return;
    }
    return this.afterAmount(turn, c, ctx.periodNumber, ctx.thenGenerate);
  }

  private async onAmountWrite(turn: Turn, msg: Inbound): Promise<void> {
    const ctx = turn.state.context as { contractId: string; periodNumber: number; thenGenerate?: boolean };
    const c = await this.deps.store.getContract(ctx.contractId);
    const ps = await this.deps.store.listPeriods(c.id);
    const digits = (msg.text ?? '').replace(/[^\d]/g, '');
    const value = digits ? Number(digits) : Number.NaN;
    const others = ps.filter((x) => x.number !== ctx.periodNumber && x.status === 'delivered');
    const max = c.totalValue - others.reduce((a, x) => a + x.amount, 0);
    if (!Number.isFinite(value) || value <= 0 || value > max) {
      turn.out.push(
        text(
          `Escríbeme solo el valor en pesos, sin centavos (máximo ${formatCOP(max)}). Por ejemplo: *4.000.000*.`,
        ),
      );
      return;
    }
    await this.savePeriodAmount(c, ctx.periodNumber, value, 'contractor');
    return this.afterAmount(turn, c, ctx.periodNumber, ctx.thenGenerate);
  }

  private async afterAmount(turn: Turn, c: Contract, n: number, thenGenerate?: boolean): Promise<void> {
    const p = (await this.deps.store.listPeriods(c.id)).find((x) => x.number === n)!;
    this.reset(turn);
    turn.out.push(text(`✅ Listo, el ${this.reportLabel(c, p)} queda por *${formatCOP(p.amount)}*.`));
    if (thenGenerate) return this.startGenerate(turn, c);
  }

  private async savePeriodAmount(
    c: Contract,
    n: number,
    amount: number,
    source: Period['amountSource'],
  ): Promise<void> {
    const ps = await this.deps.store.listPeriods(c.id);
    await this.deps.store.savePeriods(
      c.id,
      ps.map((x) => (x.number === n ? { ...x, amount, amountSource: source } : x)),
    );
  }

  private async recut(c: Contract, mode: PeriodMode): Promise<{ kept: Period[]; rebuilt: Period[] }> {
    const existing = await this.deps.store.listPeriods(c.id);
    const { kept, rebuilt } = recutPeriods(
      existing.map((p) => ({
        number: p.number,
        from: p.from,
        to: p.to,
        delivered: p.status === 'delivered',
      })),
      c.startDate,
      c.endDate,
      mode,
    );
    const keptPeriods = existing.filter((p) => kept.some((k) => k.number === p.number));
    // Only what is left of the contract is split among the new periods.
    const plan = planPeriodAmounts({
      periods: rebuilt,
      totalValue: c.totalValue - keptPeriods.reduce((a, p) => a + p.amount, 0),
      monthlyValue: c.monthlyValue,
      paymentsCount: Math.max(c.paymentsCount - keptPeriods.length, 0),
      ...(c.schedule ? { schedule: c.schedule } : {}),
    });
    const newPeriods: Period[] = rebuilt.map((r, i) => {
      const resolved = plan.amounts[i]!;
      const prev = existing.find((p) => p.number === r.number);
      return {
        contractId: c.id,
        number: r.number,
        from: r.from,
        to: r.to,
        amount: resolved.amount,
        amountSource: resolved.source,
        executionPct: resolved.executionPct,
        status: prev && prev.status !== 'delivered' ? prev.status : 'scheduled',
      };
    });
    return { kept: keptPeriods, rebuilt: newPeriods };
  }
}
