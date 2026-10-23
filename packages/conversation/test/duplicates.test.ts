import { describe, expect, it } from 'vitest';
import { DEMO_IDS } from '../src/demo.js';
import type { Note } from '../src/domain.js';
import { dedupeNotes, similarText } from '../src/duplicates.js';
import { harness, show } from './harness.js';

const SIMULACRO =
  'Se apoyó el proceso de coordinación del simulacro nacional de sismo, el proceso de preparación, el diseño de la estrategia de intervención y actuación en el marco del simulacro, además de la posterior mesa de análisis como jefe de brigada.';

describe('repeated activities', () => {
  it('takes the same text or a typo as repeated, and another word or number as another activity', () => {
    expect(similarText(SIMULACRO, SIMULACRO)).toBe(true);
    expect(similarText(SIMULACRO, SIMULACRO.replace('análisis', 'analisis').replace('sismo', 'sisno'))).toBe(
      true,
    );
    expect(
      similarText(
        'Hoy capacité al personal en la ruta de misión médica',
        'Hoy capacité de nuevo al personal en la ruta de misión médica',
      ),
    ).toBe(false);
    expect(
      similarText('Visité 25 familias en la vereda El Tarra', 'Visité 30 familias en la vereda El Tarra'),
    ).toBe(false);
  });

  it('keeps the first note with the obligations and photos of both', () => {
    const base = { userId: 'u', contractId: 'c', date: '2026-10-22', text: SIMULACRO };
    const a: Note = {
      ...base,
      id: 'a',
      obligationKey: 'o8',
      evidenceIds: ['f1'],
      createdAt: '2026-10-22T22:51:00Z',
    };
    const b: Note = {
      ...base,
      id: 'b',
      obligationKey: 'o8',
      alsoKeys: ['o9'],
      evidenceIds: ['f2'],
      createdAt: '2026-10-22T22:54:00Z',
    };
    const other: Note = { ...a, id: 'x', date: '2026-10-23', createdAt: '2026-10-23T10:00:00Z' };
    const r = dedupeNotes([b, a, other]);
    expect(r.removed).toEqual(['b']);
    expect(r.kept.map((n) => n.id)).toEqual(['a', 'x']);
    expect(r.changed[0]).toMatchObject({
      id: 'a',
      obligationKey: 'o8',
      alsoKeys: ['o9'],
      evidenceIds: ['f1', 'f2'],
    });
  });

  it('does not register an activity sent again the same day', async () => {
    const h = harness();
    await h.say('Asistí a la reunión del comité de vigilancia en Ábrego');
    await h.press(`c:${DEMO_IDS.ebs}`);
    const notes = h.store.data.notes.length;
    await h.say('Asistí a la reunión del comité de vigilancia en Ábrego');
    const out = show(await h.press(`c:${DEMO_IDS.ebs}`));
    expect(out[0]).toMatch(
      /^♻️ Esa actividad ya la tenía registrada el 28\/09\/2026(?: en la obligación \d+)?, así que no la anoté de nuevo\./,
    );
    expect(h.store.data.notes.length).toBe(notes);
  });

  it('leaves one of the repeated activities already registered before drafting or the status', async () => {
    const h = harness();
    await h.say('Asistí a la reunión del comité de vigilancia en Ábrego');
    await h.press(`c:${DEMO_IDS.ebs}`);
    const first = h.store.data.notes.at(-1)!;
    // Registered twice before this change, the second also in another obligation.
    const other = (await h.store.getContract(DEMO_IDS.ebs)).obligations.find(
      (o) => o.kind === 'specific' && o.key !== first.obligationKey,
    )!;
    await h.store.addNote({
      ...first,
      id: 'dup',
      alsoKeys: [other.key],
      createdAt: new Date(Date.parse(first.createdAt) + 180_000).toISOString(),
    });
    const out = show(await h.say('estado'));
    expect(out.join('\n')).toContain('♻️ Encontré una actividad registrada dos veces y dejé una sola');
    expect(h.store.data.notes.some((n) => n.id === 'dup')).toBe(false);
    expect((await h.store.getNote(first.id)).alsoKeys).toEqual([other.key]);
  });
});
