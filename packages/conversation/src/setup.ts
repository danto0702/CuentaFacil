import {
  buildPeriods,
  formatCOP,
  formatDdMmYyyy,
  type IsoDate,
  type PeriodMode,
  planPeriodAmounts,
  toIso,
} from '@cuentasbot/shared';
import { allyWelcome } from './ally.js';
import { BRAND, SIGNATURE } from './brand.js';
import type { ContractExtraction, ConversationState, Entity, Period, RegistryEntry, User } from './domain.js';
import type { Deps, Inbound, InstitutionDocuments, Outgoing } from './ports.js';
import { clip } from './text.js';

/** Conversation flow name for contract setup (plan v5 §2.1). */
export const SETUP_FLOW = 'setup';
export const POLICY_VERSION = '1.1';
/** Terms of service in force; users who accepted an older version are asked again (section 15). */
export const TERMS_VERSION = '1.1';

export interface SetupTurn {
  user: User;
  /** The gestor writing for `user` (ADR-042); progress messages go to them. */
  actor?: User;
  state: ConversationState;
  out: Outgoing[];
}

/** Context that survives the setup: the person a gestor is working for (ADR-042). */
const keepActing = (ctx: Record<string, unknown>): Record<string, unknown> =>
  ctx.actingFor ? { actingFor: ctx.actingFor } : {};

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
  otherName?: string;
  /** Codes chosen from INSTITUTION_DOCS, plus documents the contractor wrote. */
  otherDocs?: string[];
  otherCustom?: string[];
  /** Model uploaded for each document Pascal generates (code → support id). */
  otherModels?: Record<string, string>;
}

/**
 * Documents an institution may ask for in a cuenta de cobro (ADR-040). The ones Pascal generates need
 * a model from the contractor to configure the institution; the rest only tell Pascal what to ask for.
 */
export const INSTITUTION_DOCS: { code: string; label: string; generated?: true }[] = [
  { code: 'INFORME_ACTIVIDADES', label: 'Informe de actividades', generated: true },
  { code: 'INFORME_SUPERVISION', label: 'Informe de supervisión', generated: true },
  { code: 'CUENTA_COBRO', label: 'Cuenta de cobro', generated: true },
  { code: 'PILA', label: 'Planilla de seguridad social (PILA)' },
  { code: 'POLICIA', label: 'Antecedentes judiciales (Policía)' },
  { code: 'PROCURADURIA', label: 'Antecedentes disciplinarios (Procuraduría)' },
  { code: 'CONTRALORIA', label: 'Antecedentes fiscales (Contraloría)' },
  { code: 'RNMC', label: 'Medidas correctivas (RNMC)' },
  { code: 'EPS', label: 'Certificado de afiliación a EPS' },
  { code: 'ARL', label: 'Certificado de afiliación a ARL' },
  { code: 'AFP', label: 'Certificado de afiliación a pensión' },
  {
    code: 'CERT_CUMPLIMIENTO',
    label: 'Certificado de cumplimiento (lo expide una dependencia o coordinación)',
  },
  { code: 'RUT', label: 'RUT' },
  { code: 'CUENTA_BANCARIA', label: 'Certificación bancaria' },
  { code: 'CEDULA', label: 'Copia de la cédula' },
];

/** Checklist row of an entity (support_types), as the panel stores it. */
export interface SupportTypeSeed {
  code: string;
  label: string;
  required: boolean;
  frequency: 'every_period' | 'once' | 'at_start';
  max_age_days: number | null;
  bundle: 'ANTECEDENTES' | 'AFILIACIONES' | null;
  bundle_order: number | null;
  official_url: string | null;
  instructions: string | null;
  stage: 'before_generation' | 'after_signature';
}

