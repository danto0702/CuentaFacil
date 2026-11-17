import type { EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';

/**
 * Links from Supabase Auth (password recovery sent by Pascal on WhatsApp, e-mail confirmation): verifies the
 * token, leaves the session in cookies and goes on to `next` (a portal path).
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type') as EmailOtpType | null;
  const next = url.searchParams.get('next') ?? '/';
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/';
  const base = `${req.headers.get('x-forwarded-proto') ?? 'https'}://${req.headers.get('host')}`;
  if (tokenHash && type) {
    const sb = await supabaseServer();
    const { error } = await sb.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(safeNext, base));
  }
  return NextResponse.redirect(
    new URL(`/recuperar?error=${encodeURIComponent('El enlace venció o ya se usó. Pide uno nuevo.')}`, base),
  );
}
