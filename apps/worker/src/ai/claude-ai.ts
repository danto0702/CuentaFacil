import type {
  AI,
  ClassifyResult,
  ContractExtraction,
  DocumentInput,
  DraftResult,
  MessageIntent,
  Note,
  Obligation,
  SocialSecurity,
  SupportSegment,
} from '@cuentasbot/conversation';
import type { IsoDate } from '@cuentasbot/shared';
import { z } from 'zod';
import type { Llm } from './llm.js';

export interface ModelChoice {
  fast: string;
  smart: string;
  /** Contract setup (reads SECOP contract + clauses). */
  setup: string;
}

const WRITING_RULES = `Writing rules for the "Actividades realizadas por el contratista" column of a Colombian public-sector activity report:
- Colombian Spanish, impersonal and in past tense ("Se realizó…", "Se participó en…", "Se solicitaron 85 carnets…").
- Use ONLY facts present in the contractor's notes (dates, places, quantities, names of meetings, programs and municipalities). Never invent or embellish.
- 1 to 3 sentences per paragraph; no first person, no evaluative adjectives ("excelente", "exitosa"), no emojis.
- Keep proper nouns and acronyms as written in the notes (UPGD, PIC, SIVIGILA, PAI, EBS).
- Do not restate the obligation as if it were the activity.`;

const INTENT_KINDS = [
  'activity',
  'redo',
  'reset',
  'open_report',
  'draft',
  'generate',
  'status',
  'guide',
  'contracts',
  'add_contract',
  'my_data',
  'signature',
  'undo_note',
  'support',
  'help',
  'menu',
  'unclear',
] as const;

const messageIntentSchema = z.object({
  intent: z.enum(INTENT_KINDS),
  month: z.number().int().min(1).max(12).nullable().describe('1-12 if the message names a month, else null'),
  guess: z
    .enum(INTENT_KINDS)
    .nullable()
    .describe('Only when intent is "unclear": the most likely meaning, or null'),
  question: z
    .string()
    .nullable()
    .describe(
      'Only when intent is "unclear": one short question to the contractor in Colombian Spanish with tuteo, to find out what they want; otherwise null',
    ),
});

const MESSAGE_INTENT_RULES = `A Colombian public-sector contractor writes to Pascal, a WhatsApp assistant that records their daily work activities and prepares their monthly reports (cuentas de cobro). Decide what the message is. It may be long or short, written or transcribed from a voice note, with typos or missing accents.

- activity: a description of work the contractor did or is doing for their contract, to be recorded in the report. E.g. "hoy capacité a 30 personas en misión médica", "reunión con el alcalde", "visité 3 IPS y levanté las actas". Work about reports for their employer is still an activity: "elaboré el informe de la visita a la IPS", "entregué el informe mensual de vacunación a la secretaría".
- open_report: wants to start, continue or work on the account/report of a month with Pascal. E.g. "ahora vamos a iniciar la realización del informe de septiembre", "sigamos con la cuenta de agosto", "quiero hacer la cuenta de este mes".
- draft: wants Pascal to write or show the report draft now. E.g. "haz el informe", "ya está todo, redacta", "muéstrame cómo va el borrador".
- generate: wants the final documents. E.g. "genera los documentos", "mándame la cuenta lista para firmar".
- redo: regenerate a report already delivered. E.g. "rehace agosto", "vuelve a sacar el de julio con los cambios".
- reset: start a report over, deleting its notes. E.g. "reinicia agosto", "borra todo lo de septiembre y empecemos de cero".
- status: what is missing or how the account is going. E.g. "qué me falta", "cómo voy con la cuenta".
- guide: help to download certificates (antecedentes, Policía, Procuraduría, Contraloría, medidas correctivas, afiliaciones). E.g. "ayúdame a sacar los antecedentes".
- contracts: see their contracts. add_contract: register a new contract. my_data: see their personal or bank data.
- signature: upload or change their signature. undo_note: delete the last note they sent.
- support: talk to a person of the team. help: how Pascal works. menu: greetings or asking for options.
- unclear: acknowledgements ("ok", "gracias", "listo"), questions you cannot map to the above, or anything you are not sure about. When in doubt between an activity and a request, answer unclear: Pascal will ask. Then give guess (the most likely meaning) and question (one short question in Colombian Spanish, tuteo, that lets the contractor say what they want).

Requests are addressed to Pascal about their account, report, documents or the service; activities describe the contractor's own work. month: 1-12 if a month is named ("septiembre", "el mes pasado" does not count), else null.`;

