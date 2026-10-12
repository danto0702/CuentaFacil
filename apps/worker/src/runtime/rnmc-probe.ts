import type { Logger } from './pipeline.js';

/**
 * Start-up check of the Policía's RNMC (medidas correctivas) query page: whether the server can reach
 * it and what the form asks for. It only reads the empty form; it never queries anyone's record.
 * Used to decide if the certificate can be fetched automatically (no captcha) — see ADR-035.
 */
export const RNMC_URL = 'https://srvcnpc.policia.gov.co/PSC/frm_cnp_consulta.aspx';

export function describeForm(html: string): {
  fields: string[];
  captcha: string[];
  forms: number;
  postbacks: string[];
  options: string[];
  action: string;
} {
  const fields = [...html.matchAll(/<(input|select|textarea)\b[^>]*>/gi)]
    .map((m) => {
      const tag = m[0];
      const name = /\bname=["']([^"']+)/i.exec(tag)?.[1] ?? /\bid=["']([^"']+)/i.exec(tag)?.[1] ?? '?';
      const type = /\btype=["']([^"']+)/i.exec(tag)?.[1] ?? m[1]!.toLowerCase();
      return `${name}:${type}`;
    })
    .filter((f) => !f.startsWith('__')); // ASP.NET state fields
  const lower = html.toLowerCase();
  const captcha = ['recaptcha', 'hcaptcha', 'turnstile', 'captcha', 'botdetect'].filter((k) =>
    lower.includes(k),
  );
  const forms = (html.match(/<form\b/gi) ?? []).length;
  // Buttons rendered as links post back through __doPostBack('target', …).
  const postbacks = [
    ...new Set([...html.matchAll(/__doPostBack\(\s*(?:&#39;|['"])([^'"&]+)/g)].map((m) => m[1]!)),
  ];
  const options = [...html.matchAll(/<option\b[^>]*value=["']([^"']*)["'][^>]*>([^<]*)</gi)]
    .map((m) => `${m[1]}=${m[2]!.trim()}`)
    .slice(0, 20);
  const action = /<form\b[^>]*action=["']([^"']+)/i.exec(html)?.[1] ?? '';
  return { fields: [...new Set(fields)], captcha, forms, postbacks, options, action };
}

export async function probeRnmc(log: Logger, http: typeof fetch = fetch): Promise<void> {
  try {
    const res = await http(RNMC_URL, { signal: AbortSignal.timeout(20_000) });
    const html = await res.text();
    log.info('rnmc.probe', { status: res.status, bytes: html.length, ...describeForm(html) });
  } catch (e) {
    log.error('rnmc.probe_failed', { error: String((e as Error).cause ?? e) });
  }
}
