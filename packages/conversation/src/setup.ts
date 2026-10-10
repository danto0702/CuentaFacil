import {
  buildPeriods,
  formatCOP,
  formatDdMmYyyy,
  type IsoDate,
  type PeriodMode,
  resolvePeriodAmount,
  toIso,
} from '@cuentasbot/shared';
import { BRAND, SIGNATURE } from './brand.js';
import type { ContractExtraction, ConversationState, Entity, Period, RegistryEntry, User } from './domain.js';
import type { Deps, Inbound, Outgoing } from './ports.js';
import { clip } from './text.js';

/** Conversation flow name for contract setup (plan v5 §2.1). */
export const SETUP_FLOW = 'setup';
export const POLICY_VERSION = '1.1';

export interface SetupTurn {
  user: User;
  state: ConversationState;
  out: Outgoing[];
}

interface SetupCtx {
  contractDocId?: string;
  clausesDocId?: string;
  extraction?: ContractExtraction;
  entityId?: string;
  startDate?: IsoDate;
  endDate?: IsoDate;
  mode?: PeriodMode;
  requiresCertification?: boolean;
  priorCount?: number;
  /** Where the start date came from: the entity contract registry or the contractor. */
  startFromRegistry?: boolean;
  docIssuedIn?: string;
  /** Version of applyEntityRules already applied to `extraction`. */
  rules?: number;
}

/** Bump when applyEntityRules changes, so in-flight setups are re-checked on confirmation. */
const RULES_VERSION = 1;

/** Contract code as kept in the entity registry: first digit group without leading zeros ("CPS-0330-2026" → "330"). */
export function registryCode(contractNumber: string): string | null {
  const digits = contractNumber.match(/\d+/)?.[0];
  return digits ? String(Number(digits)) : null;
}

// Warnings about data the entity rules or the setup questions already settle.
const SETTLED_WARNING = /supervisor|\bNIT\b|expedici|acta de inicio|fecha de inicio/i;

/**
 * Applies what is known about the entity over the AI reading (plan v5 §2.1): reports use only the
 * specific obligations; the supervisor and NIT come from the entity; the start date comes from the
 * entity contract registry or, if absent, is asked to the contractor.
 */
export function applyEntityRules(
  e: ContractExtraction,
  entity: Entity,
  registry: RegistryEntry | null,
): ContractExtraction {
  return {
    ...e,
    entity: { ...e.entity, name: entity.name, nit: entity.nit },
    supervisor: entity.settings.contractDefaults.supervisor ?? e.supervisor,
    startDate: registry?.startDate ?? null,
    obligations: e.obligations.filter((o) => o.kind === 'specific'),
    warnings: e.warnings.filter((w) => !SETTLED_WARNING.test(w)),
  };
}

const text = (t: string): Outgoing => ({ type: 'text', text: t });
const buttons = (body: string, items: { id: string; title: string }[]): Outgoing => ({
  type: 'buttons',
  text: body,
  buttons: items,
});

const isPdf = (mime: string) => mime.split(';')[0]?.trim() === 'application/pdf';
const WORD_MIMES = new Set([
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
]);
const mask = (v: string | null | undefined) =>
  v ? `****${v.replace(/\D/g, '').slice(-4)}` : 'no la encontré';

