import { describe, expect, it } from 'vitest';
import { impersonal } from '../src/fakes.js';
import { matchCommand } from '../src/intents.js';
import { parseActivityDate } from '../src/text.js';

describe('parseActivityDate (today = Monday 2026-09-28)', () => {
  const today = '2026-09-28';
  it.each([
    ['hoy fui a El Carmen', '2026-09-28'],
    ['ayer hice la reunión', '2026-09-27'],
    ['antier capacité', '2026-09-26'],
    ['el viernes asistí al comité', '2026-09-25'],
    ['el lunes', '2026-09-28'],
    ['el 15 hice visita', '2026-09-15'],
    ['el 30 hice visita', '2026-08-30'],
    ['el 15/09 envié muestras', '2026-09-15'],
    ['el 3 de agosto', '2026-08-03'],
    ['el 3 de diciembre', '2025-12-03'],
    ['capacitación en misión médica', '2026-09-28'],
  ])('%s → %s', (t, d) => {
    expect(parseActivityDate(t, today)).toBe(d);
  });
});

describe('commands', () => {
  it('matches synonyms, accents and punctuation', () => {
    expect(matchCommand('¿Qué me falta?')).toBe('status');
    expect(matchCommand('MENÚ')).toBe('menu');
    expect(matchCommand('No más recordatorios')).toBe('stop_reminders');
    expect(matchCommand('hoy hice el menú del comité')).toBeNull();
  });
});

describe('impersonal', () => {
  it('turns first person into impersonal past', () => {
    expect(impersonal('capacité a 30 personas')).toBe('Se capacitó a 30 personas.');
    expect(impersonal('Hoy realicé visita a la vereda')).toBe('Se realizó visita a la vereda.');
  });
});
