import type { ReactNode } from 'react';

/** CuentaFacil mark: a check inside a calendar, in the brand yellow. */
export function Logo() {
  return (
    <a className="pt-brand" href="/">
      <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">
        <rect x="3" y="6" width="26" height="23" rx="6" fill="#FFC107" />
        <rect x="9" y="2" width="3" height="8" rx="1.5" fill="#FFC107" />
        <rect x="20" y="2" width="3" height="8" rx="1.5" fill="#FFC107" />
        <path
          d="M10 18l4.5 4.5L23 14"
          stroke="#1F1F1F"
          strokeWidth="3.2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <b>
        Cuenta<span>Fácil</span>
      </b>
    </a>
  );
}

/** Result of the last action, carried in the URL (?ok= / ?error=). */
export function Flash({ ok, error }: { ok?: string; error?: string }) {
  if (error)
    return (
      <div className="pt-flash error" role="alert">
        {error}
      </div>
    );
  if (ok)
    return (
      <div className="pt-flash ok" role="status">
        {ok}
      </div>
    );
  return null;
}

export type Search = Promise<Record<string, string | string[] | undefined>>;

export async function flashOf(searchParams: Search): Promise<{ ok?: string; error?: string }> {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  return { ok: one(sp.ok), error: one(sp.error) };
}

export function Narrow({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="pt-top">
        <div className="pt-top-in">
          <Logo />
        </div>
      </header>
      <main className="pt-narrow">{children}</main>
      <p className="pt-foot">
        CuentaFacil de PascalIA ·{' '}
        <a href="https://pascalia.lat/terminos/" target="_blank" rel="noopener">
          Términos
        </a>{' '}
        ·{' '}
        <a href="https://pascalia.lat/politica-de-datos/" target="_blank" rel="noopener">
          Política de datos
        </a>
      </p>
    </>
  );
}

export const WHATSAPP = '573123885012';
export const waLink = (text: string) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;