/** Usual settings of each support an institution may ask for (same as HRNO's checklist). */
const SUPPORT_DEFAULTS: Record<string, Omit<SupportTypeSeed, 'code' | 'label' | 'required'>> = {
  PILA: {
    frequency: 'every_period',
    max_age_days: null,
    bundle: null,
    bundle_order: null,
    official_url: null,
    instructions: 'Descarga la planilla pagada del mes en curso desde tu operador.',
    stage: 'before_generation',
  },
  POLICIA: {
    frequency: 'every_period',
    max_age_days: 30,
    bundle: 'ANTECEDENTES',
    bundle_order: 1,
    official_url: 'https://antecedentes.policia.gov.co:7005/WebJudicial/',
    instructions:
      'Acepta los términos, elige Cédula de Ciudadanía, escribe tu número, marca «No soy un robot» y pulsa Consultar. Guarda el resultado como PDF (Compartir → Imprimir → Guardar como PDF).',
    stage: 'before_generation',
  },
  RNMC: {
    frequency: 'every_period',
    max_age_days: 30,
    bundle: 'ANTECEDENTES',
    bundle_order: 2,
    official_url: 'https://srvcnpc.policia.gov.co/PSC/frm_cnp_consulta.aspx',
    instructions:
      'Elige el tipo de documento, escribe tu número, resuelve la verificación y pulsa Consultar. Descarga o imprime el resultado como PDF.',
    stage: 'before_generation',
  },
  PROCURADURIA: {
    frequency: 'every_period',
    max_age_days: 30,
    bundle: 'ANTECEDENTES',
    bundle_order: 3,
    official_url: 'https://www.procuraduria.gov.co/Pages/Generacion-de-antecedentes.aspx',
    instructions:
      'Elige el certificado Ordinario y Cédula de Ciudadanía, escribe tu número, responde la pregunta de verificación y pulsa Generar. Descarga el PDF.',
    stage: 'before_generation',
  },
  CONTRALORIA: {
    frequency: 'every_period',
    max_age_days: 30,
    bundle: 'ANTECEDENTES',
    bundle_order: 4,
    official_url: 'https://www.contraloria.gov.co/web/guest/persona-natural',
    instructions:
      'Entra a Certificado Persona Natural, elige Cédula de Ciudadanía, escribe tu número, resuelve la verificación y pulsa Buscar. Se descarga el PDF.',
    stage: 'before_generation',
  },
  EPS: {
    frequency: 'every_period',
    max_age_days: 30,
    bundle: 'AFILIACIONES',
    bundle_order: 1,
    official_url: null,
    instructions: 'Descárgalo del portal de tu EPS.',
    stage: 'before_generation',
  },
  ARL: {
    frequency: 'every_period',
    max_age_days: 30,
    bundle: 'AFILIACIONES',
    bundle_order: 2,
    official_url: null,
    instructions: 'Pídelo a tu ARL; debe cubrir todo el periodo del contrato.',
    stage: 'before_generation',
  },
  AFP: {
    frequency: 'every_period',
    max_age_days: 30,
    bundle: 'AFILIACIONES',
    bundle_order: 3,
    official_url: null,
    instructions: 'Descárgalo del portal de tu fondo de pensiones.',
    stage: 'before_generation',
  },
  // Goes with the documents of the account in course, every month (when the institution asks for it).
  CERT_CUMPLIMIENTO: {
    frequency: 'every_period',
    max_age_days: null,
    bundle: null,
    bundle_order: null,
    official_url: null,
    instructions:
      'Pídeselo a la dependencia o coordinación que lo expide para la cuenta de este periodo y envíamelo con los demás soportes; con él sé cuánto cobrar.',
    stage: 'before_generation',
  },
  RUT: {
    frequency: 'at_start',
    max_age_days: null,
    bundle: null,
    bundle_order: null,
    official_url: null,
    instructions: null,
    stage: 'before_generation',
  },
  CUENTA_BANCARIA: {
    frequency: 'at_start',
    max_age_days: null,
    bundle: null,
    bundle_order: null,
    official_url: null,
    instructions: null,
    stage: 'before_generation',
  },
  CEDULA: {
    frequency: 'at_start',
    max_age_days: null,
    bundle: null,
    bundle_order: null,
    official_url: null,
    instructions: null,
    stage: 'before_generation',
  },
};

/**
 * The checklist of a new entity from what the contractor chose in "Otra institución" (ADR-040): the
 * supports with their usual settings, and documents they wrote as required every period. The
 * documents Pascal generates are not supports (they are the entity's formats).
 */
export function supportTypesFromRequest(docs: InstitutionDocuments | null | undefined): SupportTypeSeed[] {
  const out: SupportTypeSeed[] = [];
  const used = new Set<string>();
  for (const d of docs?.required ?? []) {
    if (d.code && INSTITUTION_DOCS.find((x) => x.code === d.code)?.generated) continue;
    const defaults = d.code ? SUPPORT_DEFAULTS[d.code] : undefined;
    if (d.code && defaults) {
      if (used.has(d.code)) continue;
      used.add(d.code);
      out.push({ code: d.code, label: d.label, required: true, ...defaults });
      continue;
    }
    // A document the contractor wrote: a code from its name ("paz y salvo" → PAZ_Y_SALVO).
    const base =
      d.label
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 30) || 'OTRO';
    let code = /^[A-Z]/.test(base) ? base : `DOC_${base}`;
    for (let i = 2; used.has(code); i++) code = `${base}_${i}`;
    used.add(code);
    out.push({
      code,
      label: d.label.charAt(0).toUpperCase() + d.label.slice(1),
      required: true,
      frequency: 'every_period',
      max_age_days: null,
      bundle: null,
      bundle_order: null,
      official_url: null,
      instructions: null,
      stage: 'before_generation',
    });
  }
  return out;
}

