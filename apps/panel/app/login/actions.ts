'use server';
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase';

export async function signIn(_prev: string | null, form: FormData): Promise<string | null> {
  const sb = await supabaseServer();
  const { error } = await sb.auth.signInWithPassword({
    email: String(form.get('email') ?? ''),
    password: String(form.get('password') ?? ''),
  });
  if (error) return 'Correo o contraseña incorrectos.';
  redirect('/');
}

export async function signOut(): Promise<void> {
  const sb = await supabaseServer();
  await sb.auth.signOut();
  redirect('/login');
}
