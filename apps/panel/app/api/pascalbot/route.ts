import Anthropic from '@anthropic-ai/sdk';
import { BRAND } from '@cuentasbot/conversation';
import { allowedOrigins, PASCALBOT_LIMITS, parseChat, RateLimiter } from '@/lib/pascalbot';
import { PASCALBOT_SYSTEM } from '@/lib/pascalbot-knowledge';

export const runtime = 'nodejs';

const MODEL = process.env.PASCALBOT_MODEL || 'claude-haiku-5-5';
const ORIGINS = allowedOrigins();
const limiter = new RateLimiter(PASCALBOT_LIMITS);
let client: Anthropic | null = null;

const FALLBACK = `En este momento no puedo responder. Escríbele a Pascal por WhatsApp: https://wa.me/${BRAND.whatsapp}`;

function cors(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') ?? '';
  return ORIGINS.has(origin)
    ? {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
        Vary: 'Origin',
      }
    : { Vary: 'Origin' };
}

const json = (req: Request, body: unknown, status = 200) =>
  Response.json(body, { status, headers: cors(req) });

export function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: cors(req) });
}

/** Website chat (PascalBot): answers about the scope of CuentaFacil only, never about an account. */
export async function POST(req: Request) {
  if (!ORIGINS.has(req.headers.get('origin') ?? ''))
    return new Response('Origen no permitido', { status: 403 });
  const turns = parseChat(await req.json().catch(() => null));
  if (!turns) return json(req, { error: 'bad_request' }, 400);

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const gate = limiter.take(ip);
  if (gate !== 'ok') {
    const reply =
      gate === 'ip'
        ? `Llevas muchas preguntas seguidas 😅. Espera unos minutos o escríbele a Pascal por WhatsApp: https://wa.me/${BRAND.whatsapp}`
        : FALLBACK;
    return json(req, { reply }, 429);
  }

  if (!process.env.ANTHROPIC_API_KEY) return json(req, { reply: FALLBACK }, 503);
  client ??= new Anthropic();
  try {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: PASCALBOT_LIMITS.maxTokens,
      system: [{ type: 'text', text: PASCALBOT_SYSTEM, cache_control: { type: 'ephemeral' } }],
      messages: turns,
    });
    const reply = res.content
      .flatMap((b) => (b.type === 'text' ? [b.text] : []))
      .join('\n')
      .trim();
    console.log(
      JSON.stringify({
        event: 'pascalbot.reply',
        model: res.model,
        input: res.usage.input_tokens,
        cacheRead: res.usage.cache_read_input_tokens ?? 0,
        output: res.usage.output_tokens,
        stop: res.stop_reason,
      }),
    );
    if (res.stop_reason === 'refusal' || !reply) return json(req, { reply: FALLBACK });
    return json(req, { reply });
  } catch (e) {
    console.error(JSON.stringify({ event: 'pascalbot.failed', error: String(e) }));
    return json(req, { reply: FALLBACK }, 502);
  }
}
