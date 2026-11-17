import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { portalSession } from '@/lib/portal';

/** Pages for a signed-in web account, linked or not (link it, set a new password). */
export default async function SessionLayout({ children }: { children: ReactNode }) {
  if (!(await portalSession())) redirect('/ingresar');
  return children;
}
