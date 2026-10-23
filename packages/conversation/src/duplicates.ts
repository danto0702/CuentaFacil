import type { Note } from './domain.js';
import { PHOTO_RECORD_PREFIX } from './note-check.js';
import { normalize } from './text.js';

/** Share of characters that may differ for two texts to be the same activity (a typo, a missing accent). */
const TYPOS = 0.05;

/** Edit distance between two strings (insertions, deletions, substitutions). */
function distance(a: string, b: string): number {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++)
      cur[j] = Math.min(prev[j]! + 1, cur[j - 1]! + 1, prev[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[b.length]!;
}

/**
 * Same text, or the same with a few typos. A word that changes the meaning («capacité *de nuevo*…»,
 * another number or place) makes it another activity.
 */
export function similarText(a: string, b: string): boolean {
  const x = normalize(a);
  const y = normalize(b);
  if (!x || !y) return false;
  if (x === y) return true;
  // Another quantity or date is another activity («25 familias» / «30 familias»).
  if ((x.match(/\d+/g) ?? []).join(' ') !== (y.match(/\d+/g) ?? []).join(' ')) return false;
  const longest = Math.max(x.length, y.length);
  if (longest < 30 || longest > 2000 || Math.abs(x.length - y.length) > longest * TYPOS) return false;
  return distance(x, y) <= longest * TYPOS;
}

/**
 * The same activity registered twice (sent again, forwarded): same contract, same day and the same
 * text (or with a few typos). A routine repeated on another day («Se realizó la ronda…») is a new
 * activity. Photo records without a description are never taken as repeated.
 */
export function sameActivity(a: Note, b: Note): boolean {
  if (a.id === b.id || a.contractId !== b.contractId || a.date !== b.date) return false;
  if (a.text.startsWith(PHOTO_RECORD_PREFIX) || b.text.startsWith(PHOTO_RECORD_PREFIX)) return false;
  return similarText(a.text, b.text);
}

/** The note kept with the obligations and photos of the repeated one. */
export function mergeNotes(keep: Note, dup: Note): Note {
  const keys = [keep.obligationKey, ...(keep.alsoKeys ?? []), dup.obligationKey, ...(dup.alsoKeys ?? [])];
  const primary = keep.obligationKey ?? dup.obligationKey;
  const also = [...new Set(keys.filter((k): k is string => Boolean(k) && k !== primary))];
  const { alsoKeys: _, obligationKey: __, ...rest } = keep;
  return {
    ...rest,
    ...(primary ? { obligationKey: primary } : {}),
    ...(also.length ? { alsoKeys: also } : {}),
    ...(keep.confidence == null && dup.confidence != null ? { confidence: dup.confidence } : {}),
    evidenceIds: [...new Set([...keep.evidenceIds, ...dup.evidenceIds])],
  };
}

/**
 * Groups repeated notes: the earliest of each group is kept with everything merged into it. Returns the
 * notes to keep (merged) and the ids of the repeated ones to delete.
 */
export function dedupeNotes(notes: Note[]): { kept: Note[]; changed: Note[]; removed: string[] } {
  const sorted = [...notes].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const kept: Note[] = [];
  const changed = new Map<string, Note>();
  const removed: string[] = [];
  for (const n of sorted) {
    const i = kept.findIndex((k) => sameActivity(k, n));
    if (i < 0) {
      kept.push(n);
      continue;
    }
    kept[i] = mergeNotes(kept[i]!, n);
    changed.set(kept[i]!.id, kept[i]!);
    removed.push(n.id);
  }
  return { kept, changed: [...changed.values()], removed };
}
