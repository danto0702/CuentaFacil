// WhatsApp Cloud API webhook (Supabase Edge Function, Deno).
// GET: Meta's subscription handshake (hub.verify_token must match WA_VERIFY_TOKEN).
// POST: stores the raw body + X-Hub-Signature-256 and enqueues it. The worker verifies the signature with
// WA_APP_SECRET before trusting anything, so this function never needs the app secret.
// Deployed with verify_jwt = false: Meta does not send a Supabase JWT.
import { createClient } from 'npm:@supabase/supabase-js@2';

const MAX_BODY_BYTES = 1_000_000;
const verifyToken = Deno.env.get('WA_VERIFY_TOKEN') ?? '';
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { auth: { persistSession: false } },
);

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);

  if (req.method === 'GET') {
    const ok =
      url.searchParams.get('hub.mode') === 'subscribe' &&
      verifyToken.length > 0 &&
      url.searchParams.get('hub.verify_token') === verifyToken;
    return ok
      ? new Response(url.searchParams.get('hub.challenge') ?? '', { status: 200 })
      : new Response('forbidden', { status: 403 });
  }

  if (req.method !== 'POST') return new Response('method not allowed', { status: 405 });

  const signature = req.headers.get('x-hub-signature-256');
  if (!signature) return new Response('missing signature', { status: 401 });

  const body = await req.text();
  if (body.length > MAX_BODY_BYTES) return new Response('payload too large', { status: 413 });

  const { error } = await supabase.rpc('webhook_receive', {
    p_provider: 'whatsapp',
    p_signature: signature,
    p_body: body,
  });
  if (error) {
    console.error('webhook_receive failed:', error.message);
    // 500 makes Meta retry later; nothing is lost.
    return new Response('error', { status: 500 });
  }
  return new Response('ok', { status: 200 });
});
