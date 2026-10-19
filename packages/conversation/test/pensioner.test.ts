import { describe, expect, it } from 'vitest';
import { DEMO_IDS } from '../src/demo.js';
import { FakeAI } from '../src/fakes.js';
import { harness, show } from './harness.js';

describe('pensioner (PILA without pension)', () => {
  it('asks once, keeps the answer and stops asking for the pension certificate', async () => {
    const ai = new FakeAI();
    ai.pilaWithoutPension = true;
    const h = harness({ ai });
    let out = show(await h.document('PILA septiembre.pdf'));
    expect(out.at(-1)).toBe(
      '🧾 La planilla no tiene aporte a pensión. ¿Eres pensionado(a)? Te lo pregunto una sola vez. [Sí, pensionado(a)] [No]',
    );
    out = show(await h.press('pens:yes'));
    expect(out[0]).toMatch(/^✅ Listo, lo guardé/);
    expect(await h.store.getProfileFlags(DEMO_IDS.maria)).toEqual({ pensioner: true });
    // Next sheet: no question; and the checklist no longer asks for the pension certificate.
    h.store.data.supports = h.store.data.supports.filter((s) => s.code !== 'AFP');
    out = show(await h.document('PILA septiembre.pdf'));
    expect(out.join('\n')).not.toContain('pensionado');
    expect(show(await h.say('¿Qué me falta?')).join('\n')).not.toContain('afiliación a pensión');
  });

  it('warns every time whoever is not a pensioner', async () => {
    const ai = new FakeAI();
    ai.pilaWithoutPension = true;
    const h = harness({ ai });
    await h.document('PILA septiembre.pdf');
    expect(show(await h.press('pens:no'))[0]).toMatch(
      /^⚠️ Entonces la planilla debe tener el aporte a pensión/,
    );
    const out = show(await h.document('PILA septiembre.pdf'));
    expect(out.at(-1)).toMatch(/^⚠️ La planilla no tiene aporte a pensión y no eres pensionado\(a\)/);
  });
});