/** "1, 2, 4-6, otro: paz y salvo" → chosen codes and documents written by the contractor. */
export function parseDocChoice(input: string): { codes: string[]; custom: string[] } | null {
  const [numbersPart, ...rest] = input.split(/\botros?\s*:/i);
  const codes = new Set<string>();
  for (const m of (numbersPart ?? '').matchAll(/(\d{1,2})(?:\s*(?:-|a)\s*(\d{1,2}))?/g)) {
    const a = Number(m[1]);
    const b = m[2] ? Number(m[2]) : a;
    for (let i = Math.min(a, b); i <= Math.max(a, b); i++) {
      const d = INSTITUTION_DOCS[i - 1];
      if (d) codes.add(d.code);
    }
  }
  const custom = rest
    .join(',')
    .split(/[,;\n]/)
    .map((x) => x.trim())
    .filter((x) => x.length >= 3)
    .map((x) => x.slice(0, 80));
  if (!codes.size && !custom.length) return null;
  return { codes: INSTITUTION_DOCS.filter((d) => codes.has(d.code)).map((d) => d.code), custom };
}

const docLabel = (code: string) => INSTITUTION_DOCS.find((d) => d.code === code)?.label ?? code;

/**
 * Normalized institution name to recognize the same institution written differently:
 * "E.S.E. Hospital San José de Ocaña" → "HOSPITAL SAN JOSE OCANA".
 */
