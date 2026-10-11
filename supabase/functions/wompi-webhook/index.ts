// Wompi events webhook (Supabase Edge Function, Deno). Stores the raw event and enqueues it; the worker
// verifies the checksum with WOMPI_EVENTS_SECRET (kept only in Railway) before trusting anything, as with
// WhatsApp. Deployed with verify_jwt = false: Wompi does not send a Supabase JWT.
import { createClient } from 'npm:@supabase/supabase-js@2';

const MAX_BODY_BYTES = 200_000;
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { auth: { persistSession: false } },
);

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405 });
  const body = await req.text();
  if (body.length > MAX_BODY_BYTES) return new Response('payload too large', { status: 413 });
  const { error } = await supabase.rpc('webhook_receive', {
    p_provider: 'wompi',
    p_signature: req.headers.get('x-event-checksum') ?? '',
    p_body: body,
  });
  if (error) {
    console.error('webhook_receive failed:', error.message);
    // Wompi retries on non-200 responses.
    return new Response('error', { status: 500 });
  }
  return new Response('ok', { status: 200 });
});
