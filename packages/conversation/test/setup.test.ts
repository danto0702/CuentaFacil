import { describe, expect, it } from 'vitest';
import { DEMO_IDS, DEMO_PHONES } from '../src/demo.js';
import { FakeAI, sampleExtraction } from '../src/fakes.js';
import { harness, show } from './harness.js';

const NEW_PHONE = '+573009998877';

describe('registration and contract setup by documents', () => {
  it('asks for consent, stores nothing on "no", and configures a contract on "yes"', async () => {
    const h = harness({ phone: NEW_PHONE, today: '2026-10-10' });

    let out = show(await h.say('Hola'));
    expect(out[0]).toMatch(/^👋 ¡Hola! Soy Pascal/);
    expect(out[1]).toContain('<Ver política → https://pascalia.lat/politica-de-datos/>');
    expect(out[2]).toBe(
      '¿Aceptas la política de tratamiento de datos y los términos del servicio? [Acepto] [No acepto]',
    );

    out = show(await h.press('consent:no'));
    expect(out[0]).toMatch(/No guardé ningún dato tuyo/);
    expect(await h.store.getUserByPhone(NEW_PHONE)).toBeNull();

    out = show(await h.press('consent:yes'));
    expect(out[0]).toBe('✅ ¡Gracias! Ahora configuremos tu contrato.');
    expect(out[1]).toMatch(/^🏥 ¿Con qué institución es tu contrato\? \{HRNO \| .* \| Otra institución\}$/);
    out = show(await h.press(`ent:${DEMO_IDS.hrno}`));
    expect(out[0]).toMatch(/Envíame el \*PDF del contrato\*/);
    const user = await h.store.getUserByPhone(NEW_PHONE);
    expect(user).not.toBeNull();
    expect(h.store.data.consents?.[0]).toMatchObject({ policyVersion: '1.1', accepted: true });
    // The same 'Acepto' covers the terms of service in force.
    expect(h.store.data.consents?.[1]).toMatchObject({ kind: 'terms', policyVersion: '1.1', accepted: true });

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
    await h.press(`ent:${DEMO_IDS.hrno}`);
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

  it('in live billing, asks for the configuration payment before activating the contract', async () => {
    const h = harness({ phone: NEW_PHONE, today: '2026-10-10' });
    h.store.data.billing = { mode: 'live', prices: { setup: 15_000, report: 50_000 } };
    await h.press('consent:yes');
    await h.press(`ent:${DEMO_IDS.hrno}`);
    await h.document('contrato.pdf');
    await h.document('clausulado.pdf');
    await h.press('setup:ok');
    await h.say('01/10/2026');
    await h.press('mode:month_end');
    await h.press('cert:no');
    await h.press('prior:none');
    const out = show(await h.press('sig:skip'));
    expect(out.at(-2)).toMatch(/^🎉 ¡Listo! Tu contrato .* quedó configurado/);
    expect(out.at(-2)).not.toContain('Desde ya cuéntame');
    expect(out.at(-1)).toMatch(
      /^💳 Para activar tu contrato .* el valor de la configuración es \*\$ 15\.000\*/,
    );
    const user = (await h.store.getUserByPhone(NEW_PHONE))!;
    const [contract] = await h.store.listContracts(user.id);
    expect((await h.store.findCharge(contract!.id, 'setup', null))?.status).toBe('pending');
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
    await h.press(`ent:${DEMO_IDS.hrno}`);
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
    expect(contract!.contractorDuties).toEqual(['Cumplir con las metas asignadas.']);
  });
});

describe('institution not configured yet ("Otra")', () => {
  it('collects a model report and the contract, and grants a free first report to the first contractor', async () => {
    const h = harness({ phone: NEW_PHONE, today: '2026-10-10' });
    await h.press('consent:yes');
    let out = show(await h.press('ent:other'));
    expect(out[0]).toMatch(/nombre completo/);
    out = show(await h.say('E.S.E. Hospital Emiro Quintero Cañizares'));
    // The documents the institution asks for: a checklist by numbers.
    expect(out[0]).toMatch(/^📋 ¿Qué documentos te pide \*E\.S\.E\. Hospital Emiro Quintero Cañizares\*/);
    expect(out[0]).toContain('1. Informe de actividades ✍️');
    expect(out[0]).toContain('15. Copia de la cédula');
    expect(show(await h.say('ninguno'))[0]).toMatch(/Escríbeme los números/);
    // At least one document Pascal prepares.
    expect(show(await h.say('4, 5'))[0]).toMatch(/al menos uno de los documentos que preparo yo/);
    out = show(await h.say('1, 3, 4-5, otro: paz y salvo'));
    expect(out[0]).toBe(
      'Esto es lo que pide *E.S.E. Hospital Emiro Quintero Cañizares*:\n• Informe de actividades\n• Cuenta de cobro\n• Planilla de seguridad social (PILA)\n• Antecedentes judiciales (Policía)\n• paz y salvo\n\n¿Está completo? [Sí, está completo] [Corregir]',
    );
    out = show(await h.press('docs:ok'));
    // A model of each document Pascal prepares, one at a time.
    expect(out[0]).toMatch(/^📄 Modelo 1 de 2: envíame un \*modelo de informe de actividades\*/);
    expect(show(await h.photo())[0]).toMatch(/PDF o Word/);
    out = show(await h.document('informe-modelo.pdf'));
    expect(out[1]).toMatch(/^📄 Modelo 2 de 2: envíame un \*modelo de cuenta de cobro\*/);
    out = show(await h.document('cuenta-modelo.pdf'));
    expect(out[1]).toMatch(/envíame tu \*contrato\*/);
    out = show(await h.document('contrato.pdf'));
    expect(out[0]).toMatch(/configurar esa institución/);
    expect(out[0]).toMatch(/tu primera cuenta de cobro es gratis/);
    expect(out[1]).toMatch(
      /eres el \*Aliado\* de CuentaFacil en \*E\.S\.E\. Hospital Emiro Quintero Cañizares\*/,
    );
    expect(out[1]).toContain('Tu código es *ALI-0001*');
    expect(out[2]).toContain(
      'https://wa.me/573123885012?text=Hola%20Pascal%2C%20vengo%20de%20parte%20de%20ALI-0001',
    );
    const user = (await h.store.getUserByPhone(NEW_PHONE))!;
    expect(h.store.data.freeReports?.[user.id]).toBe(1);
    const req = h.store.data.institutionRequests![0]!;
    expect(req.documents?.required.map((d) => d.label)).toEqual([
      'Informe de actividades',
      'Cuenta de cobro',
      'Planilla de seguridad social (PILA)',
      'Antecedentes judiciales (Policía)',
      'paz y salvo',
    ]);
    expect(Object.keys(req.documents?.models ?? {})).toEqual(['INFORME_ACTIVIDADES', 'CUENTA_COBRO']);

    // While the institution is being configured, Pascal says so instead of restarting setup.
    expect(show(await h.say('hola'))[0]).toMatch(/Estamos configurando \*E\.S\.E\. Hospital Emiro/);

    // A second contractor of the same institution (written differently) does not get it free.
    const h2 = harness({ phone: '+573001112233', today: '2026-10-10' });
    h2.store.data.institutionRequests = h.store.data.institutionRequests;
    await h2.press('consent:yes');
    await h2.press('ent:other');
    await h2.say('Hospital Emiro Quintero Cañizares');
    await h2.say('1');
    await h2.press('docs:ok');
    await h2.document('modelo.docx');
    out = show(await h2.document('contrato.pdf'));
    expect(out[0]).not.toMatch(/gratis/);
  });
});

describe('Programa de Aliados', () => {
  it('registers a referral from the shared link, shows the Aliado status and announces new levels', async () => {
    // Aliado of a new institution.
    const a = harness({ phone: NEW_PHONE, today: '2026-10-10' });
    await a.press('consent:yes');
    await a.press('ent:other');
    await a.say('Hospital Nuevo de Prueba');
    await a.say('1, 2');
    await a.press('docs:ok');
    await a.document('modelo.pdf');
    await a.document('modelo-supervision.pdf');
    await a.document('contrato.pdf');
    const allyId = (await a.store.getUserByPhone(NEW_PHONE))!.id;

    // A colleague opens the shared link: the code travels in the first message and the consent button.
    const friend = '+573005556677';
    const b = harness({ phone: friend, today: '2026-10-10' });
    b.store.data.allies = a.store.data.allies;
    let out = show(await b.say('Hola Pascal, vengo de parte de ALI-0001'));
    expect(out[2]).toBe(
      '¿Aceptas la política de tratamiento de datos y los términos del servicio? [Acepto] [No acepto]',
    );
    out = show(await b.press('consent:yes:ALI-0001'));
    expect(out[0]).toBe(
      '✅ Quedaste registrado como referido de ALI-0001. ¡Gracias por llegar por recomendación!',
    );
    expect(out[1]).toMatch(/configuremos tu contrato/);
    const friendId = (await b.store.getUserByPhone(friend))!.id;
    expect(b.store.data.referredBy?.[friendId]).toBe('ALI-0001');
    expect(show(await b.say('ALI-0001'))[0]).toMatch(/Ya estás registrado como referido/);

    // The Aliado sees their status; the program reports a new level on their next message.
    out = show(await a.say('mi código'));
    expect(out[0]).toMatch(/Tu código: \*ALI-0001\*\n• Nivel: \*0 de 10\*/);
    expect(show(await a.say('ALI-0001'))[0]).toMatch(/tu propio código/);
    a.store.data.allies![0]!.level = 1;
    a.store.data.allies![0]!.newLevels = [1];
    out = show(await a.say('hola'));
    expect(out[0]).toMatch(/Subiste al \*nivel 1\*.*gratis/);
    expect(a.store.data.allies![0]!.newLevels).toEqual([]);
    expect(allyId).toBeTruthy();

    // Someone who is not an Aliado learns how the program works.
    expect(show(await b.say('aliado'))[0]).toMatch(/Programa de Aliados\* es para la primera persona/);
  });
});

describe('missing profile data of contractors configured earlier', () => {
  it('asks the place of issue after handling the message and confirms it with a button', async () => {
    const h = harness({ today: '2026-09-28' });
    const maria = h.store.data.users.find((u) => u.phone === DEMO_PHONES.maria)!;
    maria.docIssuedIn = '';

    // The question waits until the current exchange ends (here, choosing the contract of the note).
    let out = show(await h.say('Hoy capacité al personal en la ruta de misión médica'));
    expect(out.join('\n')).not.toMatch(/expedida tu cédula/);
    out = show(await h.press(`c:${DEMO_IDS.salud}`));
    expect(out.at(-1)).toMatch(/expedida tu cédula/);
    // A daily note instead of the answer is handled as usual, and the question comes back after it.
    out = show(await h.say('Hoy capacité de nuevo al personal en la ruta de misión médica'));
    expect(out[0]).toMatch(/¿A cuál contrato corresponde\?/);
    out = show(await h.press(`c:${DEMO_IDS.salud}`));
    expect(out[0]).toMatch(/Anotado/);
    expect(out.at(-1)).toMatch(/expedida tu cédula/);
    out = show(await h.say('Ábrego, Norte de Santander'));
    expect(out[0]).toBe('¿Tu cédula fue expedida en *Ábrego, Norte de Santander*? [✅ Sí] [Corregir]');
    out = show(await h.press('doc:yes'));
    expect(out[0]).toBe('✅ Listo, guardé que tu cédula fue expedida en *Ábrego, Norte de Santander*.');
    expect((await h.store.getUser(maria.id)).docIssuedIn).toBe('Ábrego, Norte de Santander');
    out = show(await h.say('hola'));
    expect(out.join('\n')).not.toMatch(/expedida tu cédula/);
  });
});

describe('notes after the contract ended', () => {
  it('uses the month written in the note and asks when it happened instead of saying there is no contract', async () => {
    const ended = { ...sampleExtraction(), endDate: '2026-09-30' as const };
    const h = harness({ phone: NEW_PHONE, today: '2026-10-11', ai: new FakeAI(ended) });
    await h.press('consent:yes');
    await h.press(`ent:${DEMO_IDS.hrno}`);
    await h.document('contrato.pdf');
    await h.document('clausulado.pdf');
    await h.press('setup:ok');
    await h.say('06/07/2026');
    await h.press('mode:month_end');
    await h.press('cert:no');
    await h.press('prior:none');
    await h.press('sig:skip');

    let out = show(
      await h.say(
        'Se realizó seguimiento a la vigilancia en salud pública de las UPGD de Ábrego y El Carmen en el mes de Julio',
      ),
    );
    expect(out[0]).toMatch(/^✅ Anotado en julio de 2026 en la obligación 1/);
    const note = h.store.data.notes.at(-1)!;
    expect(note.date).toBe('2026-07-06');

    out = show(await h.say('Capacité al personal en la ruta de misión médica'));
    expect(out[0]).toMatch(/^📅 ¿En qué fecha o en qué mes hiciste esta actividad\?/);
    out = show(await h.say('agosto'));
    expect(out[0]).toMatch(/^✅ Anotado en agosto de 2026 en la obligación 2/);
    expect(h.store.data.notes.at(-1)!.date).toBe('2026-08-01');

    out = show(await h.say('Capacité al personal en la ruta de misión médica el 15/08/2026'));
    expect(out[0]).toMatch(/^✅ Anotado el 15\/08\/2026/);

    // A photo with a caption: the caption is the note and the photo its evidence.
    out = show(await h.photo('Capacité al personal en la ruta de misión médica el 20/08/2026'));
    expect(out[0]).toMatch(/^✅ Anotado el 20\/08\/2026 con 1 foto en la obligación 2/);
    expect(h.store.data.notes.at(-1)!.evidenceIds).toHaveLength(1);
  });
});

describe('undo the last note', () => {
  it('asks for confirmation and deletes it', async () => {
    const h = harness({ today: '2026-09-28' });
    await h.say('Hoy capacité al personal en la ruta de misión médica');
    await h.press(`c:${DEMO_IDS.salud}`);
    const before = h.store.data.notes.length;
    const last = h.store.data.notes.at(-1)!;
    let out = show(await h.say('borra esa nota'));
    expect(out[0]).toMatch(/^🗑️ ¿Borro tu última nota \(28\/09\/2026\)\?\n«Hoy capacité/);
    out = show(await h.press(`del:${last.id}`));
    expect(out[0]).toBe('🗑️ Borré la nota.');
    expect(h.store.data.notes).toHaveLength(before - 1);
  });
});

describe('supports sent as combined PDFs', () => {
  it('identifies and splits each certificate without asking document by document', async () => {
    const h = harness({ today: '2026-09-28' });
    const userId = h.store.data.users.find((u) => u.phone === DEMO_PHONES.maria)!.id;
    const before = h.store.data.supports.filter((s) => s.userId === userId).length;

    let out = show(await h.document('AFILIACIONES.pdf'));
    expect(out[0]).toBe(
      '📎 *AFILIACIONES.pdf*\n✅ Afiliación EPS (pág. 1)\n✅ Afiliación ARL (pág. 2)\n✅ Afiliación pensión (pág. 3)',
    );
    out = show(await h.document('SEGURIDAD SOCIAL SEPTIEMBRE.pdf'));
    expect(out[0]).toBe(
      '📎 *SEGURIDAD SOCIAL SEPTIEMBRE.pdf*\n✅ Planilla PILA (págs. 1-2) · septiembre 2026, total $ 1.546.800',
    );
    // The PILA values are stored for table 2.1 of the supervision report.
    expect(await h.store.getSocialSecurity(userId, '2026-09-01')).toMatchObject({
      pin: '100000001',
      total: 1_546_800,
    });
    out = show(await h.document('ANTECEDENTES (1) (1).pdf'));
    expect(out[0]!.split('\n')).toHaveLength(5);

    const codes = h.store.data.supports
      .filter((s) => s.userId === userId)
      .slice(before)
      .map((s) => s.code);
    expect(codes).toEqual(['EPS', 'ARL', 'AFP', 'PILA', 'POLICIA', 'RNMC', 'PROCURADURIA', 'CONTRALORIA']);

    // Something it cannot recognize still asks.
    out = show(await h.document('otro.pdf'));
    expect(out[0]).toMatch(/no reconocí qué es/);
  });
});
