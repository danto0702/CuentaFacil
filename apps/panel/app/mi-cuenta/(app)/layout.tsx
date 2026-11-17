import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { portalSession } from '@/lib/portal';
import { signOut } from '../actions';
import { Logo } from '../parts';
import { Tabs } from '../ui';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await portalSession();
  if (!session) redirect('/ingresar');
  if (!session.user) redirect('/vincular');
  const first = session.user.fullName.split(' ')[0];
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
      <Tabs />
      <main className="pt-main">{children}</main>
    </>
  );
}