const classifySchema = z.object({
  obligation_number: z
    .number()
    .int()
    .nullable()
    .describe('Number of the best-matching obligation, or null if none fits'),
  kind: z.enum(['specific', 'general']).nullable(),
  confidence: z.number().min(0).max(1),
});

const draftSchema = z.object({
  status: z.enum(['ok', 'needs_input']),
  paragraphs: z.array(z.string()).describe('Report text, one entry per paragraph; empty when needs_input'),
  reason: z
    .string()
    .describe('When needs_input: what is missing, in Colombian Spanish addressed to the contractor (tuteo)'),
});

const rewriteSchema = z.object({ paragraphs: z.array(z.string()) });

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const extractionSchema = z.object({
  secopId: z.string().nullable().describe('SECOP II contract id, e.g. CO1.PCCNTR.9618889'),
  number: z.string().describe('Short contract number as used in reports, e.g. "0330"'),
  fullNumber: z.string().describe('Contract number as written in SECOP, e.g. "CPS-0330-2026"'),
  object: z.string().describe('Contract object, literal, upper case as written'),
  entity: z.object({ name: z.string(), nit: z.string().nullable() }),
  contractor: z.object({
    fullName: z.string().describe('Upper case'),
    docNumber: z.string().describe('Digits only'),
    docIssuedIn: z.string().nullable(),
    bankName: z.string().nullable(),
    accountType: z.enum(['ahorros', 'corriente']).nullable(),
    accountNumber: z.string().nullable(),
  }),
  totalValue: z.number().int(),
  monthlyValue: z.number().int().nullable(),
  paymentsCount: z.number().int().nullable(),
  termText: z.string().describe('Duration as written, e.g. "3 MESES"'),
  startDate: isoDate
    .nullable()
    .describe('Only if a start date (acta de inicio) is explicitly written; never infer'),
  endDate: isoDate.nullable(),
  processArea: z.string().nullable().describe('Short area for labels (2-3 words), e.g. "Salud Pública"'),
  supervisor: z.object({ name: z.string(), title: z.string() }).nullable(),
  obligations: z.array(
    z.object({ kind: z.enum(['specific', 'general']), number: z.number().int(), text: z.string() }),
  ),
  schedule: z.array(
    z.object({
      paymentNumber: z.number().int(),
      amount: z.number().int(),
      days: z.number().int().nullable(),
      months: z.number().int().nullable(),
      items: z.array(z.object({ concept: z.string(), amount: z.number().int(), countsForIbc: z.boolean() })),
    }),
  ),
  warnings: z.array(z.string()),
});

const EXTRACTION_RULES = `You read Colombian public-sector service contracts (contrato de prestación de servicios) to configure monthly billing reports.
Documents: the SECOP II contract summary and the contract clauses ("clausulado").
Rules:
- Copy obligations LITERALLY, in the clauses' order and numbering. "Specific" obligations are the activities listed under the object ("ejecutará las siguientes actividades"); "general" obligations are the contractor's obligations clause (e.g. "CLÁUSULA QUINTA - OBLIGACIONES DEL CONTRATISTA"). Only join lines broken by the PDF layout; do not fix wording.
- Amounts are integer Colombian pesos.
- monthlyValue: the regular monthly payment from the payment clause. schedule: only when the clauses give different values per payment (e.g. a prorated first month, or fees + transport); mark transport allowance items countsForIbc=false. Otherwise leave schedule empty.
- startDate only if an explicit start date is written (SECOP often shows "-": then null). Never infer dates.
- contractor data and bank account from the SECOP "Proveedor" and "Cuenta bancaria" sections.
- Use null for anything not present. Put every doubt or inconsistency in warnings, in Colombian Spanish, short.`;

