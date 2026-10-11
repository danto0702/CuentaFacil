import { describe, expect, it } from 'vitest';
import { impersonal } from '../src/fakes.js';
import { matchCommand, matchMonthRequest } from '../src/intents.js';
import { parseActivityDate, parseActivityWhen } from '../src/text.js';

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

describe('parseActivityWhen (today = 2026-10-11)', () => {
  const today = '2026-10-11';
  it('reads whole months and leaves notes without a date as null', () => {
    expect(parseActivityWhen('seguimiento a las UPGD en el mes de Julio', today)).toEqual({
      kind: 'month',
      from: '2026-07-01',
      to: '2026-07-31',
    });
    expect(parseActivityWhen('reunión en octubre', today)).toEqual({
      kind: 'month',
      from: '2026-10-01',
      to: '2026-10-11',
    });
    expect(parseActivityWhen('informe de diciembre', today)).toEqual({
      kind: 'month',
      from: '2025-12-01',
      to: '2025-12-31',
    });
    expect(parseActivityWhen('el 15 de julio revisé bases', today)).toEqual({
      kind: 'day',
      date: '2026-07-15',
    });
    expect(parseActivityWhen('capacité al personal', today)).toBeNull();
  });
});

describe('requests in other words', () => {
  it('recognizes short requests and leaves activity notes alone', () => {
    expect(matchCommand('Genera el informe')).toBe('draft');
    expect(matchCommand('hazme la cuenta de cobro de julio')).toBe('draft');
    expect(matchCommand('ya puedes hacer los informes?')).toBe('draft');
    expect(matchCommand('borra la última nota')).toBe('undo_note');
    expect(matchCommand('como voy')).toBe('status');
    expect(
      matchCommand('Se elaboró el informe de vigilancia epidemiológica de las UPGD de Ábrego y El Carmen'),
    ).toBeNull();
    expect(matchCommand('Elaboré el informe del COVE')).toBeNull();
  });
});

describe('matchMonthRequest', () => {
  it('reads requests about the report of a month', () => {
    expect(matchMonthRequest('Sigamos trabajando en el informe de julio')).toEqual({ month: 7, redo: false });
    expect(matchMonthRequest('Rehacer Julio')).toEqual({ month: 7, redo: true });
    expect(matchMonthRequest('informe de agosto')).toEqual({ month: 8, redo: false });
    expect(matchMonthRequest('vuelve a generar la cuenta de septiembre')).toEqual({ month: 9, redo: true });
  });

  it('leaves activities alone', () => {
    expect(matchMonthRequest('Entregué el informe de julio a la secretaría de salud')).toBeNull();
    expect(matchMonthRequest('En julio capacité a 30 personas')).toBeNull();
    expect(matchMonthRequest('genera el informe')).toBeNull();
  });
});
