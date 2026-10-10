import type {
  AI,
  ClassifyResult,
  ContractExtraction,
  DocumentInput,
  DraftResult,
  Note,
  Obligation,
} from '@cuentasbot/conversation';
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
export class ClaudeAI implements AI {
  constructor(
    private readonly llm: Llm,
    private readonly models: ModelChoice,
  ) {}

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

  async classifyNote(text: string, obligations: Obligation[]): Promise<ClassifyResult> {
    const r = await this.llm.structured({
      purpose: 'classify_note',
      model: this.models.fast,
      effort: 'low',
      maxTokens: 2000,
      system:
        "You assign a public-sector contractor's daily activity note to the contract obligation it best supports. Obligations are listed as E<n> (specific) or G<n> (general). Prefer specific obligations. Return null when no obligation fits. Confidence reflects how unambiguous the match is.",
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
