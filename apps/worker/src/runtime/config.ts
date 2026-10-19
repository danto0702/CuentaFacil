import { z } from 'zod';

const schema = z.object({
  SUPABASE_URL: z.url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  WA_ACCESS_TOKEN: z.string().min(20),
  WA_APP_SECRET: z.string().min(8),
  WA_PHONE_NUMBER_ID: z.string().regex(/^\d+$/),
  WA_GRAPH_API_VERSION: z.string().default('v23.0'),
  WA_BUSINESS_ACCOUNT_ID: z.string().regex(/^\d+$/).optional(),
  ANTHROPIC_API_KEY: z.string().min(20),
  AI_MODEL_FAST: z.string().default('claude-haiku-5-5'),
  AI_MODEL_SMART: z.string().default('claude-sonnet-5-5'),
  AI_MODEL_SETUP: z.string().default('claude-opus-5-5'),
  AI_CONFIDENCE_THRESHOLD: z.coerce.number().min(0).max(1).default(0.8),
  // Voice notes: OpenAI or Groq (Whisper, OpenAI-compatible API). Only the chosen provider's key is required.
  STT_PROVIDER: z.enum(['openai', 'groq']).default('openai'),
  OPENAI_API_KEY: z.string().min(20).optional(),
  GROQ_API_KEY: z.string().trim().min(20).optional(),
  STT_MODEL: z.string().optional(),
  ENCRYPTION_KEY: z.string().optional(),
  BLIND_INDEX_KEY: z.string().optional(),
  // Wompi (ADR-034). Without the public key and integrity secret only cash codes and free reports work.
  // Trimmed: a space or line break pasted with a secret makes Wompi reject the signature.
  WOMPI_PUBLIC_KEY: z.string().trim().min(10).optional(),
  WOMPI_INTEGRITY_SECRET: z.string().trim().min(10).optional(),
  WOMPI_EVENTS_SECRET: z.string().trim().min(10).optional(),
  WORKER_POLL_MS: z.coerce.number().int().positive().default(1000),
  WORKER_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
});

export type WorkerConfig = z.infer<typeof schema>;

/** Speech-to-text endpoint for the chosen provider; a model of the other provider is replaced. */
export function sttSettings(
  cfg: Pick<WorkerConfig, 'STT_PROVIDER' | 'OPENAI_API_KEY' | 'GROQ_API_KEY' | 'STT_MODEL'>,
): {
  apiKey: string;
  baseURL?: string;
  model: string;
} {
  if (cfg.STT_PROVIDER === 'groq')
    return {
      apiKey: cfg.GROQ_API_KEY!,
      baseURL: 'https://api.groq.com/openai/v1',
      model: cfg.STT_MODEL?.startsWith('whisper') ? cfg.STT_MODEL : 'whisper-large-v3',
    };
  return {
    apiKey: cfg.OPENAI_API_KEY!,
    model: cfg.STT_MODEL && !cfg.STT_MODEL.startsWith('whisper-large') ? cfg.STT_MODEL : 'gpt-4o-transcribe',
  };
}

/** Reads and validates the environment; lists missing variable names (never values) on failure. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): WorkerConfig {
  const res = schema
    .superRefine((v, ctx) => {
      const key = v.STT_PROVIDER === 'groq' ? 'GROQ_API_KEY' : 'OPENAI_API_KEY';
      if (!v[key]) ctx.addIssue({ code: 'custom', path: [key], message: 'required by STT_PROVIDER' });
    })
    .safeParse(env);
  if (!res.success) {
    const names = [...new Set(res.error.issues.map((i) => i.path.join('.')))].join(', ');
    throw new Error(`Invalid or missing environment variables: ${names}`);
  }
  return res.data;
}