/** "06/07/2026", "6-7-2026" or "2026-07-06" → IsoDate. */
export function parseDayMonthYear(input: string): IsoDate | null {
  const s = input.trim();
  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  const dmy = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  const [year, month, day] = iso
    ? [Number(iso[1]), Number(iso[2]), Number(iso[3])]
    : dmy
      ? [Number(dmy[3]), Number(dmy[2]), Number(dmy[1])]
      : [0, 0, 0];
  if (!year || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const d = new Date(Date.UTC(year, month - 1, day));
  if (d.getUTCMonth() !== month - 1) return null;
  return toIso({ year, month, day });
}

/** Registration (consent) and contract setup by documents. */
export class SetupFlow {
  constructor(private readonly deps: Deps) {}

  /** First contact from an unregistered number: nothing is stored until the person accepts. */
  welcome(): Outgoing[] {
    return [
      text(
        `👋 ¡Hola! Soy ${SIGNATURE}.\n\nTe acompaño a preparar tus cuentas de cobro de contratos de prestación de servicios con entidades públicas:\n📝 Me cuentas lo que haces cada día (texto, audio o fotos).\n📎 Te recuerdo la planilla, los antecedentes y las afiliaciones.\n📄 Al cierre te entrego tu informe de actividades y el borrador del informe de supervisión, listos para firmar.`,
      ),
      {
        type: 'cta_url',
        text: 'Para continuar necesito que aceptes nuestra política de tratamiento de datos personales (Ley 1581 de 2012).',
        button: 'Ver política',
        url: BRAND.privacyPolicy,
      },
      buttons('¿Aceptas la política de tratamiento de datos?', [
        { id: 'consent:yes', title: 'Acepto' },
        { id: 'consent:no', title: 'No acepto' },
      ]),
    ];
  }

  declined(): Outgoing[] {
    return [
      text('Entendido. No guardé ningún dato tuyo. Si cambias de opinión, escríbeme cuando quieras. 🙌'),
    ];
  }

  private ctx(turn: SetupTurn): SetupCtx {
    return turn.state.context as SetupCtx;
  }

  private go(turn: SetupTurn, step: string, patch: Partial<SetupCtx> = {}): void {
    turn.state.flow = SETUP_FLOW;
    turn.state.step = step;
    turn.state.context = { ...turn.state.context, ...patch };
  }

  start(turn: SetupTurn, intro: 'consent' | 'first' | 'another' = 'consent'): void {
    turn.state.context = {};
    this.go(turn, 'contract_doc');
    const opening = {
      consent: '✅ ¡Gracias! Ahora configuremos tu contrato.',
      first: '📄 Para empezar necesito configurar tu contrato.',
      another: '📄 Configuremos otro contrato.',
    }[intro];
    turn.out.push(
      text(
        `${opening}\n\nEnvíame el *PDF del contrato* que descargas de SECOP II (el que dice *CO1.PCCNTR…*). Usa 📎 → Documento.`,
      ),
    );
  }

  async handle(turn: SetupTurn, msg: Inbound): Promise<void> {
    switch (turn.state.step) {
      case 'contract_doc':
        return this.onContractDoc(turn, msg);
      case 'clauses_doc':
        return this.onClausesDoc(turn, msg);
      case 'confirm':
        return this.onConfirm(turn, msg);
      case 'correct_text':
        return this.onCorrection(turn, msg);
      case 'doc_issued_in':
        return this.onDocIssuedIn(turn, msg);
      case 'start_date':
        return this.onStartDate(turn, msg);
      case 'end_date':
        return this.onEndDate(turn, msg);
      case 'mode':
        return this.onMode(turn, msg);
      case 'certification':
        return this.onCertification(turn, msg);
      case 'prior':
        return this.onPrior(turn, msg);
      case 'prior_count':
        return this.onPriorCount(turn, msg);
      case 'signature':
        return this.onSignature(turn, msg);
      default:
        return this.start(turn);
    }
  }

  // ---------------------------------------------------------------------------
  // Documents
  // ---------------------------------------------------------------------------
  private async saveDocument(turn: SetupTurn, msg: Inbound, code: string): Promise<string | null> {
    if (msg.kind !== 'document' || !msg.media || !isPdf(msg.media.mime)) return null;
    const id = this.deps.newId();
    await this.deps.store.addSupport({
      id,
      userId: turn.user.id,
      code,
      data: msg.media.data,
      mime: msg.media.mime,
      filename: msg.media.filename ?? `${code}.pdf`,
      receivedAt: this.deps.clock.now().toISOString(),
    });
    return id;
  }

  private async onContractDoc(turn: SetupTurn, msg: Inbound): Promise<void> {
    const id = await this.saveDocument(turn, msg, 'CONTRATO_SECOP');
    if (!id) {
      turn.out.push(text('Necesito el contrato en *PDF*. Envíalo como documento (📎 → Documento).'));
      return;
    }
    this.go(turn, 'clauses_doc', { contractDocId: id });
    turn.out.push(
      text(
        '✅ Recibí el contrato. Ahora envíame el *clausulado* en PDF (el documento con las obligaciones y la forma de pago).',
      ),
    );
  }

  private async onClausesDoc(turn: SetupTurn, msg: Inbound): Promise<void> {
    const id = await this.saveDocument(turn, msg, 'CLAUSULADO');
    if (!id) {
      turn.out.push(text('Necesito el clausulado en *PDF*. Envíalo como documento (📎 → Documento).'));
      return;
    }
    const ctx = this.ctx(turn);
    const supports = await this.deps.store.listSupports(turn.user.id);
    const docs = [
      { id: ctx.contractDocId, label: 'Contrato SECOP II' },
      { id, label: 'Clausulado' },
    ].flatMap(({ id: docId, label }) => {
      const s = supports.find((x) => x.id === docId);
      return s ? [{ label, data: s.data, mime: s.mime }] : [];
    });
    await this.deps
      .progress?.(
        turn.user.phone,
        text('⏳ Recibí el clausulado. Estoy leyendo tus documentos; esto puede tardar uno o dos minutos…'),
      )
      .catch(() => undefined);
    const extraction = await this.deps.ai.extractContract(docs);
    const entity = await this.deps.store.findEntity(extraction.entity.nit, extraction.entity.name);
    if (!entity) {
      turn.state.flow = 'idle';
      turn.state.step = 'start';
      turn.state.context = {};
      turn.out.push(
        text(
          `Leí tu contrato con *${extraction.entity.name}*. Esa entidad todavía no está configurada en ${BRAND.service}; por ahora trabajamos con la ESE Hospital Regional Noroccidental. Una persona de nuestro equipo te va a contactar por aquí. 🙏`,
        ),
      );
      return;
    }
    this.go(turn, 'confirm', { clausesDocId: id, entityId: entity.id });
    await this.checkAndShow(turn, extraction, entity);
  }

  /** Applies the entity rules, stores the result and shows the summary for confirmation. */
  private async checkAndShow(turn: SetupTurn, raw: ContractExtraction, entity: Entity): Promise<void> {
    const code = registryCode(raw.number) ?? registryCode(raw.fullNumber);
    const registry =
      code && raw.contractor.docNumber
        ? await this.deps.store.findRegistryEntry(entity.id, code, raw.contractor.docNumber)
        : null;
    const extraction = applyEntityRules(raw, entity, registry);
    this.go(turn, 'confirm', {
      extraction,
      startFromRegistry: Boolean(registry?.startDate),
      rules: RULES_VERSION,
    });
    this.showSummary(turn, extraction, entity.name, Boolean(registry?.startDate));
  }

  private showSummary(
    turn: SetupTurn,
    e: ContractExtraction,
    entityName: string,
    fromRegistry: boolean,
  ): void {
    const lines = [
      '📋 *Esto es lo que leí de tus documentos:*',
      `• Contrato: ${e.fullNumber}${e.secopId ? ` (SECOP ${e.secopId})` : ''}`,
      `• Entidad: ${entityName}`,
      `• Objeto: ${clip(e.object, 220)}`,
      `• Valor total: ${formatCOP(e.totalValue)}${e.monthlyValue ? ` · mensual ${formatCOP(e.monthlyValue)}` : ''}${e.paymentsCount ? ` · ${e.paymentsCount} pagos` : ''}`,
      `• Plazo: ${e.termText}${e.endDate ? `, hasta el ${formatDdMmYyyy(e.endDate)}` : ''}`,
      `• Inicio (acta de inicio): ${e.startDate ? `${formatDdMmYyyy(e.startDate)}${fromRegistry ? ' (base de contratos de la entidad)' : ''}` : 'no lo encontré en la base de contratos de la entidad, te lo pregunto en un momento'}`,
      `• Supervisor: ${e.supervisor ? `${e.supervisor.name} (${e.supervisor.title})` : 'no lo encontré'}`,
      `• A nombre de: ${e.contractor.fullName}, C.C. ${mask(e.contractor.docNumber)}`,
      `• Cuenta: ${[e.contractor.accountType, e.contractor.bankName].filter(Boolean).join(' ') || 'no la encontré'} ${mask(e.contractor.accountNumber)}`,
      `• Obligaciones específicas: ${e.obligations.length}`,
      ...(e.warnings.length ? ['', ...e.warnings.map((w) => `⚠️ ${w}`)] : []),
    ];
    turn.out.push(text(lines.join('\n')));
    // Obligations in chunks under WhatsApp's 4096-character limit.
    let chunk = '*Obligaciones (como quedarán en tus informes):*';
    for (const o of e.obligations) {
      const line = `\n${o.number}. ${clip(o.text, 300)}`;
      if (chunk.length + line.length > 3500) {
        turn.out.push(text(chunk));
        chunk = '';
      }
      chunk += line;
    }
    if (chunk.trim()) turn.out.push(text(chunk.trim()));
    turn.out.push(
      buttons('¿Está todo bien?', [
        { id: 'setup:ok', title: '✅ Todo bien' },
        { id: 'setup:fix', title: '✏️ Corregir algo' },
      ]),
    );
  }

  private async onConfirm(turn: SetupTurn, msg: Inbound): Promise<void> {
    if (msg.replyId === 'setup:fix') {
      this.go(turn, 'correct_text');
      turn.out.push(
        text(
          'Escríbeme qué hay que corregir. Por ejemplo: «el valor mensual es $4.000.000» o «la obligación 3 dice…».',
        ),
      );
      return;
    }
    if (msg.replyId !== 'setup:ok') {
      turn.out.push(
        buttons('¿Está todo bien con los datos de tu contrato?', [
          { id: 'setup:ok', title: '✅ Todo bien' },
          { id: 'setup:fix', title: '✏️ Corregir algo' },
        ]),
      );
      return;
    }
    const ctx = this.ctx(turn);
    if (ctx.rules !== RULES_VERSION) {
      // Setup started before these rules existed: re-check and show the summary again.
      const entity = await this.deps.store.getEntity(ctx.entityId!);
      return this.checkAndShow(turn, ctx.extraction!, entity);
    }
    return this.afterConfirm(turn);
  }

  /** After the summary: place of issue of the ID (if missing), then the dates. */
  private afterConfirm(turn: SetupTurn): void {
    const ctx = this.ctx(turn);
    const e = ctx.extraction!;
    if (!ctx.docIssuedIn && !e.contractor.docIssuedIn) {
      this.go(turn, 'doc_issued_in');
      turn.out.push(
        text('🪪 ¿En qué municipio fue *expedida tu cédula*? Escríbelo así: Ábrego, Norte de Santander'),
      );
      return;
    }
    if (!e.startDate) return this.askStartDate(turn);
    this.go(turn, 'mode', { startDate: e.startDate });
    return this.afterDates(turn);
  }

  private async onDocIssuedIn(turn: SetupTurn, msg: Inbound): Promise<void> {
    const place = msg.text?.trim().replace(/\s+/g, ' ');
    if (!place || place.length < 3 || place.length > 80) {
      turn.out.push(
        text('Escríbeme el municipio de expedición de tu cédula, por ejemplo: Ábrego, Norte de Santander'),
      );
      return;
    }
    this.go(turn, 'doc_issued_in', { docIssuedIn: place });
    return this.afterConfirm(turn);
  }

  private async onCorrection(turn: SetupTurn, msg: Inbound): Promise<void> {
    if (!msg.text?.trim()) {
      turn.out.push(text('Escríbeme en un mensaje de texto qué hay que corregir.'));
      return;
    }
    const ctx = this.ctx(turn);
    const corrected = await this.deps.ai.correctExtraction(ctx.extraction!, msg.text);
    const entity = await this.deps.store.getEntity(ctx.entityId!);
    // The contractor's correction wins, except for what the entity rules fix (supervisor, NIT, registry date).
    const registryDate = ctx.startFromRegistry ? ctx.extraction!.startDate : null;
    const extraction = {
      ...applyEntityRules(
        corrected,
        entity,
        registryDate ? { startDate: registryDate, termDays: null, initialValue: null } : null,
      ),
      ...(registryDate ? {} : { startDate: corrected.startDate }),
    };
    this.go(turn, 'confirm', { extraction, rules: RULES_VERSION });
    this.showSummary(turn, extraction, entity.name, Boolean(registryDate));
  }

  // ---------------------------------------------------------------------------
  // Dates and choices
  // ---------------------------------------------------------------------------
  private askStartDate(turn: SetupTurn): void {
    this.go(turn, 'start_date');
    turn.out.push(
      text('📅 ¿Cuál es la fecha del *acta de inicio* de tu contrato? Escríbela así: 06/07/2026'),
    );
  }

  private async onStartDate(turn: SetupTurn, msg: Inbound): Promise<void> {
    const d = msg.text ? parseDayMonthYear(msg.text) : null;
    if (!d) {
      turn.out.push(text('No entendí la fecha. Escríbela así: 06/07/2026'));
      return;
    }
    this.go(turn, 'mode', { startDate: d });
    return this.afterDates(turn);
  }

  private async onEndDate(turn: SetupTurn, msg: Inbound): Promise<void> {
    const d = msg.text ? parseDayMonthYear(msg.text) : null;
    const start = this.ctx(turn).startDate!;
    if (!d || d < start) {
      turn.out.push(text('No entendí la fecha de terminación. Escríbela así: 30/09/2026'));
      return;
    }
    this.go(turn, 'mode', { endDate: d });
    return this.afterDates(turn);
  }

  private afterDates(turn: SetupTurn): void {
    const ctx = this.ctx(turn);
    const end = ctx.endDate ?? ctx.extraction?.endDate;
    if (!end) {
      this.go(turn, 'end_date');
      turn.out.push(text('📅 ¿Hasta qué fecha va tu contrato? Escríbela así: 30/09/2026'));
      return;
    }
    this.go(turn, 'mode', { endDate: end });
    turn.out.push(
      buttons(
        '🗓️ ¿Cómo cortas tus cuentas?\n• *Fin de mes:* del 1 al último día de cada mes.\n• *Fecha a fecha:* desde el día de inicio hasta el día anterior del mes siguiente (ej. 24 al 23).\nPuedes cambiarlo después.',
        [
          { id: 'mode:month_end', title: 'Fin de mes' },
          { id: 'mode:date_to_date', title: 'Fecha a fecha' },
        ],
      ),
    );
  }

  private async onMode(turn: SetupTurn, msg: Inbound): Promise<void> {
    const mode =
      msg.replyId === 'mode:date_to_date'
        ? 'date_to_date'
        : msg.replyId === 'mode:month_end'
          ? 'month_end'
          : null;
    if (!mode) return this.afterDates(turn);
    this.go(turn, 'certification', { mode });
    turn.out.push(
      buttons(
        '📑 ¿Tu cuenta de cobro necesita *certificación de cumplimiento* (la expide tu supervisor o coordinador)?',
        [
          { id: 'cert:yes', title: 'Sí la necesita' },
          { id: 'cert:no', title: 'No la necesita' },
        ],
      ),
    );
  }

  private async onCertification(turn: SetupTurn, msg: Inbound): Promise<void> {
    if (msg.replyId !== 'cert:yes' && msg.replyId !== 'cert:no') {
      turn.out.push(
        buttons('¿Tu cuenta necesita certificación de cumplimiento?', [
          { id: 'cert:yes', title: 'Sí la necesita' },
          { id: 'cert:no', title: 'No la necesita' },
        ]),
      );
      return;
    }
    this.go(turn, 'prior', { requiresCertification: msg.replyId === 'cert:yes' });
    turn.out.push(
      buttons('¿Ya cobraste informes de este contrato?', [
        { id: 'prior:none', title: 'Es el primero' },
        { id: 'prior:some', title: 'Ya cobré informes' },
      ]),
    );
  }

  private async onPrior(turn: SetupTurn, msg: Inbound): Promise<void> {
    if (msg.replyId === 'prior:some') {
      this.go(turn, 'prior_count');
      turn.out.push(text('¿Cuántos informes ya cobraste? Escribe solo el número (por ejemplo: 2).'));
      return;
    }
    if (msg.replyId !== 'prior:none') {
      turn.out.push(
        buttons('¿Ya cobraste informes de este contrato?', [
          { id: 'prior:none', title: 'Es el primero' },
          { id: 'prior:some', title: 'Ya cobré informes' },
        ]),
      );
      return;
    }
    this.go(turn, 'signature', { priorCount: 0 });
    this.askSignature(turn);
  }

  private async onPriorCount(turn: SetupTurn, msg: Inbound): Promise<void> {
    const n = Number(msg.text?.trim());
    if (!Number.isInteger(n) || n < 0 || n > 60) {
      turn.out.push(text('Escribe solo el número de informes que ya cobraste (por ejemplo: 2).'));
      return;
    }
    this.go(turn, 'signature', { priorCount: n });
    if (n > 0) {
      turn.out.push(
        text(
          '📎 Si tienes tu último informe en Word o PDF, envíamelo cuando quieras: así copio tu forma de redactar. No es obligatorio.',
        ),
      );
    }
    this.askSignature(turn);
  }

  private askSignature(turn: SetupTurn): void {
    turn.out.push(
      buttons(
        '✍️ ¿Quieres que tus informes vayan firmados? Envíame una *foto de tu firma* en una hoja blanca. Si prefieres firmarlos a mano, toca *Omitir*.',
        [{ id: 'sig:skip', title: 'Omitir' }],
      ),
    );
  }

  private async onSignature(turn: SetupTurn, msg: Inbound): Promise<void> {
    if (msg.kind === 'document' && msg.media && (isPdf(msg.media.mime) || WORD_MIMES.has(msg.media.mime))) {
      await this.deps.store.addSupport({
        id: this.deps.newId(),
        userId: turn.user.id,
        code: 'INFORME_ANTERIOR',
        data: msg.media.data,
        mime: msg.media.mime,
        filename: msg.media.filename ?? 'informe-anterior',
        receivedAt: this.deps.clock.now().toISOString(),
      });
      turn.out.push(text('✅ Guardé tu informe anterior.'));
      this.askSignature(turn);
      return;
    }
    if (msg.kind === 'image' && msg.media) {
      await this.deps.store.addSupport({
        id: this.deps.newId(),
        userId: turn.user.id,
        code: 'FIRMA',
        data: msg.media.data,
        mime: msg.media.mime,
        filename: 'firma.jpg',
        receivedAt: this.deps.clock.now().toISOString(),
      });
      turn.out.push(
        text(
          '✅ Guardé tu firma. La pondré solo en tus propios informes; puedes pedirme borrarla cuando quieras.',
        ),
      );
      return this.finish(turn);
    }
    if (msg.replyId === 'sig:skip') return this.finish(turn);
    this.askSignature(turn);
  }

  // ---------------------------------------------------------------------------
  // Finish
  // ---------------------------------------------------------------------------
  private async finish(turn: SetupTurn): Promise<void> {
    const { store } = this.deps;
    const ctx = this.ctx(turn);
    const e = ctx.extraction!;
    const user: User = {
      ...turn.user,
      fullName: e.contractor.fullName || turn.user.fullName,
      docNumber: e.contractor.docNumber || turn.user.docNumber,
      docIssuedIn: ctx.docIssuedIn ?? e.contractor.docIssuedIn ?? turn.user.docIssuedIn,
      bankName: e.contractor.bankName ?? turn.user.bankName,
      accountType: e.contractor.accountType ?? turn.user.accountType,
      accountNumber: e.contractor.accountNumber ?? turn.user.accountNumber,
    };
    await store.saveUserProfile(user);
    turn.user = user;

    const startDate = ctx.startDate!;
    const endDate = ctx.endDate!;
    const contract = await store.createContract({
      userId: user.id,
      entityId: ctx.entityId!,
      extraction: e,
      startDate,
      endDate,
      periodMode: ctx.mode ?? 'month_end',
      requiresCertification: ctx.requiresCertification ?? false,
      shortLabel: clip(`${e.number} ${e.processArea ?? ''}`.trim(), 20),
    });

    const prior = ctx.priorCount ?? 0;
    const periods: Period[] = buildPeriods({
      contractStart: startDate,
      contractEnd: endDate,
      mode: contract.periodMode,
    }).map((r) => {
      const schedule = contract.schedule?.find((s) => s.paymentNumber === r.number);
      const res = resolvePeriodAmount({
        monthlyValue: contract.monthlyValue,
        period: r,
        ...(schedule ? { schedule } : {}),
      });
      return {
        contractId: contract.id,
        number: r.number,
        from: r.from,
        to: r.to,
        amount: res.amount,
        amountSource: res.source,
        executionPct: res.executionPct,
        status: r.number <= prior ? 'delivered' : 'collecting',
      };
    });
    await store.savePeriods(contract.id, periods);

    turn.state.flow = 'idle';
    turn.state.step = 'start';
    turn.state.context = {};
    const next = periods.find((p) => p.status !== 'delivered');
    turn.out.push(
      text(
        `🎉 ¡Listo! Tu contrato *${contract.fullNumber}* quedó configurado: ${periods.length} cuentas (${
          contract.periodMode === 'month_end' ? 'corte a fin de mes' : 'corte fecha a fecha'
        }).${next ? `\nTu próxima cuenta va del ${formatDdMmYyyy(next.from)} al ${formatDdMmYyyy(next.to)}.` : ''}\n\nDurante el piloto la configuración no tiene costo.\n\nDesde ya cuéntame lo que haces cada día: texto, audio o fotos. Yo lo anoto en la obligación que corresponde. Escribe *menú* para ver todas las opciones.`,
      ),
    );
  }
}

/** Domain contract built from a confirmed extraction (shared by the stores). */
export function contractFromSetup(
  id: string,
  input: import('./domain.js').NewContract,
): import('./domain.js').Contract {
  const e = input.extraction;
  const specificOrGeneral = (k: 'specific' | 'general') => e.obligations.filter((o) => o.kind === k);
  const obligations = [...specificOrGeneral('specific'), ...specificOrGeneral('general')].map((o) => ({
    key: `${o.kind}-${o.number}`,
    number: o.number,
    kind: o.kind,
    text: o.text,
  }));
  const paymentsCount = e.paymentsCount ?? (e.schedule.length || 1);
  const monthlyValue = e.monthlyValue ?? Math.round(e.totalValue / paymentsCount);
  return {
    id,
    userId: input.userId,
    entityId: input.entityId,
    number: e.number,
    fullNumber: e.fullNumber,
    year: e.fullNumber.match(/(20\d{2})/)?.[1] ?? input.startDate.slice(0, 4),
    secopId: e.secopId ?? '',
    object: e.object,
    shortLabel: input.shortLabel,
    processName: e.processArea ?? '',
    startDate: input.startDate,
    endDate: input.endDate,
    termText: e.termText,
    totalValue: e.totalValue,
    monthlyValue,
    paymentsCount,
    reportNumberFormat: 'NN DE NN',
    periodMode: input.periodMode,
    supervisor: e.supervisor ?? { name: '', title: '' },
    obligations,
    contractorDuties: [],
    ...(e.schedule.length ? { schedule: e.schedule } : {}),
  };
}
