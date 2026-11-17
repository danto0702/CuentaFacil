import 'server-only';
import { createClient } from '@supabase/supabase-js';

/**
 * Service-role client, only for what the contractor portal needs from the staff panel (ADR-062): creating the
 * web access the superadmin assigns and changing its password. Server-side only; every caller checks first
 * that the signed-in staff member is a superadmin.
 */
export function adminAuthConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function supabaseAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
