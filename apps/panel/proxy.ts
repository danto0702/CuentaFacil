import { type NextRequest, NextResponse } from 'next/server';

/**
 * cuenta.pascalia.lat serves the contractor portal (app/mi-cuenta, ADR-061). Done here rather than with
 * next.config rewrites so it also applies to server-action redirects and client navigations, which the
 * host-based config rewrites missed (a 404 after «Crear cuenta»).
 */
const PORTAL_HOST = process.env.PORTAL_HOST ?? 'cuenta.pascalia.lat';

export function proxy(req: NextRequest) {
  const host = (req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? '').split(':')[0];
  if (host !== PORTAL_HOST) return NextResponse.next();
  const { pathname } = req.nextUrl;
  if (pathname === '/mi-cuenta' || pathname.startsWith('/mi-cuenta/')) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = pathname === '/' ? '/mi-cuenta' : `/mi-cuenta${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ['/((?!_next/|favicon\\.ico$).*)'],
};
