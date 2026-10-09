import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { signOut } from '@/app/login/actions';
import { supabaseConfigured, supabaseServer } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function PanelLayout({ children }: { children: ReactNode }) {
  const demo = !supabaseConfigured();
  let who = 'Modo demo';
  if (!demo) {
    const sb = await supabaseServer();
    const { data } = await sb.auth.getUser();
    if (!data.user) redirect('/login');
    const { data: staff } = await sb
      .from('staff_members')
      .select('role, full_name')
      .eq('auth_user_id', data.user.id)
      .maybeSingle();
    if (!staff) {
      return (
        <main className="login card">
          <h2>Sin acceso</h2>
          <p>Tu usuario no tiene un rol en el panel. Pide al superadmin que te agregue.</p>
          <form action={signOut}>
            <button type="submit" className="secondary">
              Salir
            </button>
          </form>
        </main>
      );
    }
    who = `${staff.full_name} · ${staff.role === 'superadmin' ? 'Superadmin' : 'Operador'}`;
  }
  return (
    <div className="shell">
      <nav className="nav">
        <h1>CuentaFacil</h1>
        <Link href="/">Inicio</Link>
        <Link href="/entidades">Entidades y formatos</Link>
        <Link href="/contratistas">Contratistas</Link>
        <Link href="/cuentas">Cuentas</Link>
        <p className="muted" style={{ color: '#9fb4ca', marginTop: 24 }}>
          {who}
        </p>
        {!demo && (
          <form action={signOut}>
            <button type="submit" className="secondary">
              Salir
            </button>
          </form>
        )}
      </nav>
      <main className="main">
        {demo && (
          <div className="banner">
            Modo demo: no hay credenciales de Supabase configuradas, se muestran datos sintéticos y los
            cambios se pierden al reiniciar.
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
