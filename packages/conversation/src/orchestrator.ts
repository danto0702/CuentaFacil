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
  recutPeriods,
  resolvePeriodAmount,
} from '@cuentasbot/shared';
import { allyStatusText, findAllyCode, levelUpText, NOT_ALLY_TEXT, referralText } from './ally.js';
import { BRAND, SIGNATURE } from './brand.js';
import type {
  Contract,
  ConversationState,
  Draft,
  Note,
  Obligation,
  Period,
  SupportSegment,
  SupportType,
  User,
} from './domain.js';
import { noteSupports } from './domain.js';
import { type Command, forcedNote, matchCommand } from './intents.js';
import type { Deps, Inbound, ListRow, Outgoing } from './ports.js';
import { POLICY_VERSION, SETUP_FLOW, SetupFlow } from './setup.js';
import { type ActivityWhen, clip, parseActivityDate, parseActivityWhen } from './text.js';

const MAX_BUTTONS = 3;
const MAX_ROWS = 10;

type Ctx = Record<string, unknown>;

interface Turn {
  user: User;
  state: ConversationState;
  out: Outgoing[];
}

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
    const user = await store.getUserByPhone(msg.from);
    if (!user) {
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
    if (turn.state.flow === 'profile_doc_issued_in' && (await this.onDocIssuedIn(turn, msg))) {
      // answered
    } else {
      await this.dispatch(turn, msg);
      await this.askMissingProfile(turn);
    }
    turn.state.updatedAt = this.deps.clock.now().toISOString();
    await store.saveConversation(turn.state);
    return turn.out;
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
    turn.state.flow = flow;
    turn.state.step = step;
    turn.state.context = context;
  }

  private reset(turn: Turn): void {
    const pending = turn.state.context.pendingEvidence;
    this.setFlow(turn, 'idle', 'start', pending ? { pendingEvidence: pending } : {});
  }

  // -------------------------------------------------------------------------
  // Dispatch
  // -------------------------------------------------------------------------
  private async dispatch(turn: Turn, msg: Inbound): Promise<void> {
    if (msg.kind === 'audio' && msg.media) {
      const transcript = await this.deps.stt.transcribe(msg.media.data, msg.media.mime);
      turn.out.push(text(`🎙️ Te entendí: «${clip(transcript, 300)}»`));
      return this.dispatch(turn, { ...msg, kind: 'text', text: transcript });
    }

    const allyCode = msg.kind === 'text' && msg.text ? findAllyCode(msg.text) : null;
    if (allyCode) {
      turn.out.push(referralText(await this.deps.store.applyReferral(turn.user.id, allyCode), allyCode));
      return;
    }

    if (turn.state.flow === SETUP_FLOW) {
      const cmd = msg.kind === 'text' && msg.text ? matchCommand(msg.text) : null;
      if (cmd === 'cancel') {
        this.reset(turn);
        turn.out.push(
          text('Listo, dejé la configuración en pausa. Cuando quieras retomarla escribe *agregar contrato*.'),
        );
        return;
      }
      if (cmd !== 'about' && cmd !== 'support' && cmd !== 'ally') return this.setup.handle(turn, msg);
    }

    if (msg.kind === 'text' && msg.text) {
      const forced = forcedNote(msg.text);
      if (forced) {
        this.reset(turn);
        return this.startNote(turn, forced);
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
    if (msg.kind === 'image' && msg.media && turn.state.flow !== 'idle') {
      if (turn.state.flow === 'note_contract') {
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
    if (msg.kind === 'document' && msg.media && turn.state.flow !== 'idle') this.reset(turn);

    if (msg.kind === 'reply' && msg.replyId?.startsWith('menu:')) {
      return this.command(turn, msg.replyId.slice(5) as Command);
    }

    switch (turn.state.flow) {
      case 'note_contract':
        return this.onNoteContract(turn, msg);
      case 'note_when':
        return this.onNoteWhen(turn, msg);
      case 'note_obligation':
        return this.onNoteObligation(turn, msg);
      case 'note_extra_obligation':
        return this.onExtraObligation(turn, msg);
      case 'draft_pick_contract':
        return this.onPickContract(turn, msg, (c) => this.startDraft(turn, c));
      case 'generate_pick_contract':
        return this.onPickContract(turn, msg, (c) => this.startGenerate(turn, c));
      case 'status_pick_contract':
        return this.onPickContract(turn, msg, (c) => this.startStatus(turn, [c]));
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
      case 'support':
        turn.out.push(
          text('🙋 Listo, le aviso a una persona del equipo de soporte. Te escribiremos por aquí.'),
        );
        return;
      case 'stop_reminders':
        turn.out.push(text('🔕 Desactivé tus recordatorios. Puedes seguir usando el servicio normalmente.'));
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
          `Soy ${SIGNATURE}. Así me usas:\n1️⃣ Durante el mes, cuéntame lo que haces: texto, audio o fotos. Yo lo anoto en la obligación que corresponde.\n2️⃣ Envíame los soportes (planilla, antecedentes, afiliaciones) cuando los tengas.\n3️⃣ Al cierre escribe *genera el informe* (o *ver borrador*): redacto el informe y tú lo apruebas.\n4️⃣ Escribe *generar* y te envío los documentos listos para firmar.\n↩️ Si una nota quedó mal, escribe *borra la última nota*.`,
        ),
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
          { id: 'menu:help', title: 'Ayuda' },
          { id: 'menu:support', title: 'Hablar con soporte' },
          {
            id: 'menu:about',
            title: `Conocer ${BRAND.company}`,
            description: 'Nuestros servicios y página web',
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
    const all = await this.deps.store.listContracts(turn.user.id);
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
      if (pending.length === 1)
        turn.out.push(text('📷 Recibí tu foto. ¿Qué actividad muestra? Cuéntamelo en un mensaje.'));
      return;
    }
    if (msg.kind === 'document' && msg.media) return this.receiveSupport(turn, msg);
    if (msg.kind === 'text' && msg.text) return this.startNote(turn, msg.text);
    if (msg.kind === 'reply' && msg.replyId?.startsWith('chg:'))
      return this.askObligation(turn, msg.replyId.slice(4));
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
      // No date in the note: today if a contract is in force, otherwise ask when it happened.
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

  /** Answer to "¿en qué fecha o mes?" for a note that had none (or one outside the contract). */
  private async onNoteWhen(turn: Turn, msg: Inbound): Promise<void> {
    const ctx = turn.state.context as { noteText: string; evidenceIds: string[] };
    const when =
      msg.kind === 'text' && msg.text ? parseActivityWhen(msg.text, this.deps.clock.today()) : null;
    if (!when) {
      if (msg.kind === 'text' && msg.text && msg.text.trim().split(/\s+/).length > 4) {
        // A new note instead of a date.
        this.reset(turn);
        return this.startNote(turn, msg.text);
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
        return this.startNote(turn, msg.text);
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
      if (note.obligationKey) {
        const o = c.obligations.find((x) => x.key === note.obligationKey)!;
        const sure = result.confidence >= this.deps.confidenceThreshold;
        turn.out.push(
          buttons(
            sure
              ? `✅ Anotado ${label ?? `el ${formatDdMmYyyy(date)}`}${photos}${where} en la obligación ${o.number}: «${clip(o.text, 80)}»`
              : `📝 Anotado ${label ?? `el ${formatDdMmYyyy(date)}`}${photos}${where}. Creo que va en la obligación ${o.number}: «${clip(o.text, 80)}». ¿Está bien?`,
            [
              { id: `nok:${note.id}`, title: '✅ Está bien' },
              { id: `chg:${note.id}`, title: 'Cambiar obligación' },
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

  private async askObligation(
    turn: Turn,
    noteId: string,
    body = '¿A cuál obligación corresponde?',
    page = 0,
  ): Promise<void> {
    const note = await this.deps.store.getNote(noteId);
    const c = await this.deps.store.getContract(note.contractId);
    this.setFlow(turn, 'note_obligation', 'pick', { noteId });
    turn.out.push(choose(body, c.obligations.map(obligationRow), page, 'omore'));
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
      choose('¿En qué otra obligación va esta actividad?', free.map(obligationRow), page, 'xmore'),
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
      if (msg.kind === 'text' && msg.text) return this.startNote(turn, msg.text);
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
      buttons(`✅ También quedó en la obligación ${o.number}.`, [
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
        return this.startNote(turn, msg.text);
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
      buttons(`✅ Listo, quedó en la obligación ${o.number}. ¿Esta actividad sirve también para otra?`, [
        { id: `add:${note.id}`, title: '➕ Otra obligación' },
      ]),
    );
  }

  // -------------------------------------------------------------------------
  // Supports
  // -------------------------------------------------------------------------
  private async receiveSupport(turn: Turn, msg: Inbound): Promise<void> {
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
        .progress?.(turn.user.phone, text(`🔎 Estoy revisando *${filename}*…`))
        .catch(() => undefined);
      segments = await this.deps.ai.classifySupports(
        { label: filename, data: media.data, mime: media.mime },
        [...types.values()].map((t) => ({ code: t.code, label: t.label })),
      );
    }
    const known = segments.filter((g) => g.code && types.has(g.code));
    if (!known.length) return this.askSupportType(turn, msg, types);

    const today = this.deps.clock.today();
    const lines: string[] = [];
    for (const g of known) {
      const t = types.get(g.code!)!;
      const data =
        this.deps.extractPages && (g.fromPage > 1 || segments.length > 1)
          ? await this.deps.extractPages(media.data, g.fromPage, g.toPage)
          : media.data;
      await this.deps.store.addSupport({
        id: this.deps.newId(),
        userId: turn.user.id,
        code: t.code,
        data,
        mime: 'application/pdf',
        filename: `${t.code}.pdf`,
        issuedOn: g.issuedOn ?? today,
        receivedAt: this.deps.clock.now().toISOString(),
      });
      const pages = g.fromPage === g.toPage ? `pág. ${g.fromPage}` : `págs. ${g.fromPage}-${g.toPage}`;
      const limit = t.maxAgeDays ?? (t.bundle ? maxAge : undefined);
      const old = g.issuedOn && limit && addDays(g.issuedOn, limit) < today;
      lines.push(
        `${old ? '⚠️' : '✅'} ${t.label} (${pages})${g.note ? ` · ${g.note}` : ''}${
          old
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
  }

  /** Fallback when the document is not recognized (or is not a PDF): the contractor picks the type. */
  private async askSupportType(turn: Turn, msg: Inbound, types: Map<string, SupportType>): Promise<void> {
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
    this.setFlow(turn, 'support_type', 'pick', { supportId: id });
    const rows = [...types.values()]
      .filter((t) => t.frequency === 'every_period')
      .map((t) => ({ id: `s:${t.code}`, title: t.label }));
    rows.push({ id: 's:EVIDENCIA', title: 'Evidencia de actividad' });
    turn.out.push(text(`📎 Recibí *${msg.media!.filename ?? 'tu documento'}*, pero no reconocí qué es.`));
    turn.out.push(choose('¿Qué documento es?', rows, 0, 'smore'));
  }

  private async onSupportType(turn: Turn, msg: Inbound): Promise<void> {
    const { supportId } = turn.state.context as { supportId: string };
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
    this.reset(turn);
    turn.out.push(text('✅ Guardado. Escribe *¿qué me falta?* para ver tu checklist.'));
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
  ): Promise<{ lines: string[]; missing: SupportType[] }> {
    const types = (await this.deps.store.listSupportTypes(c.entityId)).filter(
      (t) =>
        t.required &&
        t.frequency === 'every_period' &&
        (!t.profiles || (c.profile && t.profiles.includes(c.profile))),
    );
    const supports = await this.deps.store.listSupports(turn.user.id);
    const today = this.deps.clock.today();
    const lines: string[] = [];
    const missing: SupportType[] = [];
    const later = types.filter((t) => t.stage === 'after_signature');
    for (const t of types.filter((x) => x.stage !== 'after_signature')) {
      const ok = supports.some((s) => {
        if (s.code !== t.code) return false;
        const issued = s.issuedOn ?? s.receivedAt.slice(0, 10);
        if (compareIso(issued, today) > 0) return false;
        if (t.maxAgeDays) {
          const age = (Date.parse(today) - Date.parse(issued)) / 86_400_000;
          return age <= t.maxAgeDays;
        }
        return compareIso(issued, p.from) >= 0;
      });
      if (ok) lines.push(`✅ ${t.label}`);
      else {
        missing.push(t);
        lines.push(`❌ ${t.label}${t.officialUrl ? `\n   🔗 ${t.officialUrl}` : ''}`);
      }
    }
    if (later.length)
      lines.push(`📌 Después de la firma del supervisor: ${later.map((t) => t.label).join(', ')}`);
    return { lines, missing };
  }

  private async startStatus(turn: Turn, cs: Contract[]): Promise<void> {
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
      const { lines } = await this.checklist(turn, c, p);
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
  }

  // -------------------------------------------------------------------------
  // Drafting and review
  // -------------------------------------------------------------------------
  private async startDraft(turn: Turn, c: Contract): Promise<void> {
    const p = await this.currentPeriod(c);
    if (!p) {
      turn.out.push(text(`No tienes cuentas pendientes en ${c.shortLabel}.`));
      return;
    }
    const entity = await this.deps.store.getEntity(c.entityId);
    const notes = await this.deps.store.listNotes(c.id, p.from, p.to);
    const existing = await this.deps.store.listDrafts(c.id, p.number);
    const missing: string[] = [];
    turn.out.push(text('✍️ Estoy redactando tu informe con lo que me contaste…'));
    for (const o of c.obligations) {
      const prev = existing.find((d) => d.obligationKey === o.key);
      const mine = notes.filter((n) => noteSupports(n, o.key));
      if (
        prev &&
        (prev.status === 'approved' || prev.status === 'not_applicable') &&
        mine.every((n) => prev.sourceNoteIds.includes(n.id))
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
        `Para la obligación ${o.number} («${clip(o.text, 90)}») no tengo registros este periodo. ¿Qué hiciste?`,
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
        text(`Cuéntame qué hiciste para la obligación ${o.number}. Puedes escribir o mandar un audio.`),
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
  private async startGenerate(turn: Turn, c: Contract, resend = false): Promise<void> {
    const ps = (await this.deps.store.listPeriods(c.id)).sort((a, b) => a.number - b.number);
    const p = resend
      ? [...ps].reverse().find((x) => x.status === 'delivered')
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
      const { missing } = await this.checklist(turn, c, p);
      if (missing.length && !entity.settings.generateWithMissing) {
        turn.out.push(
          text(
            `⚠️ Me faltan estos soportes para generar tu cuenta:\n${missing
              .map((m) => `❌ ${m.label}${m.officialUrl ? `\n   🔗 ${m.officialUrl}` : ''}`)
              .join('\n')}\n\nEnvíamelos y vuelve a escribir *generar*.`,
          ),
        );
        return;
      }
    }
    turn.out.push(text('⏳ Estoy generando tus documentos, dame un momento…'));
    if (!resend) await this.savePeriodStatus(c, p, 'generating');
    const files = await this.deps.generator.generate(c.id, p.number);
    for (const group of ['pdf', 'docx', 'zip'] as const) {
      for (const f of files.filter((x) => x.group === group)) {
        turn.out.push({ type: 'document', filename: f.filename, mime: f.mime, data: f.data });
      }
    }
    if (!resend) await this.savePeriodStatus(c, p, 'delivered');
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
    const newPeriods: Period[] = rebuilt.map((r) => {
      const schedule = c.schedule?.find((s) => s.paymentNumber === r.number);
      const resolved = resolvePeriodAmount({
        monthlyValue: c.monthlyValue,
        period: r,
        ...(schedule ? { schedule } : {}),
      });
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
