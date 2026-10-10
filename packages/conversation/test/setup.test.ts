import { describe, expect, it } from 'vitest';
import { DEMO_IDS } from '../src/demo.js';
import { FakeAI, sampleExtraction } from '../src/fakes.js';
import { harness, show } from './harness.js';

const NEW_PHONE = '+573009998877';

describe('registration and contract setup by documents', () => {
  it('asks for consent, stores nothing on "no", and configures a contract on "yes"', async () => {
    const h = harness({ phone: NEW_PHONE, today: '2026-10-10' });

    let out = show(await h.say('Hola'));
    expect(out[0]).toMatch(/^👋 ¡Hola! Soy Pascal/);
    expect(out[1]).toContain('<Ver política → https://pascalia.lat/politica-de-datos/>');
    expect(out[2]).toBe('¿Aceptas la política de tratamiento de datos? [Acepto] [No acepto]');

    out = show(await h.press('consent:no'));
    expect(out[0]).toMatch(/No guardé ningún dato tuyo/);
    expect(await h.store.getUserByPhone(NEW_PHONE)).toBeNull();

    out = show(await h.press('consent:yes'));
    expect(out[0]).toMatch(/Envíame el \*PDF del contrato\*/);
    const user = await h.store.getUserByPhone(NEW_PHONE);
    expect(user).not.toBeNull();
    expect(h.store.data.consents?.[0]).toMatchObject({ policyVersion: '1.1', accepted: true });

    // A photo instead of the PDF → asks again.
    expect(show(await h.photo())[0]).toMatch(/Necesito el contrato en \*PDF\*/);
    expect(show(await h.document('CO1.PCCNTR.0000001.pdf'))[0]).toMatch(/Ahora envíame el \*clausulado\*/);

    out = show(await h.document('clausulado.pdf'));
    expect(out[0]).toContain('• Contrato: CPS-0999-2026 (SECOP CO1.PCCNTR.0000001)');
    expect(out[0]).toContain('• Inicio (acta de inicio): no lo encontré');
    expect(out[0]).toContain('C.C. ****0001');
    expect(out[1]).toContain('1. Realizar seguimiento a la vigilancia en salud pública.');
    expect(out.at(-1)).toBe('¿Está todo bien? [✅ Todo bien] [✏️ Corregir algo]');

    // Correction through the AI, then confirm.
    await h.press('setup:fix');
    out = show(await h.say('el valor mensual es $4.500.000'));
    expect(out[0]).toContain('mensual $ 4.500.000');
    out = show(await h.press('setup:ok'));
    expect(out[0]).toMatch(/fecha del \*acta de inicio\*/);
    expect(show(await h.say('31/02/2026'))[0]).toMatch(/No entendí la fecha/);
    out = show(await h.say('01/10/2026'));
    expect(out[0]).toMatch(/¿Cómo cortas tus cuentas\?.*\[Fin de mes\] \[Fecha a fecha\]$/s);
    out = show(await h.press('mode:month_end'));
    expect(out[0]).toMatch(/certificación de cumplimiento/);
    out = show(await h.press('cert:yes'));
    expect(out[0]).toBe('¿Ya cobraste informes de este contrato? [Es el primero] [Ya cobré informes]');
    out = show(await h.press('prior:none'));
    expect(out[0]).toMatch(/foto de tu firma.*\[Omitir\]$/s);
    out = show(await h.press('sig:skip'));
    expect(out[0]).toMatch(
      /^🎉 ¡Listo! Tu contrato \*CPS-0999-2026\* quedó configurado: 3 cuentas \(corte a fin de mes\)/,
    );
    expect(out[0]).toContain('Tu próxima cuenta va del 01/10/2026 al 31/10/2026.');

    const contracts = await h.store.listContracts(user!.id);
    expect(contracts).toHaveLength(1);
    expect(contracts[0]).toMatchObject({ monthlyValue: 4_500_000, periodMode: 'month_end' });
    const periods = await h.store.listPeriods(contracts[0]!.id);
    expect(periods.map((p) => [p.from, p.to, p.status])).toEqual([
      ['2026-10-01', '2026-10-31', 'collecting'],
      ['2026-11-01', '2026-11-30', 'collecting'],
      ['2026-12-01', '2026-12-31', 'collecting'],
    ]);
    expect((await h.store.getUser(user!.id)).fullName).toBe('MARÍA FERNANDA PRUEBA PÉREZ');

    // Now registered: a daily note works as usual.
    out = show(await h.say('Hoy capacité al personal en la ruta de misión médica'));
    expect(out[0]).toMatch(/^✅ Anotado el 10\/10\/2026/);
  });

  it('marks already-billed periods as delivered and stores the signature', async () => {
    const h = harness({ phone: NEW_PHONE, today: '2026-10-10' });
    await h.press('consent:yes');
    await h.document('contrato.pdf');
    await h.document('clausulado.pdf');
    await h.press('setup:ok');
    await h.say('01/10/2026');
    await h.press('mode:month_end');
    await h.press('cert:no');
    await h.press('prior:some');
    expect(show(await h.say('dos'))[0]).toMatch(/Escribe solo el número/);
    const out = show(await h.say('1'));
    expect(out[0]).toMatch(/último informe en Word o PDF/);
    expect(show(await h.photo())[0]).toMatch(/Guardé tu firma/);
    const user = (await h.store.getUserByPhone(NEW_PHONE))!;
    const [contract] = await h.store.listContracts(user.id);
    const periods = await h.store.listPeriods(contract!.id);
    expect(periods.map((p) => p.status)).toEqual(['delivered', 'collecting', 'collecting']);
    expect((await h.store.listSupports(user.id)).map((s) => s.code)).toEqual([
      'CONTRATO_SECOP',
      'CLAUSULADO',
      'FIRMA',
    ]);
  });

  it('pauses setup with "cancelar" and resumes with "agregar contrato"', async () => {
    const h = harness({ phone: NEW_PHONE, today: '2026-10-10' });
    await h.press('consent:yes');
    expect(show(await h.say('cancelar'))[0]).toMatch(/dejé la configuración en pausa/);
    // No contracts yet: any message restarts the setup.
    expect(show(await h.say('hola qué tal'))[0]).toMatch(/Para empezar necesito configurar tu contrato/);
  });
});

