import { describe, expect, it } from 'vitest';
import { DEMO_IDS } from '../src/demo.js';
import { periodGoals } from '../src/goals.js';
import { harness, show } from './harness.js';

/** EBS demo contract with monthly goals in its obligation 1 (as read from the clauses at setup). */
function withGoals() {
  const h = harness();
  h.store.data.contracts = h.store.data.contracts.map((c) =>
    c.id === DEMO_IDS.ebs
      ? {
          ...c,
          goals: [
            { obligation: 1, label: 'Seguimiento plan de cuidado familiar', monthly: [80] },
            { obligation: 1, label: 'Tamizajes en salud mental', monthly: [100, 100, 100, 100, 100] },
            { obligation: 2, label: 'Jornada integral', monthly: [2, 0, 1, 1, 1] },
          ],
        }
      : c,
  );
  // One activity in the account in course (EBS report 2: September).
  void h.store.addNote({
    id: 'note-goals',
    userId: DEMO_IDS.maria,
    contractId: DEMO_IDS.ebs,
    date: '2026-09-20',
    text: 'Realicé seguimientos a las familias del territorio.',
    obligationKey: 'specific-1',
    evidenceIds: [],
    createdAt: '2026-09-20T15:00:00Z',
  });
  return h;
}

describe('monthly goals (ADR-051)', () => {
  it('takes the goal of each month; a month with 0 has no goal', () => {
    const h = withGoals();
    const c = h.store.data.contracts.find((x) => x.id === DEMO_IDS.ebs)!;
    expect(periodGoals(c, 1).map((g) => [g.label, g.target])).toEqual([
      ['Seguimiento plan de cuidado familiar', 80],
      ['Tamizajes en salud mental', 100],
      ['Jornada integral', 2],
    ]);
    expect(periodGoals(c, 2).map((g) => g.label)).not.toContain('Jornada integral');
  });

  it('asks how many before drafting, warns below 70 %, and puts them in the review', async () => {
    const h = withGoals();
    await h.say('ver borrador');
    let out = show(await h.press(`c:${DEMO_IDS.ebs}`));
    expect(out[0]).toMatch(/^🎯 Antes de redactar tu informe .*: ¿cuántas hiciste de cada meta este mes\?/);
    expect(out[0]).toContain('1. Seguimiento plan de cuidado familiar (obl. 1) – meta 80');
    expect(out[1]).toMatch(/\[✅ Cumplí todas\]$/);

    expect(out[0]).not.toContain('Jornada integral'); // month 2 has no goal for it
    out = show(await h.say('80, 60'));
    expect(out[0]).toContain('• Tamizajes en salud mental: meta 100 · realizadas 60 ⚠️');
    expect(out[1]).toMatch(/^⚠️ Una meta quedó por debajo del 70 %/);
    out = show(await h.press('goal:fix'));
    expect(out[0]).toMatch(/^🎯 Antes de redactar/);
    out = show(await h.press('goal:all'));
    expect(out[0]).not.toContain('⚠️');
    out = show(await h.press('goal:ok'));
    expect(out.join('\n')).toContain('✍️ Estoy redactando tu informe');
    const counts = await h.store.getGoalCounts(DEMO_IDS.maria, DEMO_IDS.ebs, 2);
    expect(counts).toEqual([80, 100, 0]);
  });

  it('asks again for the quantities it did not understand', async () => {
    const h = withGoals();
    await h.say('ver borrador');
    await h.press(`c:${DEMO_IDS.ebs}`);
    const out = show(await h.say('80'));
    expect(out[0]).toBe(
      'No entendí cuántas hiciste de: *Tamizajes en salud mental*. Escríbeme todas las cantidades en orden, separadas por comas.',
    );
  });

  it('asks for the documents only this contract requires, besides the entity checklist', async () => {
    const h = harness();
    h.store.data.contracts = h.store.data.contracts.map((c) =>
      c.id === DEMO_IDS.ebs
        ? { ...c, extraSupports: ['Certificado de ejecución por el Supervisor del Municipio'] }
        : c,
    );
    const out = show(await h.say('¿Qué me falta?')).join('\n');
    expect(out).toContain('Certificado de ejecución por el Supervisor del Municipio');
  });
});