const obligationList = (obligations: Obligation[]) =>
  obligations.map((o) => `${o.kind === 'general' ? 'G' : 'E'}${o.number}. ${o.text}`).join('\n');

/** AI port backed by Claude: Haiku classifies notes; Sonnet drafts and rewrites report text. */
const SUPPORT_RULES = `You read PDFs that Colombian public-sector contractors send as supports for their monthly payment request (cuenta de cobro). One PDF may contain one document or several bundled together (e.g. the 4 background checks, or the 3 affiliation certificates, or a social-security payment sheet of 2 pages).
For each document in the PDF, return its checklist code and the page range it spans (1-based, inclusive). Usual codes:
- PILA: planilla integrada de liquidación de aportes / comprobante de pago de seguridad social (one or more pages).
- POLICIA: certificado de antecedentes judiciales (Policía Nacional).
- RNMC: Registro Nacional de Medidas Correctivas (Policía).
- PROCURADURIA: certificado de antecedentes disciplinarios (Procuraduría).
- CONTRALORIA: certificado de antecedentes fiscales / responsabilidad fiscal (Contraloría).
- EPS: certificado de afiliación a salud (EPS). ARL: afiliación a riesgos laborales. AFP: afiliación a pensión (fondo de pensiones, Colpensiones).
Use only codes from the given checklist; use null for pages that are none of them (cover pages, blank pages, unrelated documents).
issued_on: the issue/query/payment date printed on the document (YYYY-MM-DD), or null.
amount: only for a compliance certificate (certificado / certificación de cumplimiento issued by the supervisor), the value it certifies to pay for this period, as an integer in pesos; null otherwise or if not printed.
note: a very short Spanish note useful to the contractor, e.g. "no registra antecedentes", "periodo septiembre 2026", "estado activo"; flag anything worrying, e.g. "REGISTRA ANTECEDENTES" or "afiliación retirada". null if nothing to add.
Never invent: if unsure of a code, use null.`;

const PILA_RULES = `You read a Colombian social-security payment sheet (PILA: "planilla integrada de liquidación de aportes" or the operator's payment certificate) of an independent contractor.
Return exactly what is printed, never invent: operator (e.g. "Aportes en Línea", "SOI", "Mi Planilla", "Asopagos"), sheet number (número de planilla), pin, bank / financial entity used to pay, payment date (YYYY-MM-DD), contribution month (YYYY-MM: the health "periodo de cotización" / "período salud"), IBC, health entity (EPS) and value, pension fund (AFP / Colpensiones) and value, solidarity fund (FSP) value, ARL and value, and the total paid.
pin: the payment number printed on the sheet ("PIN", "número de pago", "No. pago", "referencia de pago", "número de autorización" or "CUS"); it is not the sheet number. Copy it exactly.
Values are integers in Colombian pesos, without separators. Use null for anything not printed. readable=false if this is not a payment sheet.`;

const int = z.number().int().nullable();
const pilaSchema = z.object({
  readable: z.boolean(),
  operator: z.string().nullable(),
  sheet_number: z.string().nullable(),
  pin: z.string().nullable(),
  bank: z.string().nullable(),
  payment_date: z.string().nullable(),
  contribution_month: z.string().nullable(),
  ibc: int,
  health_entity: z.string().nullable(),
  health_value: int,
  pension_entity: z.string().nullable(),
  pension_value: int,
  fsp_value: int,
  arl_entity: z.string().nullable(),
  arl_value: int,
  total_value: int,
});

const supportsSchema = z.object({
  segments: z.array(
    z.object({
      code: z.string().nullable(),
      from_page: z.number().int(),
      to_page: z.number().int(),
      issued_on: z.string().nullable(),
      note: z.string().nullable(),
      amount: z.number().int().nullable(),
    }),
  ),
});

export class ClaudeAI implements AI {
  constructor(
    private readonly llm: Llm,
    private readonly models: ModelChoice,
  ) {}

