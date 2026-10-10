import type { IsoDate } from '@cuentasbot/shared';
import type { ContractExtraction, DocumentInput, Note, Obligation } from './domain.js';
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
/** Synthetic extraction (fictitious contractor) returned by FakeAI.extractContract. */
export function sampleExtraction(): ContractExtraction {
  return {
    secopId: 'CO1.PCCNTR.0000001',
    number: '0999',
    fullNumber: 'CPS-0999-2026',
    object: 'PRESTACIÓN DE SERVICIOS PROFESIONALES DE APOYO A LA GESTIÓN EN SALUD PÚBLICA.',
    entity: { name: 'ESE HOSPITAL REGIONAL NOROCCIDENTAL', nit: '807.008.842-9' },
    contractor: {
      fullName: 'MARÍA FERNANDA PRUEBA PÉREZ',
      docNumber: '1000000001',
      docIssuedIn: 'CÚCUTA',
      bankName: 'BANCOLOMBIA',
      accountType: 'ahorros',
      accountNumber: '00000000001',
    },
    totalValue: 12_000_000,
    monthlyValue: 4_000_000,
    paymentsCount: 3,
    termText: '3 MESES',
    startDate: null,
    endDate: '2026-12-31',
    processArea: 'SALUD PÚBLICA',
    supervisor: { name: 'SUPERVISOR DE PRUEBA', title: 'SUBGERENTE' },
    obligations: [
      { kind: 'specific', number: 1, text: 'Realizar seguimiento a la vigilancia en salud pública.' },
      { kind: 'specific', number: 2, text: 'Capacitar al personal en la ruta de misión médica.' },
      { kind: 'specific', number: 3, text: 'Reserva y confidencialidad de la información.' },
    ],
    schedule: [],
    warnings: [],
  };
}

export class FakeAI implements AI {
  constructor(private readonly extraction: ContractExtraction = sampleExtraction()) {}

  async extractContract(_docs: DocumentInput[]): Promise<ContractExtraction> {
    return structuredClone(this.extraction);
  }

  /** Understands "el valor mensual es $N" for tests; otherwise returns the extraction unchanged. */
  async correctExtraction(e: ContractExtraction, instruction: string): Promise<ContractExtraction> {
    const m = /mensual\D+([\d.]+)/i.exec(instruction);
    return m ? { ...e, monthlyValue: Number(m[1]!.replace(/\./g, '')) } : structuredClone(e);
  }

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
