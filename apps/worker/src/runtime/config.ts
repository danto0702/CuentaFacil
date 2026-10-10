import { z } from 'zod';

const schema = z.object({
  SUPABASE_URL: z.url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  WA_ACCESS_TOKEN: z.string().min(20),
  WA_APP_SECRET: z.string().min(8),
  WA_PHONE_NUMBER_ID: z.string().regex(/^\d+$/),
  WA_GRAPH_API_VERSION: z.string().default('v23.0'),
  ANTHROPIC_API_KEY: z.string().min(20),
  AI_MODEL_FAST: z.string().default('claude-haiku-5-5'),
  AI_MODEL_SMART: z.string().default('claude-sonnet-5-5'),
  AI_MODEL_SETUP: z.string().default('claude-opus-5-5'),
  AI_CONFIDENCE_THRESHOLD: z.coerce.number().min(0).max(1).default(0.8),
  OPENAI_API_KEY: z.string().min(20),
  STT_MODEL: z.string().default('gpt-4o-transcribe'),
  WORKER_POLL_MS: z.coerce.number().int().positive().default(1000),
  WORKER_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
});

export type WorkerConfig = z.infer<typeof schema>;

/** Reads and validates the environment; lists missing variable names (never values) on failure. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): WorkerConfig {
  const res = schema.safeParse(env);
  if (!res.success) {
    const names = [...new Set(res.error.issues.map((i) => i.path.join('.')))].join(', ');
    throw new Error(`Invalid or missing environment variables: ${names}`);
  }
  return res.data;
}
