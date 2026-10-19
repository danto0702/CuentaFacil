import { describe, expect, it } from 'vitest';
import { parseBankText } from '../src/bank.js';
import { DEMO_IDS } from '../src/demo.js';
import { FakeAI, sampleExtraction } from '../src/fakes.js';
import { matchCommand } from '../src/intents.js';
import { harness, show } from './harness.js';

describe('bank account', () => {
  it('reads an account the contractor writes', () => {
    expect(parseBankText('Corriente Davivienda 0123-4567-8901')).toEqual({
      bankName: 'DAVIVIENDA',
      accountType: 'corriente',
      accountNumber: '012345678901',
    });
    expect(parseBankText('cuenta de ahorros banco de bogotá 123 456 789')).toMatchObject({
      bankName: 'BANCO DE BOGOTÁ',
      accountType: 'ahorros',
    });
    expect(parseBankText('Nequi 3001234567')).toMatchObject({ bankName: 'NEQUI', accountType: null });
    // Activities with numbers are not accounts.
    expect(parseBankText('Visité 25 familias en la vereda El Tarra')).toBeNull();
    expect(parseBankText('Radiqué el oficio 2026001234 en la secretaría')).toBeNull();
  });

  it('understands the request in other words, before «la cuenta» of the report', () => {
    expect(matchCommand('cambiar mi cuenta bancaria')).toBe('bank');
    expect(matchCommand('quiero cambiar la cuenta bancaria')).toBe('bank');
    expect(matchCommand('cambié de banco')).toBe('bank');
    expect(matchCommand('quiero la cuenta de cobro')).toBe('draft');
  });

  it('changes the account written by the contractor, after confirming it', async () => {
    const h = harness();
    let out = show(await h.say('cambiar mi cuenta bancaria'));
    expect(out[0]).toContain('Hoy tengo: *Ahorros Banco de Prueba ****0001*.');
    expect(out[0]).toContain('*certificación bancaria* de tu cuenta');

    out = show(await h.say('Corriente Davivienda 0123-4567-8901'));
    expect(out[0]).toMatch(/^🏦 ¿Guardo esta cuenta para los documentos\?/);
    expect(out[0]).toContain('• Número: *012345678901*');
    expect(out[0]).toMatch(/\[✅ Sí, guardarla\] \[✏️ Corregir\]$/);

    out = show(await h.press('bank:yes'));
    expect(out[0]).toBe(
      '✅ Guardé la cuenta *Corriente DAVIVIENDA 012345678901*. Así sale en tus próximos documentos.',
    );
    expect(await h.store.getUser(DEMO_IDS.maria)).toMatchObject({
      bankName: 'DAVIVIENDA',
      accountType: 'corriente',
      accountNumber: '012345678901',
    });
    expect(show(await h.say('mis datos'))[0]).toContain('Cuenta corriente DAVIVIENDA ****8901');
  });

  it('reads the bank certificate, asks the type when missing, and keeps the certificate', async () => {
    const h = harness();
    await h.say('cuenta bancaria');
    let out = show(await h.document('certificacion.pdf'));
    expect(out[0]).toContain('• Banco: *BANCOLOMBIA*');
    expect(out[0]).toContain('• A nombre de: MARÍA FERNANDA PRUEBA FICTICIA');
    expect(out[0]).not.toContain('⚠️');
    await h.press('bank:yes');
    expect((await h.store.getUser(DEMO_IDS.maria)).accountNumber).toBe('12345678901');
    expect((await h.store.listSupports(DEMO_IDS.maria)).some((s) => s.code === 'CUENTA_BANCARIA')).toBe(true);

    await h.say('cambiar cuenta bancaria');
    out = show(await h.say('Bancolombia 98765432'));
    expect(out[0]).toBe(
      '🏦 ¿La cuenta *BANCOLOMBIA 98765432* es de ahorros o corriente? [Ahorros] [Corriente]',
    );
    out = show(await h.press('bank:ahorros'));
    expect(out[0]).toContain('• Tipo: *Ahorros*');
  });

  it('says when the document is not a certificate, and leaves for other messages', async () => {
    const h = harness();
    await h.say('cambiar mi cuenta bancaria');
    expect(show(await h.document('factura.pdf'))[0]).toMatch(/No encontré los datos de una cuenta/);
    expect(show(await h.say('menú'))[0]).toMatch(/¿Qué quieres hacer\?/);
    expect((await h.store.getUser(DEMO_IDS.maria)).accountNumber).toBe('00000000001');
  });

  it('asks once for a missing account, and a photo that is not a certificate stays an evidence', async () => {
    const h = harness();
    const u = await h.store.getUser(DEMO_IDS.maria);
    await h.store.saveUserProfile({ ...u, bankName: '', accountNumber: '' });
    const out = show(await h.say('menú'));
    expect(out.at(-1)).toMatch(/^🏦 Me falta un dato para tus documentos: la cuenta bancaria/);
    const photo = show(await h.photo());
    expect(photo.join('\n')).not.toMatch(/No encontré los datos de una cuenta/);
    // Not again the same day.
    expect(show(await h.say('menú')).join('\n')).not.toContain('Me falta un dato');
  });
});