describe('entity rules over the AI reading', () => {
  it('uses the registry start date, the entity supervisor and only the specific obligations; asks the place of issue', async () => {
    const extraction = {
      ...sampleExtraction(),
      contractor: { ...sampleExtraction().contractor, docIssuedIn: null },
      supervisor: { name: 'OTRA PERSONA', title: '' },
      obligations: [
        ...sampleExtraction().obligations,
        { kind: 'general' as const, number: 1, text: 'Cumplir con las metas asignadas.' },
      ],
      warnings: [
        'SECOP no registra fecha de inicio; verificar la fecha del acta de inicio.',
        'El clausulado no indica el cargo del supervisor.',
        'No aparece el lugar de expedición de la cédula del contratista.',
        'El NIT de la entidad se tomó del encabezado del clausulado.',
        'La fecha de terminación no cuadra con el plazo.',
      ],
    };
    const h = harness({ phone: NEW_PHONE, today: '2026-10-10', ai: new FakeAI(extraction) });
    h.store.data.registry = [
      {
        entityId: DEMO_IDS.hrno,
        contractCode: '999',
        docNumber: '1000000001',
        startDate: '2026-10-01',
        termDays: 90,
        initialValue: 12_000_000,
      },
    ];
    await h.press('consent:yes');
    await h.document('contrato.pdf');
    let out = show(await h.document('clausulado.pdf'));
    expect(out[0]).toContain('• Inicio (acta de inicio): 01/10/2026 (base de contratos de la entidad)');
    expect(out[0]).toContain('• Supervisor: CARLOS EDUARDO BONILLA DIAZ (Subgerente)');
    expect(out[0]).toContain('• Obligaciones específicas: 3');
    expect(out[0]).toContain('⚠️ La fecha de terminación no cuadra con el plazo.');
    expect(out[0]).not.toMatch(/supervisor\.|NIT de la entidad|expedición|acta de inicio\./);
    expect(out[1]).not.toContain('metas asignadas');

    out = show(await h.press('setup:ok'));
    expect(out[0]).toMatch(/expedida tu cédula/);
    out = show(await h.say('Ábrego, Norte de Santander'));
    // Start date known from the registry → straight to the cut-off question.
    expect(out[0]).toMatch(/¿Cómo cortas tus cuentas\?/);
    await h.press('mode:month_end');
    await h.press('cert:no');
    await h.press('prior:none');
    await h.press('sig:skip');

    const user = (await h.store.getUserByPhone(NEW_PHONE))!;
    expect(user.docIssuedIn).toBe('Ábrego, Norte de Santander');
    const [contract] = await h.store.listContracts(user.id);
    expect(contract!.startDate).toBe('2026-10-01');
    expect(contract!.supervisor).toEqual({ name: 'CARLOS EDUARDO BONILLA DIAZ', title: 'Subgerente' });
    expect(contract!.obligations.map((o) => o.kind)).toEqual(['specific', 'specific', 'specific']);
  });
});
