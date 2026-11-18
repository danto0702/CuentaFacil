'use client';
import { usePathname, useRouter } from 'next/navigation';
import { type ReactNode, useEffect } from 'react';
import { useFormStatus } from 'react-dom';

/** Submit button that shows it is working (uploads of photos can take a few seconds). */
export function Submit({
  children,
  className = 'pt-btn',
  pending = 'Guardando…',
  confirm,
}: {
  children: ReactNode;
  className?: string;
  pending?: string;
  /** Asks before submitting (deletes). */
  confirm?: string;
}) {
  const { pending: busy } = useFormStatus();
  return (
    <button
      type="submit"
      className={className}
      disabled={busy}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {busy ? pending : children}
    </button>
  );
}

const TABS: [string, string][] = [
  ['/', 'Inicio'],
  ['/informes', 'Informes'],
  ['/soportes', 'Soportes'],
  ['/documentos', 'Documentos'],
  ['/pagos', 'Pagos'],
  ['/datos', 'Mis datos'],
];

/** Tabs; the contract pages count as «Informes». Works with and without the /mi-cuenta prefix. */
export function Tabs() {
  const raw = usePathname() ?? '/';
  const path = raw.replace(/^\/mi-cuenta/, '') || '/';
  const current = path.startsWith('/contratos')
    ? '/informes'
    : (TABS.find(([href]) => href !== '/' && path.startsWith(href))?.[0] ?? '/');
  return (
    <nav className="pt-nav" aria-label="Secciones">
      <div className="pt-nav-in">
        {TABS.map(([href, label]) => (
          <a key={href} href={href} aria-current={href === current ? 'page' : undefined}>
            {label}
          </a>
        ))}
      </div>
    </nav>
  );
}

/** Reloads the page data every few seconds (the link page waits for the WhatsApp message). */
export function AutoRefresh({ seconds }: { seconds: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => router.refresh(), seconds * 1000);
    return () => clearInterval(t);
  }, [router, seconds]);
  return null;
}
