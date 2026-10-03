import type { IsoDate } from '@cuentasbot/shared';
import type { Note, Obligation } from './domain.js';
import type { AI, ClassifyResult, Clock, DraftResult, STT } from './ports.js';
import { normalize } from './text.js';

const STOPWORDS = new Set(
  'para como con las los del una que por este esta entre sobre donde cada cuando sean sea ante desde hasta según segun demás demas otros otras entidad contrato presente'.split(
    ' ',
  ),
);

function words(t: string): Set<string> {
  return new Set(
    normalize(t)
      .split(' ')
      .filter((w) => w.length > 3 && !STOPWORDS.has(w))
      .map((w) => w.slice(0, 6)), // crude stemming: "capacitación" ~ "capacité"
  );
}

const FIRST_PERSON: [RegExp, string][] = [
  [/^(hoy|ayer|antier|anteayer)\s+/i, ''],
  [
    /^(el|este)\s+(\d{1,2}(\/\d{1,2})?|lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)(\s+de\s+[a-z]+)?\s*,?\s+/i,
    '',
  ],
  [/^realic[eé](?=\s|$)/i, 'Se realizó'],
  [/^hice(?=\s|$)/i, 'Se hizo'],
  [/^asist[ií](?=\s|$)/i, 'Se asistió'],
  [/^particip[eé](?=\s|$)/i, 'Se participó'],
  [/^capacit[eé](?=\s|$)/i, 'Se capacitó'],
  [/^acompa[ñn][eé](?=\s|$)/i, 'Se acompañó'],
  [/^envi[eé](?=\s|$)/i, 'Se envió'],
  [/^coordin[eé](?=\s|$)/i, 'Se coordinó'],
  [/^elabor[eé](?=\s|$)/i, 'Se elaboró'],
  [/^revis[eé](?=\s|$)/i, 'Se revisó'],
  [/^hice seguimiento(?=\s|$)/i, 'Se hizo seguimiento'],
];

export function impersonal(text: string): string {
  let t = text.trim();
  for (const [re, rep] of FIRST_PERSON) t = t.replace(re, rep);
  t = t.charAt(0).toUpperCase() + t.slice(1);
  return /[.!?]$/.test(t) ? t : `${t}.`;
}

/**
 * Deterministic stand-in for Claude, used by tests and the simulator.
 * It never invents: drafts are the contractor's own notes in impersonal form.
 */
export class FakeAI implements AI {
  async classifyNote(text: string, obligations: Obligation[]): Promise<ClassifyResult> {
    const note = words(text);
    let best: { key: string; score: number } | null = null;
    for (const o of obligations) {
      const ow = words(o.text);
      let score = 0;
      for (const w of note) if (ow.has(w)) score++;
      if (score > 0 && (!best || score > best.score)) best = { key: o.key, score };
    }
    if (!best) return { obligationKey: null, confidence: 0 };
    return { obligationKey: best.key, confidence: Math.min(1, best.score / 3) };
  }

  async draftObligation(_o: Obligation, notes: Note[]): Promise<DraftResult> {
    const useful = notes.filter((n) => n.text.trim().length > 0);
    if (!useful.length) return { status: 'needs_input', reason: 'Sin notas para esta obligación.' };
    const sorted = [...useful].sort((a, b) => (a.date < b.date ? -1 : 1));
    return { status: 'ok', paragraphs: sorted.map((n) => impersonal(n.text)) };
  }

  async rewrite(paragraphs: string[], instruction: string): Promise<string[]> {
    const m = /^\s*(agrega|añade|anade|incluye)\s+(que\s+)?(.+)$/i.exec(instruction);
    if (m) return [...paragraphs, impersonal(m[3]!)];
    return [impersonal(instruction)];
  }
}

/** Treats the audio bytes as UTF-8 text (the simulator sends "/audio <texto>"). */
export class FakeSTT implements STT {
  async transcribe(audio: Buffer): Promise<string> {
    return audio.toString('utf8');
  }
}

export class FixedClock implements Clock {
  constructor(private date: IsoDate) {}
  set(date: IsoDate): void {
    this.date = date;
  }
  today(): IsoDate {
    return this.date;
  }
  now(): Date {
    return new Date(`${this.date}T15:00:00Z`);
  }
}

/** Real clock in America/Bogota (UTC−5, no DST). */
export class BogotaClock implements Clock {
  today(): IsoDate {
    return new Date(Date.now() - 5 * 3600_000).toISOString().slice(0, 10);
  }
  now(): Date {
    return new Date();
  }
}