describe('bank account before generating', () => {
  async function withoutAccount() {
    const h = harness();
    const u = await h.store.getUser(DEMO_IDS.maria);
    await h.store.saveUserProfile({ ...u, bankName: '', accountNumber: '' });
    h.store.data.socialSecurity = [];
    const ps = await h.store.listPeriods(DEMO_IDS.ebs);
    await h.store.savePeriods(
      DEMO_IDS.ebs,
      ps.map((p) => (p.number === 1 ? { ...p, status: 'delivered' } : p)),
    );
    return h;
  }

  it('warns that the account is missing, and generates without it on request', async () => {
    const h = await withoutAccount();
    let out = show(await h.press(`redo:${DEMO_IDS.ebs}:1`));
    expect(out[0]).toMatch(
      /^🏦 No tengo la cuenta bancaria donde te pagan: en tu informe 01-05 .* quedaría en blanco/,
    );
    expect(out[0]).toMatch(/\[🏦 Enviar cuenta\] \[Generar sin cuenta\]$/);
    // Then the PILA question, and the bank warning is not asked again.
    out = show(await h.press('nobank:go'));
    expect(out[0]).toMatch(/^🧾 Para llenar la tabla de seguridad social/);
    out = show(await h.press('nopila:go'));
    expect(out[0]).toBe('⏳ Estoy generando tus documentos, dame un momento…');
  });

  it('takes the account from the warning, and then generates', async () => {
    const h = await withoutAccount();
    await h.press(`redo:${DEMO_IDS.ebs}:1`);
    expect(show(await h.press('nobank:send'))[0]).toContain('*certificación bancaria* de tu cuenta');
    await h.say('Ahorros Bancolombia 12345678');
    await h.press('bank:yes');
    const out = show(await h.press(`redo:${DEMO_IDS.ebs}:1`));
    expect(out[0]).toMatch(/^🧾 Para llenar la tabla de seguridad social/);
  });
});

describe('bank account during the setup', () => {
  it('asks for it when SECOP has none, and can be left for later', async () => {
    const e = sampleExtraction();
    const ai = new FakeAI({
      ...e,
      contractor: { ...e.contractor, bankName: null, accountType: null, accountNumber: null },
    });
    const h = harness({ phone: '+573009998866', today: '2026-10-10', ai });
    await h.say('Hola');
    await h.press('consent:yes');
    await h.press(`ent:${DEMO_IDS.hrno}`);
    await h.document('CO1.PCCNTR.0000001.pdf');
    let out = show(await h.document('clausulado.pdf'));
    expect(out[0]).toContain('• Cuenta: no la encontré');
    out = show(await h.press('setup:ok'));
    expect(out[0]).toMatch(/^🏦 En SECOP no encontré la cuenta bancaria.*\[Después\]$/s);

    out = show(await h.say('Ahorros Banco Agrario 4567 8901 2345'));
    expect(out[0]).toContain('• Banco: *BANCO AGRARIO*');
    expect(out[0]).toMatch(/\[✅ Sí, guardarla\] \[✏️ Corregir\] \[Después\]$/);
    out = show(await h.press('sbank:yes'));
    expect(out[0]).toBe('✅ Guardé la cuenta.');
    expect(out[1]).toMatch(/fecha del \*acta de inicio\*/);

    await h.say('01/10/2026');
    await h.press('mode:month_end');
    await h.press('cert:yes');
    await h.press('prior:none');
    await h.press('sig:skip');
    const user = await h.store.getUserByPhone('+573009998866');
    expect(user).toMatchObject({
      bankName: 'BANCO AGRARIO',
      accountType: 'ahorros',
      accountNumber: '456789012345',
    });
  });

  it('continues without the account on «Después»', async () => {
    const e = sampleExtraction();
    const ai = new FakeAI({
      ...e,
      contractor: { ...e.contractor, bankName: null, accountType: null, accountNumber: null },
    });
    const h = harness({ phone: '+573009998855', today: '2026-10-10', ai });
    await h.say('Hola');
    await h.press('consent:yes');
    await h.press(`ent:${DEMO_IDS.hrno}`);
    await h.document('CO1.PCCNTR.0000001.pdf');
    await h.document('clausulado.pdf');
    await h.press('setup:ok');
    const out = show(await h.press('sbank:later'));
    expect(out[0]).toMatch(/te la recuerdo antes de generar los documentos/);
    expect(out[1]).toMatch(/fecha del \*acta de inicio\*/);
  });
});