export function institutionKey(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(
      (w) =>
        w &&
        ![
          'E',
          'S',
          'ESE',
          'EMPRESA',
          'SOCIAL',
          'DEL',
          'ESTADO',
          'DE',
          'LA',
          'EL',
          'LOS',
          'LAS',
          'Y',
        ].includes(w),
    )
    .join(' ');
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
    // General obligations stay in the extraction: they are not reported as activities, but the
    // supervision report rates them (table 1.2) as the contractor's duties.
    obligations: e.obligations,
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
  /** `allyCode`: referral code in the first message (wa.me link of an Aliado), kept in the consent button. */
  welcome(allyCode: string | null = null): Outgoing[] {
    return [
      text(
        `👋 ¡Hola! Soy ${SIGNATURE}.\n\nTe acompaño a preparar tus cuentas de cobro de contratos de prestación de servicios con entidades públicas:\n📝 Me cuentas lo que haces cada día (texto, audio o fotos).\n📎 Te recuerdo la planilla, los antecedentes y las afiliaciones.\n📄 Al cierre te entrego tu informe de actividades y el borrador del informe de supervisión, listos para firmar.`,
      ),
      {
        type: 'cta_url',
        text: `Para continuar necesito que aceptes nuestra política de tratamiento de datos personales (Ley 1581 de 2012) y los términos del servicio: ${BRAND.terms}`,
        button: 'Ver política',
        url: BRAND.privacyPolicy,
      },
      buttons('¿Aceptas la política de tratamiento de datos y los términos del servicio?', [
        { id: allyCode ? `consent:yes:${allyCode}` : 'consent:yes', title: 'Acepto' },
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

  async start(turn: SetupTurn, intro: 'consent' | 'first' | 'another' = 'consent'): Promise<void> {
    turn.state.context = keepActing(turn.state.context);
    const opening = {
      consent: '✅ ¡Gracias! Ahora configuremos tu contrato.',
      first: '📄 Para empezar necesito configurar tu contrato.',
      another: '📄 Configuremos otro contrato.',
    }[intro];
    turn.out.push(text(opening));
    await this.askEntity(turn);
  }

  /** Institution of the contract: the configured ones, or "Otra" to request a new one. */
  private async askEntity(turn: SetupTurn): Promise<void> {
    this.go(turn, 'entity');
    const entities = (await this.deps.store.listEntities()).slice(0, 9);
    turn.out.push({
      type: 'list',
      text: '🏥 ¿Con qué institución es tu contrato?',
      button: 'Elegir institución',
      rows: [
        ...entities.map((e) => ({
          id: `ent:${e.id}`,
          title: clip(e.shortName, 24),
          description: clip(e.name, 72),
        })),
        { id: 'ent:other', title: 'Otra institución', description: 'Envíanos un modelo y la configuramos' },
      ],
    });
  }

  private async onEntity(turn: SetupTurn, msg: Inbound): Promise<void> {
    if (msg.replyId === 'ent:other') {
      this.go(turn, 'other_name');
      turn.out.push(
        text('✍️ Escríbeme el *nombre completo* de la institución con la que tienes el contrato.'),
      );
      return;
    }
    const id = msg.replyId?.startsWith('ent:') ? msg.replyId.slice(4) : null;
    const entity = id ? (await this.deps.store.listEntities()).find((e) => e.id === id) : undefined;
    if (!entity) return this.askEntity(turn);
    this.go(turn, 'contract_doc', { entityId: entity.id });
    turn.out.push(
      text(
        `Perfecto, *${entity.name}*.\n\nEnvíame el *PDF del contrato* que descargas de SECOP II (el que dice *CO1.PCCNTR…*). Usa 📎 → Documento.`,
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // "Otra": request to configure a new institution
  // ---------------------------------------------------------------------------
  private async onOtherName(turn: SetupTurn, msg: Inbound): Promise<void> {
    const name = msg.text?.trim().replace(/\s+/g, ' ');
    if (!name || name.length < 4 || name.length > 150) {
      turn.out.push(
        text('Escríbeme el nombre de la institución, por ejemplo: ESE Hospital Emiro Quintero Cañizares.'),
      );
      return;
    }
    this.go(turn, 'other_docs', { otherName: name, otherDocs: [], otherCustom: [], otherModels: {} });
    this.askDocs(turn, name);
  }

  /** Which documents the new institution asks for in each cuenta de cobro. */
  private askDocs(turn: SetupTurn, name: string): void {
    turn.out.push(
      text(
        `📋 ¿Qué documentos te pide *${name}* para tramitar cada cuenta de cobro?\n\n${INSTITUTION_DOCS.map(
          (d, i) => `${i + 1}. ${d.label}${d.generated ? ' ✍️' : ''}`,
        ).join(
          '\n',
        )}\n\n✍️ = lo preparo yo; de esos te pediré un modelo de la institución.\n\nEscríbeme los números separados por coma, por ejemplo: *1, 2, 3, 4, 5, 9*. Si piden algo que no está en la lista, agrégalo así: *1, 2, 4, otro: paz y salvo*.`,
      ),
    );
  }

  private async onOtherDocs(turn: SetupTurn, msg: Inbound): Promise<void> {
    const ctx = this.ctx(turn);
    const choice = msg.kind === 'text' && msg.text ? parseDocChoice(msg.text) : null;
    if (!choice) {
      turn.out.push(text('Escríbeme los números de la lista separados por coma, por ejemplo: *1, 2, 3, 4*.'));
      return;
    }
    if (!choice.codes.some((c) => INSTITUTION_DOCS.find((d) => d.code === c)?.generated)) {
      turn.out.push(
        text(
          'Necesito que elijas al menos uno de los documentos que preparo yo: *1* (informe de actividades), *2* (informe de supervisión) o *3* (cuenta de cobro). Escríbeme de nuevo los números.',
        ),
      );
      return;
    }
    this.go(turn, 'other_docs_ok', { otherDocs: choice.codes, otherCustom: choice.custom });
    const lines = [...choice.codes.map(docLabel), ...choice.custom].map((l) => `• ${l}`).join('\n');
    turn.out.push(
      buttons(`Esto es lo que pide *${ctx.otherName}*:\n${lines}\n\n¿Está completo?`, [
        { id: 'docs:ok', title: 'Sí, está completo' },
        { id: 'docs:edit', title: 'Corregir' },
      ]),
    );
  }

  private async onOtherDocsOk(turn: SetupTurn, msg: Inbound): Promise<void> {
    const ctx = this.ctx(turn);
    if (msg.replyId === 'docs:edit' || (msg.kind === 'text' && msg.text && parseDocChoice(msg.text))) {
      this.go(turn, 'other_docs');
      if (msg.kind === 'text') return this.onOtherDocs(turn, msg);
      this.askDocs(turn, ctx.otherName!);
      return;
    }
    if (msg.replyId !== 'docs:ok') {
      turn.out.push(
        buttons('¿Está completa la lista?', [
          { id: 'docs:ok', title: 'Sí, está completo' },
          { id: 'docs:edit', title: 'Corregir' },
        ]),
      );
      return;
    }
    this.go(turn, 'other_model');
    this.askModel(turn);
  }

  /** The next document Pascal generates that still has no model. */
  private nextModel(ctx: SetupCtx): string | undefined {
    return (ctx.otherDocs ?? []).find(
      (c) => INSTITUTION_DOCS.find((d) => d.code === c)?.generated && !ctx.otherModels?.[c],
    );
  }

  private askModel(turn: SetupTurn): void {
    const ctx = this.ctx(turn);
    const code = this.nextModel(ctx)!;
    const pending = (ctx.otherDocs ?? []).filter(
      (c) => INSTITUTION_DOCS.find((d) => d.code === c)?.generated,
    );
    const n = pending.indexOf(code) + 1;
    turn.out.push(
      text(
        `📄 ${pending.length > 1 ? `Modelo ${n} de ${pending.length}: e` : 'E'}nvíame un *modelo de ${docLabel(code).toLowerCase()}* de ${ctx.otherName} (PDF o Word). Puede ser uno que ya hayas presentado. Usa 📎 → Documento.`,
      ),
    );
  }

  private async saveAnyDocument(turn: SetupTurn, msg: Inbound, code: string): Promise<string | null> {
    if (msg.kind !== 'document' || !msg.media) return null;
    if (!isPdf(msg.media.mime) && !WORD_MIMES.has(msg.media.mime)) return null;
    const id = this.deps.newId();
    await this.deps.store.addSupport({
      id,
      userId: turn.user.id,
      code,
      data: msg.media.data,
      mime: msg.media.mime,
      filename: msg.media.filename ?? code,
      receivedAt: this.deps.clock.now().toISOString(),
    });
    return id;
  }

  private async onOtherModel(turn: SetupTurn, msg: Inbound): Promise<void> {
    const ctx = this.ctx(turn);
    const code = this.nextModel(ctx);
    if (!code) return this.askContractSample(turn);
    const id = await this.saveAnyDocument(turn, msg, `MODELO_${code}`);
    if (!id) {
      turn.out.push(
        text(
          `Necesito el modelo de ${docLabel(code).toLowerCase()} en *PDF o Word*. Envíalo como documento (📎 → Documento).`,
        ),
      );
      return;
    }
    this.go(turn, 'other_model', { otherModels: { ...ctx.otherModels, [code]: id } });
    turn.out.push(text(`✅ Recibí el modelo de ${docLabel(code).toLowerCase()}.`));
    if (this.nextModel(this.ctx(turn))) return this.askModel(turn);
    return this.askContractSample(turn);
  }

  private askContractSample(turn: SetupTurn): void {
    this.go(turn, 'other_contract');
    turn.out.push(text('📑 Por último, envíame tu *contrato* en PDF (el de SECOP II o el que firmaste).'));
  }

  private async onOtherContract(turn: SetupTurn, msg: Inbound): Promise<void> {
    const id = await this.saveAnyDocument(turn, msg, 'CONTRATO_MUESTRA');
    if (!id) {
      turn.out.push(text('Necesito el contrato en *PDF*. Envíalo como documento (📎 → Documento).'));
      return;
    }
    const ctx = this.ctx(turn);
    const models = ctx.otherModels ?? {};
    const { firstForInstitution, requestId } = await this.deps.store.createInstitutionRequest({
      userId: turn.user.id,
      institutionName: ctx.otherName!,
      modelSupportId: Object.values(models)[0]!,
      contractSupportId: id,
      documents: {
        required: [
          ...(ctx.otherDocs ?? []).map((code) => ({ code, label: docLabel(code) })),
          ...(ctx.otherCustom ?? []).map((label) => ({ code: null, label })),
        ],
        models,
      },
    });
    turn.state.flow = 'idle';
    turn.state.step = 'start';
    turn.state.context = keepActing(turn.state.context);
    turn.out.push(
      text(
        `✅ ¡Listo! Recibí ${Object.keys(models).length > 1 ? 'los modelos' : 'el modelo'}, la lista de documentos y tu contrato de *${ctx.otherName}*.\n\nNuestro equipo va a configurar esa institución y te escribimos por aquí cuando esté lista (normalmente en 1 o 2 días hábiles).${
          firstForInstitution
            ? '\n\n🎁 Como eres la primera persona de esta institución en usar el servicio, *tu primera cuenta de cobro es gratis* (válida por 12 meses).'
            : ''
        }`,
      ),
    );
    if (firstForInstitution) {
      const { code } = await this.deps.store.createAlly(turn.user.id, requestId);
      turn.out.push(...allyWelcome(code, ctx.otherName!));
    }
  }

  async handle(turn: SetupTurn, msg: Inbound): Promise<void> {
    switch (turn.state.step) {
      case 'entity':
        return this.onEntity(turn, msg);
      case 'other_name':
        return this.onOtherName(turn, msg);
      case 'other_docs':
        return this.onOtherDocs(turn, msg);
      case 'other_docs_ok':
        return this.onOtherDocsOk(turn, msg);
      case 'other_model':
        return this.onOtherModel(turn, msg);
      case 'other_contract':
        return this.onOtherContract(turn, msg);
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
        (turn.actor ?? turn.user).phone,
        text('⏳ Recibí el clausulado. Estoy leyendo tus documentos; esto puede tardar uno o dos minutos…'),
      )
      .catch(() => undefined);
    const extraction = await this.deps.ai.extractContract(docs);
    const entity = ctx.entityId
      ? await this.deps.store.getEntity(ctx.entityId)
      : await this.deps.store.findEntity(extraction.entity.nit, extraction.entity.name);
    if (!entity) {
      turn.state.flow = 'idle';
      turn.state.step = 'start';
      turn.state.context = keepActing(turn.state.context);
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
      `• Obligaciones específicas: ${e.obligations.filter((o) => o.kind === 'specific').length}`,
      ...(e.warnings.length ? ['', ...e.warnings.map((w) => `⚠️ ${w}`)] : []),
    ];
    turn.out.push(text(lines.join('\n')));
    // Obligations in chunks under WhatsApp's 4096-character limit.
    let chunk = '*Obligaciones (como quedarán en tus informes):*';
    for (const o of e.obligations.filter((x) => x.kind === 'specific')) {
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
    if (!e.startDate) {
      this.askStartDate(turn);
      return;
    }
    this.go(turn, 'mode', { startDate: e.startDate });
    this.afterDates(turn);
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
        '📑 ¿Tu cuenta de cobro necesita *certificado de cumplimiento*? Es el que expide una dependencia o coordinación e indica cuánto se te paga (no es la firma de tu supervisor).',
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
    const ranges = buildPeriods({
      contractStart: startDate,
      contractEnd: endDate,
      mode: contract.periodMode,
    });
    const plan = planPeriodAmounts({
      periods: ranges,
      totalValue: contract.totalValue,
      monthlyValue: contract.monthlyValue,
      paymentsCount: contract.paymentsCount,
      ...(contract.schedule ? { schedule: contract.schedule } : {}),
    });
    const periods: Period[] = ranges.map((r, i) => {
      const res = plan.amounts[i]!;
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
    turn.state.context = keepActing(turn.state.context);
    const next = periods.find((p) => p.status !== 'delivered');
    const billing = await store.getBillingSettings();
    // Live mode: the contract is active once its configuration is paid (terms, section 5); the
    // orchestrator asks for the payment right after this message.
    if (billing.mode === 'live')
      await store.openCharge({
        userId: user.id,
        requestedBy: turn.actor?.id ?? null,
        product: 'setup',
        contractId: contract.id,
        periodNumber: null,
        coversSetup: false,
        amount: billing.prices.setup,
      });
    const price = 'Durante el piloto la configuración no tiene costo.\n\n';
    turn.out.push(
      text(
        `🎉 ¡Listo! Tu contrato *${contract.fullNumber}* quedó configurado: ${periods.length} cuentas (${
          contract.periodMode === 'month_end' ? 'corte a fin de mes' : 'corte fecha a fecha'
        }).${next ? `\nTu próxima cuenta va del ${formatDdMmYyyy(next.from)} al ${formatDdMmYyyy(next.to)}.` : ''}${
          billing.mode === 'pilot'
            ? `\n\n${price}Desde ya cuéntame lo que haces cada día: texto, audio o fotos. Yo lo anoto en la obligación que corresponde. Escribe *menú* para ver todas las opciones.`
            : ''
        }`,
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
  // Activities are reported only for the specific obligations; general ones become duties.
  const obligations = e.obligations
    .filter((o) => o.kind === 'specific')
    .map((o) => ({
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
    contractorDuties: e.obligations.filter((o) => o.kind === 'general').map((o) => o.text),
    ...(e.schedule.length ? { schedule: e.schedule } : {}),
  };
}