  async extractSocialSecurity(doc: DocumentInput): Promise<Omit<SocialSecurity, 'userId'> | null> {
    const r = await this.llm.structured({
      purpose: 'extract_pila',
      model: this.models.smart,
      effort: 'low',
      maxTokens: 3000,
      system: PILA_RULES,
      content: [
        {
          type: 'document' as const,
          title: doc.label,
          source: {
            type: 'base64' as const,
            media_type: 'application/pdf' as const,
            data: doc.data.toString('base64'),
          },
        },
        { type: 'text', text: 'Extract the payment data of this social-security sheet.' },
      ],
      schema: pilaSchema,
    });
    const iso = (v: string | null) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? (v as IsoDate) : null);
    const month =
      r.contribution_month && /^\d{4}-\d{2}$/.test(r.contribution_month) ? r.contribution_month : null;
    if (!r.readable || !month) return null;
    return {
      contributionMonth: `${month}-01` as IsoDate,
      platform: r.operator ?? '',
      sheetNumber: r.sheet_number ?? '',
      pin: r.pin ?? '',
      bank: r.bank ?? '',
      paymentDate: iso(r.payment_date) ?? (`${month}-01` as IsoDate),
      ibc: r.ibc ?? 0,
      eps: r.health_entity ?? '',
      epsValue: r.health_value ?? 0,
      afp: r.pension_entity ?? '',
      afpValue: r.pension_value ?? 0,
      fspValue: r.fsp_value ?? 0,
      afcValue: 0,
      ...(r.arl_entity ? { arl: r.arl_entity } : {}),
      arlValue: r.arl_value ?? 0,
      total: r.total_value ?? 0,
    };
  }

  async classifySupports(
    doc: DocumentInput,
    types: { code: string; label: string }[],
  ): Promise<SupportSegment[]> {
    const r = await this.llm.structured({
      purpose: 'classify_supports',
      model: this.models.smart,
      effort: 'low',
      maxTokens: 4000,
      system: SUPPORT_RULES,
      content: [
        {
          type: 'document' as const,
          title: doc.label,
          source: {
            type: 'base64' as const,
            media_type: 'application/pdf' as const,
            data: doc.data.toString('base64'),
          },
        },
        {
          type: 'text',
          text: `Checklist codes:\n${types.map((t) => `${t.code}: ${t.label}`).join('\n')}\n\nFile name: ${doc.label}\nList every document in this PDF with its pages.`,
        },
      ],
      schema: supportsSchema,
    });
    const codes = new Set(types.map((t) => t.code));
    return r.segments.map((g) => ({
      code: g.code && codes.has(g.code) ? g.code : null,
      fromPage: Math.max(1, g.from_page),
      toPage: Math.max(g.from_page, g.to_page),
      issuedOn: g.issued_on && /^\d{4}-\d{2}-\d{2}$/.test(g.issued_on) ? (g.issued_on as IsoDate) : null,
      note: g.note?.trim() || null,
      amount: g.amount && g.amount > 0 ? g.amount : null,
    }));
  }

  async extractContract(docs: DocumentInput[]): Promise<ContractExtraction> {
    const r = await this.llm.structured({
      purpose: 'extract_contract',
      model: this.models.setup,
      effort: 'high',
      maxTokens: 16000,
      system: EXTRACTION_RULES,
      content: [
        ...docs.map((d) => ({
          type: 'document' as const,
          title: d.label,
          source: {
            type: 'base64' as const,
            media_type: 'application/pdf' as const,
            data: d.data.toString('base64'),
          },
        })),
        { type: 'text', text: 'Extract the contract configuration from these documents.' },
      ],
      schema: extractionSchema,
    });
    return normalizeExtraction(r);
  }

  async correctExtraction(extraction: ContractExtraction, instruction: string): Promise<ContractExtraction> {
    const r = await this.llm.structured({
      purpose: 'correct_extraction',
      model: this.models.setup,
      effort: 'medium',
      maxTokens: 16000,
      system: `${EXTRACTION_RULES}\nYou receive a previous extraction (JSON) and a correction from the contractor. Apply only that correction and return the full extraction.`,
      content: [
        {
          type: 'text',
          text: `Previous extraction:\n${JSON.stringify(extraction)}\n\nCorrection from the contractor:\n${instruction}`,
        },
      ],
      schema: extractionSchema,
    });
    return normalizeExtraction(r);
  }

  async interpretMessage(text: string): Promise<MessageIntent> {
    const r = await this.llm.structured({
      purpose: 'interpret_message',
      model: this.models.fast,
      effort: 'low',
      maxTokens: 1000,
      system: MESSAGE_INTENT_RULES,
      content: [{ type: 'text', text: `Message:\n${text}` }],
      schema: messageIntentSchema,
    });
    const unclear = r.intent === 'unclear';
    return {
      intent: r.intent,
      month: r.month,
      guess: unclear ? r.guess : null,
      question: unclear ? r.question : null,
    };
  }

  async classifyNote(text: string, obligations: Obligation[]): Promise<ClassifyResult> {
    const r = await this.llm.structured({
      purpose: 'classify_note',
      model: this.models.fast,
      effort: 'low',
      maxTokens: 2000,
      system:
        "You assign a public-sector contractor's daily activity note to the contract obligation it best supports. Obligations are listed as E<n> (specific) or G<n> (general). Prefer specific obligations. Always choose the single best-fitting obligation, even when several could apply; return null only when the note is not a work activity at all. Confidence reflects how unambiguous the match is.",
      content: [{ type: 'text', text: `Obligations:\n${obligationList(obligations)}\n\nNote:\n${text}` }],
      schema: classifySchema,
    });
    const match =
      r.obligation_number == null
        ? undefined
        : obligations.find((o) => o.number === r.obligation_number && (r.kind == null || o.kind === r.kind));
    return { obligationKey: match?.key ?? null, confidence: match ? r.confidence : 0 };
  }

  async draftObligation(obligation: Obligation, notes: Note[]): Promise<DraftResult> {
    if (!notes.length)
      return { status: 'needs_input', reason: 'No hay notas para esta obligación en el periodo.' };
    const r = await this.llm.structured({
      purpose: 'draft_obligation',
      model: this.models.smart,
      effort: 'medium',
      maxTokens: 4000,
      system: `${WRITING_RULES}\nIf the notes contain no concrete fact for this obligation, answer status "needs_input".`,
      content: [
        {
          type: 'text',
          text: `Obligation ${obligation.number}: ${obligation.text}\n\nContractor notes for this period:\n${notes
            .map((n) => `- ${n.date}: ${n.text}`)
            .join('\n')}`,
        },
      ],
      schema: draftSchema,
    });
    return r.status === 'ok' && r.paragraphs.length
      ? { status: 'ok', paragraphs: r.paragraphs }
      : { status: 'needs_input', reason: r.reason || 'Necesito más detalles de lo que hiciste.' };
  }

  async rewrite(paragraphs: string[], instruction: string, obligation: Obligation): Promise<string[]> {
    const r = await this.llm.structured({
      purpose: 'rewrite_draft',
      model: this.models.smart,
      effort: 'medium',
      maxTokens: 4000,
      system: `${WRITING_RULES}\nApply the contractor's correction to the current text. Change only what the correction asks; keep every other fact.`,
      content: [
        {
          type: 'text',
          text: `Obligation ${obligation.number}: ${obligation.text}\n\nCurrent text:\n${paragraphs.join('\n\n')}\n\nCorrection requested by the contractor:\n${instruction}`,
        },
      ],
      schema: rewriteSchema,
    });
    return r.paragraphs.length ? r.paragraphs : paragraphs;
  }
}

function normalizeExtraction(r: z.infer<typeof extractionSchema>): ContractExtraction {
  return {
    ...r,
    contractor: { ...r.contractor, docNumber: r.contractor.docNumber.replace(/\D/g, '') },
    schedule: r.schedule.map((p) => ({
      paymentNumber: p.paymentNumber,
      amount: p.amount,
      items: p.items,
      ...(p.days != null ? { days: p.days } : {}),
      ...(p.months != null ? { months: p.months } : {}),
    })),
  };
}
