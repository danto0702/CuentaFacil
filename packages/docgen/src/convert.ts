import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);

let queue: Promise<unknown> = Promise.resolve();

/** Serializes LibreOffice conversions: one soffice process per worker replica (ADR-004). */
function enqueue<T>(job: () => Promise<T>): Promise<T> {
  const next = queue.then(job, job);
  queue = next.catch(() => undefined);
  return next;
}

export interface ConvertOptions {
  sofficePath?: string;
  timeoutMs?: number;
}

/** DOCX → PDF with LibreOffice headless. */
export function docxToPdf(docx: Buffer, opts: ConvertOptions = {}): Promise<Buffer> {
  return enqueue(async () => {
    const dir = await mkdtemp(join(tmpdir(), 'cb-soffice-'));
    try {
      const input = join(dir, 'doc.docx');
      await writeFile(input, docx);
      await run(
        opts.sofficePath ?? process.env.SOFFICE_PATH ?? 'soffice',
        [
          '--headless',
          '--norestore',
          '--nolockcheck',
          `-env:UserInstallation=file://${join(dir, 'profile')}`,
          '--convert-to',
          'pdf',
          '--outdir',
          dir,
          input,
        ],
        { timeout: opts.timeoutMs ?? Number(process.env.SOFFICE_TIMEOUT_MS ?? 120_000) },
      );
      return await readFile(join(dir, 'doc.pdf'));
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
}

/** Plain text of a PDF (pdftotext -layout), used by golden tests. */
export async function pdfToText(pdf: Buffer): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'cb-pdftext-'));
  try {
    const input = join(dir, 'in.pdf');
    await writeFile(input, pdf);
    const { stdout } = await run('pdftotext', ['-layout', input, '-'], { maxBuffer: 50 * 1024 * 1024 });
    return stdout;
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
