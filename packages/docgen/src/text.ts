import JSZip from 'jszip';

function paragraphs(xml: string): string[] {
  const out: string[] = [];
  for (const p of xml.match(/<w:p[ >][\s\S]*?<\/w:p>/g) ?? []) {
    const text = [...p.matchAll(/<w:t(?: [^>]*)?>([^<]*)<\/w:t>/g)]
      .map((m) => m[1])
      .join('')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .trim();
    if (text) out.push(text);
  }
  return out;
}

/**
 * Text of a DOCX, one paragraph per line (headers first, then body).
 * Unlike PDF text it does not depend on fonts or line wrapping, so it is stable for golden tests.
 */
export async function docxPlainText(docx: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(docx);
  const parts = Object.keys(zip.files)
    .filter((n) => /^word\/(header\d*|document|footer\d*)\.xml$/.test(n))
    .sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
  const lines: string[] = [];
  for (const name of parts) lines.push(...paragraphs(await zip.file(name)!.async('string')));
  return lines.join('\n');
}

function rank(name: string): number {
  return name.includes('header') ? 0 : name.includes('document') ? 1 : 2;
}
