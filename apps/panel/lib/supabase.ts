import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function supabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/**
 * Supabase client bound to the signed-in staff member or contractor (RLS applies). `headers` reach Postgres as
 * request.headers: the portal sends «x-cf-acting» for a gestor working for someone (ADR-065).
 */
export async function supabaseServer(headers?: Record<string, string>) {
  const store = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      ...(headers ? { global: { headers } } : {}),
      cookies: {
        getAll: () => store.getAll(),
        setAll: (list) => {
          try {
            for (const { name, value, options } of list) store.set(name, value, options);
          } catch {
            // Called from a Server Component: cookies are refreshed on the next Server Action / Route Handler.
          }
        },
      },
    },
  );
}
