import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { portalSession } from '@/lib/portal';
import { signOut, switchPerson } from '../actions';
import { Logo } from '../parts';
import { Tabs } from '../ui';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await portalSession();
  if (!session) redirect('/ingresar');
  if (!session.user) redirect('/vincular');
  const first = (session.me?.fullName ?? session.user.fullName).split(' ')[0];
  const short = (n: string) => n.split(' ').slice(0, 3).join(' ');
  return (
    <>
      <header className="pt-top">
        <div className="pt-top-in">
          <Logo />
          <div className="pt-who">
            {first}
            <form action={signOut}>
              <button type="submit" className="pt-link-btn">
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>
      {session.people.length > 1 && (
        <div className={`pt-acting ${session.acting ? '' : 'self'}`}>
          <div className="pt-acting-in">
            <span>
              {session.acting ? (
                <>
                  👤 Trabajas con las cuentas de <strong>{short(session.user.fullName)}</strong>
                </>
              ) : (
                <>👥 Gestionas las cuentas de otras personas</>
              )}
            </span>
            <form action={switchPerson}>
              <select name="person" defaultValue={session.user.id} aria-label="Cuentas de">
                {session.people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.isSelf ? 'Mis cuentas' : short(p.fullName)}
                  </option>
                ))}
              </select>
              <button type="submit" className="pt-btn small dark">
                Cambiar
              </button>
            </form>
          </div>
        </div>
      )}
      <Tabs />
      <main className="pt-main">{children}</main>
    </>
  );
}
