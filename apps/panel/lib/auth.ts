import 'server-only';
import { supabaseConfigured, supabaseServer } from './supabase';

/** In Supabase mode, only staff members may call panel APIs. Demo mode is open (local only). */
export async function isStaffRequest(): Promise<boolean> {
  if (!supabaseConfigured()) return true;
  const sb = await supabaseServer();
  const { data } = await sb.auth.getUser();
  if (!data.user) return false;
  const { data: staff } = await sb
    .from('staff_members')
    .select('role')
    .eq('auth_user_id', data.user.id)
    .maybeSingle();
  return Boolean(staff);
}
