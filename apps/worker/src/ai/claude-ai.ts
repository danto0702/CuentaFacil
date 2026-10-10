import type { AI, ClassifyResult, DraftResult, Note, Obligation } from '@cuentasbot/conversation';
import { z } from 'zod';
import type { Llm } from './llm.js';

export interface ModelChoice {
  fast: string;
  smart: string;
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

const obligationList = (obligations: Obligation[]) =>
  obligations.map((o) => `${o.kind === 'general' ? 'G' : 'E'}${o.number}. ${o.text}`).join('\n');

/** AI port backed by Claude: Haiku classifies notes; Sonnet drafts and rewrites report text. */
export class ClaudeAI implements AI {
  constructor(
    private readonly llm: Llm,
    private readonly models: ModelChoice,
  ) {}

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
