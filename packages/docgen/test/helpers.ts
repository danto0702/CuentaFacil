import { execFileSync } from 'node:child_process';

export function hasBinary(bin: string): boolean {
  try {
    execFileSync('which', [bin], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/** Collapses whitespace so line wrapping differences between LibreOffice versions don't matter. */
export function normalizeText(text: string): string {
  return text
    .replace(/\f/g, '\n')
    .replace(/[ \t ]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim();
}
