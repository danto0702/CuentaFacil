import type Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import type { z } from 'zod';

export type Effort = 'low' | 'medium' | 'high';

export interface UsageRecord {
  purpose: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  costUsdMicros: number;
}

/** USD per million tokens (input, output) — Claude API list prices, 2026-10-06. */
const PRICES: Record<string, [number, number]> = {
  'claude-haiku-5-5': [0.1, 0.5],
  'claude-sonnet-5-5': [2, 10],
  'claude-opus-5-5': [4, 20],
};

export function costUsdMicros(model: string, input: number, output: number, cacheRead: number): number {
  const [pin, pout] = PRICES[model] ?? [0, 0];
  // Cache reads bill at 10% of the input price.
  return Math.round(input * pin + output * pout + cacheRead * pin * 0.1);
}

export class RefusalError extends Error {}

export interface StructuredRequest<S extends z.ZodType> {
  purpose: string;
  model: string;
  effort: Effort;
  system: string;
  content: Anthropic.Beta.BetaContentBlockParam[];
  schema: S;
  maxTokens?: number;
}

/** Calls Claude for a schema-validated JSON answer. Logs usage through `onUsage`. */
export class Llm {
  constructor(
    private readonly client: Anthropic,
    private readonly onUsage: (u: UsageRecord) => Promise<void> = async () => undefined,
  ) {}

  async structured<S extends z.ZodType>(req: StructuredRequest<S>): Promise<z.infer<S>> {
    // Server-side fallback on safety declines; not offered for Haiku.
    const fallback = req.model.startsWith('claude-haiku')
      ? {}
      : {
          betas: ['server-side-fallback-2026-07-01'] as Anthropic.Beta.AnthropicBeta[],
          fallbacks: 'default' as const,
        };
    const res = await this.client.beta.messages.parse({
      model: req.model,
      max_tokens: req.maxTokens ?? 8000,
      system: [{ type: 'text', text: req.system, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: req.content }],
      output_config: { effort: req.effort, format: betaZodOutputFormat(req.schema) },
      ...fallback,
    });
    const u = res.usage;
    await this.onUsage({
      purpose: req.purpose,
      model: res.model,
      inputTokens: u.input_tokens,
      outputTokens: u.output_tokens,
      cacheReadTokens: u.cache_read_input_tokens ?? 0,
      cacheWriteTokens: u.cache_creation_input_tokens ?? 0,
      costUsdMicros: costUsdMicros(
        res.model,
        u.input_tokens,
        u.output_tokens,
        u.cache_read_input_tokens ?? 0,
      ),
    }).catch(() => undefined);
    if (res.stop_reason === 'refusal') throw new RefusalError(`${req.purpose}: declined`);
    if (res.stop_reason === 'max_tokens') throw new Error(`${req.purpose}: output truncated (max_tokens)`);
    if (res.parsed_output == null) throw new Error(`${req.purpose}: no structured output`);
    return res.parsed_output as z.infer<S>;
  }
}
