import { describe, expect, it } from 'vitest';
import { loadConfig, sttSettings } from '../src/runtime/config.js';

const BASE = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'x'.repeat(30),
  WA_ACCESS_TOKEN: 'x'.repeat(30),
  WA_APP_SECRET: 'x'.repeat(10),
  WA_PHONE_NUMBER_ID: '123',
  ANTHROPIC_API_KEY: 'x'.repeat(30),
};

describe('speech-to-text provider', () => {
  it('keeps OpenAI by default', () => {
    const cfg = loadConfig({ ...BASE, OPENAI_API_KEY: 'o'.repeat(30), STT_MODEL: 'gpt-4o-transcribe' });
    expect(sttSettings(cfg)).toEqual({ apiKey: 'o'.repeat(30), model: 'gpt-4o-transcribe' });
  });

  it('uses Groq with its key and a Whisper model, even if an OpenAI model was left set', () => {
    const cfg = loadConfig({
      ...BASE,
      STT_PROVIDER: 'groq',
      GROQ_API_KEY: 'g'.repeat(30),
      STT_MODEL: 'gpt-4o-transcribe',
    });
    expect(sttSettings(cfg)).toEqual({
      apiKey: 'g'.repeat(30),
      baseURL: 'https://api.groq.com/openai/v1',
      model: 'whisper-large-v3',
    });
  });

  it('asks only for the key of the chosen provider', () => {
    expect(() => loadConfig({ ...BASE, STT_PROVIDER: 'groq' })).toThrow(/GROQ_API_KEY/);
    expect(() => loadConfig({ ...BASE, STT_PROVIDER: 'groq', GROQ_API_KEY: 'g'.repeat(30) })).not.toThrow();
    expect(() => loadConfig(BASE)).toThrow(/OPENAI_API_KEY/);
  });
});
