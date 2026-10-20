import { describe, expect, it } from 'vitest';
import { DEMO_IDS, DEMO_PHONES } from '../src/demo.js';
import { FakeAI } from '../src/fakes.js';
import { MONTHS } from '../src/text.js';
import { harness, show } from './harness.js';

describe('recorded conversation: a month of notes to delivery', () => {
  it('runs the whole flow for the salud pública contract', async () => {
    const h = harness();

    expect(show(await h.say('Hola'))[0]).toMatch(
      /^Hola María 👋 ¿Qué quieres hacer\? También puedes contarme directamente lo que hiciste hoy en los contratos \*0001\* y \*0002\*\./,
    );

    // Two contracts in force → ask which one; the note talks about "misión médica".
    let out = show(await h.say('Hoy capacité a 30 personas en misión médica en El Carmen'));
    expect(out).toEqual(['¿A cuál contrato corresponde? [0001 Salud Pública] [0002 EBS] [Ambos]']);
    out = show(await h.press(`c:${DEMO_IDS.salud}`));
    expect(out[0]).toMatch(/^✅ Anotado el 28\/09\/2026 en la obligación 4: «Capacitación y seguimiento/);

    // Album: two photos, one question, then the caption becomes the note (dated "ayer").
    const photoOut = show(await h.photo());
    expect(photoOut[0]).toMatch(/^📷 Recibí tu foto\. ¿De qué actividad es\?/);
    expect(photoOut[0]).toContain('Es otra actividad');
    expect(await h.photo()).toEqual([]);
    await h.say('Ayer asistí a la reunión de entidades territoriales en el COVE de Ábrego');
    out = show(await h.press(`c:${DEMO_IDS.salud}`));
    expect(out[0]).toMatch(/^✅ Anotado el 27\/09\/2026 con 2 fotos en la obligación 3/);

    // Low-confidence note → Pascal suggests its best guess; the contractor changes it from the list.
    await h.say('nota: hice el informe semanal');
    out = show(await h.press(`c:${DEMO_IDS.salud}`));
    expect(out[0]).toMatch(
      /Creo que va en la obligación \d+: .*¿Está bien\?\n📅 Informe 03 DE 03 \(1 al 30 de septiembre de 2026\) \[✅ Está bien\] \[✏️ Corregir\] \[➕ Otra obligación\]$/,
    );
    const noteId = h.store.data.notes.at(-1)!.id;
    out = show(await h.press(`chg:${noteId}`));
    expect(out[0]).toMatch(
      /^¿Qué corrijo de esta actividad\?.*\[La obligación\] \[El informe o fecha\] \[Borrarla\]$/s,
    );
    out = show(await h.press(`cob:${noteId}`));
    expect(out[0]).toMatch(
      /¿A cuál obligación corresponde\?\n📅 Informe 03 DE 03 \(1 al 30 de septiembre de 2026\) \{1\. Coordinar/,
    );
    expect(show(await h.press('o:specific-1'))).toEqual([
      '✅ Listo, quedó en la obligación 1.\n📅 Informe 03 DE 03 (1 al 30 de septiembre de 2026)\n¿Esta actividad sirve también para otra? [✅ Listo] [➕ Otra obligación]',
    ]);
    // The same activity can support several obligations.
    out = show(await h.press(`add:${noteId}`));
    expect(out[0]).toMatch(/^¿En qué otra obligación va esta actividad\?/);
    expect(out[0]).not.toContain('1. Coordinar');
    expect(show(await h.press('o:specific-3'))).toEqual([
      '✅ También quedó en la obligación 3.\n📅 Informe 03 DE 03 (1 al 30 de septiembre de 2026)\n¿Va en otra más? [✅ Listo] [➕ Otra obligación]',
    ]);
    expect(show(await h.press('note:done'))).toEqual([
      '👍 Perfecto. Cuando quieras, cuéntame otra actividad.',
    ]);
    const multi = await h.store.getNote(noteId);
    expect([multi.obligationKey, ...(multi.alsoKeys ?? [])]).toEqual(['specific-1', 'specific-3']);

    // Or accepts the suggestion.
    await h.say('nota: hice el informe semanal');
    await h.press(`c:${DEMO_IDS.salud}`);
    expect(show(await h.press(`nok:${h.store.data.notes.at(-1)!.id}`))).toEqual(['👍 Perfecto.']);

    // Checklist for both contracts.
    out = show(await h.say('¿Qué me falta?'));
    expect(out).toHaveLength(3);
    expect(out[0]).toContain('Informe 03 DE 03 (1 al 30 de septiembre de 2026)');
    expect(out[0]).toContain('⚠️ Obligación 2: 0 registros');
    expect(out[0]).toMatch(/✅ Antecedentes Policía \(vigente hasta el \d\d\/\d\d\/2026\)/);
    expect(out[2]).toBe(`🧭 ¿Te guío para descargar los soportes que faltan, uno por uno? [Guíame]`);
    expect(out[0]).toContain('📌 Después de la firma del supervisor');
    expect(out[1]).toContain('❌ Certificado ejecución EBS');

    // Draft: obligation 2 has no notes → ask; then review and approve.
    await h.say('ver borrador');
    out = show(await h.press(`c:${DEMO_IDS.salud}`));
    expect(out[0]).toBe('✍️ Estoy redactando tu informe con lo que me contaste…');
    expect(out[1]).toMatch(/^Para la obligación 2 .* \[Escribir\/Audio\] \[Texto por defecto\] \[Omitir\]$/);
    out = show(await h.press('mis:na'));
    expect(out[0]).toContain('📄 *Borrador – Informe 03 DE 03*');
    expect(out[0]).toContain('→ Se capacitó a 30 personas en misión médica en El Carmen.');
    expect(out[0]).toContain('→ Se asistió a la reunión de entidades territoriales');
    expect(out[0]).toContain('*5.* Reserva y confidencialidad');
    expect(out[0]).toContain('→ Actividad cumplida.');
    // HRNO omits obligations without activities: one line instead of a «no se presentaron…» text.
    expect(out[0]).not.toContain('*2.* Reorganizar');
    expect(out[0]).toContain(
      '⏭️ Sin actividades este periodo (no van en el informe de actividades): obligación 2.',
    );

    // Edit one obligation, then approve.
    await h.press('rev:edit');
    await h.press('o:specific-4');
    out = show(await h.say('agrega que se entregaron 32 carnés de misión médica'));
    expect(out[0]).toContain('→ Se entregaron 32 carnés de misión médica.');
    out = show(await h.press('rev:approve'));
    expect(out).toEqual(['✅ Borrador aprobado. Cuando quieras, genero tus documentos. [📄 Generar]']);

    // Generate: PDFs first, then DOCX, then the ZIP.
    out = show(await h.press('menu:generate'));
    expect(out).toEqual(['¿De cuál contrato? [0001 Salud Pública] [0002 EBS]']);
    out = show(await h.press(`c:${DEMO_IDS.salud}`));
    expect(out.slice(0, 4)).toEqual([
      '⏳ Estoy generando tus documentos, dame un momento…',
      '📎 INFORME.pdf',
      '📎 INFORME.docx',
      '📎 paquete.zip',
    ]);
    expect(out[4]).toMatch(/^🎉 ¡Listo!/);
    const p3 = (await h.store.listPeriods(DEMO_IDS.salud)).find((p) => p.number === 3)!;
    expect(p3.status).toBe('delivered');
  });
});

describe('other flows', () => {
  it('transcribes audio and registers the note', async () => {
    const h = harness();
    const out = show(
      await h.audio('Hoy hice seguimiento a la notificación de eventos epidemiológicos de las IPS'),
    );
    expect(out[0]).toMatch(/^🎙️ Te entendí/);
    expect(out[1]).toBe('¿A cuál contrato corresponde? [0001 Salud Pública] [0002 EBS] [Ambos]');
  });

  it('asks to write it when a voice note cannot be transcribed', async () => {
    const h = harness();
    const notes = h.store.data.notes.length;
    const out = show(await h.audio(''));
    expect(out).toEqual([
      '🎙️ No pude escuchar bien tu nota de voz. ¿Me la escribes, o me la envías de nuevo en unos minutos?',
    ]);
    expect(h.store.data.notes.length).toBe(notes);
  });

  it('learns the writing style of a previous report and lets the contractor undo it (ADR-046)', async () => {
    const ai = new FakeAI();
    const h = harness({ ai });
    const userId = h.store.data.users[0]!.id;
    expect(show(await h.say('informe anterior'))[0]).toMatch(/^📎 Envíame un informe de actividades/);
    let out = show(await h.document('INFORME AGOSTO.pdf'));
    expect(out[0]).toBe(
      '📝 Leí tu informe anterior: *Informe de actividades de agosto de 2026, CPS-0001-2026*.\nDesde ahora redacto tus informes con tu forma de escribir; los hechos siempre salen de lo que me cuentes.\n\n¿Es el documento correcto? [Sí, es ese] [No es ese]',
    );
    expect((await h.store.getWritingStyle(userId))?.guide).toBe('Frases cortas en pasado impersonal.');

    // Wrong file: removed and discarded.
    out = show(await h.press('style:wrong'));
    expect(out[0]).toMatch(/^🗑️ Listo, lo quité/);
    expect(await h.store.getWritingStyle(userId)).toBeNull();
    expect(h.store.data.supports.at(-1)?.code).toBe('DESCARTADO');

    // Something that is not a report is only used if the contractor says it is.
    await h.say('informe anterior');
    out = show(await h.document('factura.pdf'));
    expect(out[0]).toMatch(/^🤔 Este documento no parece un informe de actividades: parece \*Una factura/);
    expect(await h.store.getWritingStyle(userId)).toBeNull();
    out = show(await h.press('style:keep'));
    expect(out[0]).toBe('✅ Listo, lo uso como ejemplo de tu forma de escribir.');
    expect((await h.store.getWritingStyle(userId))?.summary).toBe('Una factura de servicios públicos');

    // The command shows it, with buttons to change or remove it.
    // The draft is written with that style.
    await h.say('Hoy hice seguimiento a la vigilancia en salud pública de las UPGD de Ábrego');
    await h.press(`c:${DEMO_IDS.salud}`);
    await h.say('ver borrador');
    await h.press(`c:${DEMO_IDS.salud}`);
    expect(ai.lastStyle?.summary).toBe('Una factura de servicios públicos');

    expect(show(await h.say('mi estilo'))[0]).toMatch(
      /^📝 Redacto con la forma de escribir.*\[Cambiarlo\] \[Quitarlo\]$/s,
    );
  });

  it('saves the note in the contract chosen even if it starts mid-month or owes its setup (Danilo, 2026-10-15)', async () => {
    const h = harness();
    const userId = h.store.data.users[0]!.id;
    h.store.data.contracts.find((c) => c.id === DEMO_IDS.salud)!.startDate = '2026-09-02';
    h.store.data.billing = { mode: 'live', prices: { setup: 15_000, report: 50_000 } };
    await h.store.openCharge({
      userId,
      product: 'setup',
      contractId: DEMO_IDS.ebs,
      periodNumber: null,
      coversSetup: false,
      amount: 15_000,
    });
    let out = show(await h.say('En septiembre hice mesas de trabajo con el personal de las IPS'));
    expect(out[0]).toBe('¿A cuál contrato corresponde? [0001 Salud Pública] [0002 EBS] [Ambos]');
    out = show(await h.press(`c:${DEMO_IDS.salud}`));
    expect(out[0]).toMatch(/Anotado en septiembre de 2026/);
    const note = h.store.data.notes.at(-1)!;
    expect([note.contractId, note.date]).toEqual([DEMO_IDS.salud, '2026-09-02']);
  });

  it('says what the contractor owes and offers to pay it', async () => {
    const h = harness();
    const userId = h.store.data.users[0]!.id;
    h.store.data.billing = { mode: 'live', prices: { setup: 15_000, report: 50_000 } };
    const charge = await h.store.openCharge({
      userId,
      product: 'setup',
      contractId: DEMO_IDS.ebs,
      periodNumber: null,
      coversSetup: false,
      amount: 15_000,
    });
    let out = show(await h.say('¿Debo la configuración del contrato 0002?'));
    expect(out[0]).toBe(
      '💳 Tus pagos:\n✅ *0001*: configuración sin costo.\n⏳ *0002*: configuración pendiente, $ 15.000. [Pagar 0002] [Hablar con soporte]',
    );
    out = show(await h.press(`payc:${charge.id}`));
    expect(out[0]).toMatch(/^💳 Para activar tu contrato \*CPS-0002/);
  });

  it('lets each contract have a short description shown in the buttons', async () => {
    const h = harness();
    let out = show(await h.say('describir contrato'));
    expect(out[0]).toBe('¿De cuál contrato? [0001 Salud Pública] [0002 EBS]');
    out = show(await h.press(`c:${DEMO_IDS.ebs}`));
    expect(out[0]).toMatch(/^🏷️ Escríbeme una descripción corta para el contrato \*0002\*/);
    out = show(await h.say('Coordinación de los equipos básicos'));
    expect(out[0]).toMatch(/^Es un poco larga \(35 letras\)/);
    out = show(await h.say('Coordinación EBS'));
    expect(out[0]).toBe('✅ Listo: tu contrato *CPS-0002-2026* ahora aparece como *0002 Coordinación EBS*.');
    out = show(await h.say('Hoy capacité a 30 personas en misión médica en El Carmen'));
    expect(out[0]).toBe('¿A cuál contrato corresponde? [0001 Salud Pública] [0002 Coordinación E…] [Ambos]');
    expect(show(await h.say('mis contratos')).join('\n')).toContain(
      '🏷️ En los botones: *0002 Coordinación EBS*',
    );
  });

  it('deletes the signature when its owner asks (data policy 4-A)', async () => {
    const h = harness();
    expect(show(await h.say('borrar mi firma'))).toEqual(['No tengo guardada ninguna firma tuya.']);
    await h.say('firma');
    await h.photo();
    const userId = h.store.data.users[0]!.id;
    expect(h.store.data.supports.some((s) => s.userId === userId && s.code === 'FIRMA')).toBe(true);
    expect(show(await h.say('borrar mi firma'))[0]).toBe(
      '🗑️ ¿Borro tu firma? Tus próximos documentos saldrán para firmar a mano. [Sí, bórrala] [No]',
    );
    expect(show(await h.press('sigdel:yes'))[0]).toMatch(/^✅ Borré tu firma/);
    expect(h.store.data.supports.some((s) => s.userId === userId && s.code === 'FIRMA')).toBe(false);
  });

  it('takes the contract named in the text without asking', async () => {
    const h = harness();
    const out = show(await h.say('Hice seguimiento a las UPGD de Ábrego, esto es del contrato 0002'));
    expect(out.join(' ')).not.toMatch(/¿A cuál contrato corresponde/);
    expect(h.store.data.notes.at(-1)!.contractId).toBe(DEMO_IDS.ebs);
  });

  it('registers a note in both contracts', async () => {
    const h = harness();
    await h.say('Asistí a la reunión del comité en Ábrego');
    await h.press('c:*');
    const notes = h.store.data.notes;
    expect(notes.map((n) => n.contractId).sort()).toEqual([DEMO_IDS.salud, DEMO_IDS.ebs].sort());
  });

  it('blocks generation until the draft is approved', async () => {
    const h = harness();
    await h.say('generar');
    const out = show(await h.press(`c:${DEMO_IDS.ebs}`));
    expect(out).toEqual(['Antes de generar necesito que apruebes el borrador del informe. [Ver borrador]']);
  });

  it('asks for activities instead of each obligation when the period has no notes', async () => {
    const h = harness();
    await h.say('ver borrador');
    let out = show(await h.press(`c:${DEMO_IDS.ebs}`));
    expect(out).toHaveLength(1);
    expect(out[0]).toMatch(/^📭 Para el informe .* todavía no tengo actividades registradas\./);
    expect(out[0]).not.toContain('Rehacer');

    // With a delivered report, offer to redo it (e.g. after the entity's format changed).
    const ps = await h.store.listPeriods(DEMO_IDS.ebs);
    await h.store.savePeriods(
      DEMO_IDS.ebs,
      ps.map((p) => (p.number === 1 ? { ...p, status: 'delivered' } : p)),
    );
    await h.say('ver borrador');
    out = show(await h.press(`c:${DEMO_IDS.ebs}`));
    expect(out[0]).toMatch(/toca \*Rehacer \w+\*\. \[Rehacer \w+\]$/);
  });

  it('takes "informe de <mes>" as a request, not as the answer Pascal was waiting for', async () => {
    const h = harness();
    const ps = await h.store.listPeriods(DEMO_IDS.ebs);
    const first = ps.find((p) => p.number === 1)!;
    await h.store.savePeriods(
      DEMO_IDS.ebs,
      ps.map((p) => (p.number === 1 ? { ...p, status: 'delivered' } : p)),
    );
    const month = MONTHS[Number(first.from.slice(5, 7)) - 1]!;
    await h.say('Asistí a la reunión del comité en Ábrego');
    await h.press(`c:${DEMO_IDS.ebs}`);
    await h.say('ver borrador');
    let out = show(await h.press(`c:${DEMO_IDS.ebs}`));
    expect(out.at(-1)).toMatch(/^Para la obligación/);
    const notes = h.store.data.notes.length;

    // Both demo contracts have that month: Pascal asks which one; the delivered one is redone.
    out = show(await h.say(`Sigamos trabajando en el informe de ${month}`));
    expect(h.store.data.notes.length).toBe(notes);
    expect(out[0]).toMatch(new RegExp(`^Tienes informe de ${month} en varios contratos`));

    out = show(await h.say(`Rehacer ${month}`));
    expect(h.store.data.notes.length).toBe(notes);
    out = show(await h.press(`redo:${DEMO_IDS.ebs}:1`));
    expect(out[0]).toBe('⏳ Estoy generando tus documentos, dame un momento…');
  });

  it('asks for the PILA of the month before generating, or generates without it on request', async () => {
    const h = harness();
    h.store.data.socialSecurity = [];
    const ps = await h.store.listPeriods(DEMO_IDS.ebs);
    await h.store.savePeriods(
      DEMO_IDS.ebs,
      ps.map((p) => (p.number === 1 ? { ...p, status: 'delivered' } : p)),
    );
    let out = show(await h.press(`redo:${DEMO_IDS.ebs}:1`));
    expect(out[0]).toMatch(
      /^🧾 Para llenar la tabla de seguridad social de tu informe 01-05 \(20 al 31 de agosto de 2026\) necesito la planilla PILA de \*\w+ de 2026\*/,
    );
    expect(out[0]).toContain('[Generar sin planilla]');
    out = show(await h.press('nopila:go'));
    expect(out[0]).toBe('⏳ Estoy generando tus documentos, dame un momento…');
  });

  it('blocks generation when a required support is missing, with links', async () => {
    const h = harness();
    // One EBS note, then the rest of the drafts quickly with default texts.
    await h.say('Asistí a la reunión del comité en Ábrego');
    await h.press(`c:${DEMO_IDS.ebs}`);
    await h.say('ver borrador');
    let out0 = show(await h.press(`c:${DEMO_IDS.ebs}`));
    while (out0.some((x) => x.startsWith('Para la obligación'))) out0 = show(await h.press('mis:default'));
    await h.press('rev:approve');
    await h.say('generar');
    const out = show(await h.press(`c:${DEMO_IDS.ebs}`));
    expect(out[0]).toMatch(
      /^⚠️ Me faltan estos soportes para generar tu informe 02-05 \(1 al 30 de septiembre de 2026\):\n❌ Certificado ejecución EBS/,
    );

    // Sending the document and classifying it unblocks generation.
    await h.document('certificado.pdf');
    expect(show(await h.press('s:CERT_EJECUCION_EBS'))).toEqual([
      '✅ Guardado. Escribe *¿qué me falta?* para ver tu checklist.',
    ]);
    await h.say('generar');
    const out2 = show(await h.press(`c:${DEMO_IDS.ebs}`));
    expect(out2[0]).toBe('⏳ Estoy generando tus documentos, dame un momento…');
  });

  it('asks the contractor to confirm the value when the reports do not add up to the contract', async () => {
    const h = harness();
    await h.say('Asistí a la reunión del comité en Ábrego');
    await h.press(`c:${DEMO_IDS.ebs}`);
    await h.say('ver borrador');
    let out = show(await h.press(`c:${DEMO_IDS.ebs}`));
    while (out.some((x) => x.startsWith('Para la obligación'))) out = show(await h.press('mis:default'));
    await h.press('rev:approve');
    await h.document('certificado.pdf');
    await h.press('s:CERT_EJECUCION_EBS');
    const ps = await h.store.listPeriods(DEMO_IDS.ebs);
    await h.store.savePeriods(
      DEMO_IDS.ebs,
      ps.map((p, i) => (i === 0 ? { ...p, amount: p.amount - 1000 } : p)),
    );

    await h.say('generar');
    out = show(await h.press(`c:${DEMO_IDS.ebs}`));
    expect(out[0]).toMatch(
      /^💰 Las cuentas de tu contrato suman .* ¿Cobro ese valor\? \[Sí, cobrar ese\] \[Otro valor\]$/s,
    );
    out = show(await h.press('amt:other'));
    expect(out[0]).toMatch(/^Escríbeme el valor a cobrar/);
    out = show(await h.say('$ 1.500.000'));
    expect(out[0]).toMatch(/^✅ Listo, el informe .* queda por \*\$ 1\.500\.000\*\.$/);
    expect(out[1]).toBe('⏳ Estoy generando tus documentos, dame un momento…');
  });

  it('suggests the value of a compliance certificate and lets the contractor decide', async () => {
    const h = harness();
    h.store.data.contracts = h.store.data.contracts.filter((c) => c.id === DEMO_IDS.salud);
    const out = show(await h.document('CERTIFICADO_CUMPLIMIENTO.pdf'));
    expect(out.at(-1)).toMatch(
      /^📄 Tu certificado de cumplimiento dice que se pagan \*\$ 3\.500\.000\*.*¿Cuál cobro\? \[Cobrar \$ 3\.500\.000\] \[Dejar .*\] \[Otro valor\]$/s,
    );
    expect(show(await h.press('cert:use'))[0]).toMatch(/queda por \*\$ 3\.500\.000\*/);
    const p = (await h.store.listPeriods(DEMO_IDS.salud)).find((x) => x.amount === 3_500_000);
    expect(p?.amountSource).toBe('certificate');
  });

  it('starts a report over after confirmation, keeping the supports', async () => {
    const h = harness();
    await h.say('Hoy capacité a 30 personas en misión médica en El Carmen');
    await h.press(`c:${DEMO_IDS.salud}`);
    const p = (await h.store.listPeriods(DEMO_IDS.salud)).find(
      (x) => x.from <= '2026-09-28' && '2026-09-28' <= x.to,
    )!;
    const before = (await h.store.listNotes(DEMO_IDS.salud, p.from, p.to)).length;
    const supports = h.store.data.supports.length;
    expect(before).toBeGreaterThan(0);
    await h.say('reiniciar');
    let out = show(await h.press(`c:${DEMO_IDS.salud}`));
    expect(out[0]).toMatch(/^🗑️ ¿Reinicio el informe .*\[Sí, reiniciar\] \[Cancelar\]$/s);
    out = show(await h.press(`rst:${DEMO_IDS.salud}:${p.number}`));
    expect(out[0]).toMatch(
      new RegExp(`^✅ Listo, reinicié el informe .*: borré ${before} notas? y el borrador`),
    );
    expect(await h.store.listNotes(DEMO_IDS.salud, p.from, p.to)).toEqual([]);
    expect(await h.store.listDrafts(DEMO_IDS.salud, p.number)).toEqual([]);
    expect(h.store.data.supports.length).toBe(supports);
  });

  it('saves the signature from the menu and offers to replace it later', async () => {
    const h = harness();
    let out = show(await h.press('menu:signature'));
    expect(out[0]).toMatch(/^✍️ Así tus informes van firmados\./);
    out = show(await h.document('firma.pdf'));
    out = show(await h.say('hola'));
    await h.say('firma');
    out = show(await h.photo());
    expect(out[0]).toMatch(/^✅ Guardé tu firma\./);
    expect(h.store.data.supports.filter((s) => s.code === 'FIRMA')).toHaveLength(1);
    expect(h.store.data.notes.some((n) => n.evidenceIds.length > 0 && n.text === '')).toBe(false);
    out = show(await h.say('firma'));
    expect(out[0]).toMatch(/^✍️ Ya tengo tu firma\. Si me envías otra, la reemplazo\./);
  });

  it('never saves a short request as an activity', async () => {
    const h = harness();
    const notes = h.store.data.notes.length;
    let out = show(await h.say('Rehace agosto'));
    expect(out.join(' ')).not.toMatch(/Anotado/);
    out = show(await h.say('rehízolo'));
    expect(out.join(' ')).not.toMatch(/Anotado/);
    // Fewer than 3 words is never an activity: Pascal asks for it in a sentence.
    const ask =
      '📝 Si quieres anotar una actividad, cuéntame en una frase qué hiciste, por ejemplo: «Hoy hice la visita de seguimiento a la IPS de Ábrego». Si buscas otra cosa, abre el menú. [Ver menú]';
    // «ok», «no», «gracias» only close the question: no menu to dig, nothing saved.
    expect(show(await h.say('ok'))).toEqual([
      '👍 Listo. Cuando quieras, cuéntame qué hiciste o escribe *menú*.',
    ]);
    expect(show(await h.say('No'))).toEqual([
      '👍 Listo. Cuando quieras, cuéntame qué hiciste o escribe *menú*.',
    ]);
    expect(show(await h.say('6'))).toEqual([ask]);
    // The same question again, word for word: the way out is offered too (ADR-047).
    expect(show(await h.say('·'))).toEqual([
      ask,
      '¿Prefieres dejar esto para después? También puedes hablar con una persona del equipo. [Salir y ver menú] [Hablar con soporte]',
    ]);
    expect(h.store.data.notes.length).toBe(notes);
    // «Quiero anotar una actividad» asks for the activity; it is never saved as one (Danilo, 2026-10-15).
    expect(show(await h.say('Quiero anotar una actividad'))[0]).toBe(ask);
    expect(show(await h.say('registrar actividad'))[0]).toBe(ask);
    expect(h.store.data.notes.length).toBe(notes);
    // Saved by mistake: the obligation list always offers to drop it.
    await h.say('Estuve organizando varias cosas pendientes durante toda la jornada');
    out = show(await h.press(`c:${DEMO_IDS.salud}`));
    expect(out.join(' ')).toMatch(/¿A cuál obligación corresponde\?.*No era actividad/s);
    out = show(await h.press('o:-'));
    expect(out[0]).toMatch(/^🗑️ Listo, no la anoté/);
    expect(h.store.data.notes.length).toBe(notes);
    // The answer to that question is the activity.
    out = show(await h.say('Hice la visita de seguimiento a la IPS de Ábrego'));
    expect(out[0]).toBe('¿A cuál contrato corresponde? [0001 Salud Pública] [0002 EBS] [Ambos]');
    await h.press('menu:menu');
    // A real activity, even a short one, is still recorded.
    await h.say('Reunión con el alcalde');
    await h.press(`c:${DEMO_IDS.salud}`);
    expect(h.store.data.notes.length).toBe(notes + 1);
  });

  it('understands long requests in natural language and asks when unsure', async () => {
    const h = harness({ today: '2026-10-02' });
    const notes = h.store.data.notes.length;
    // A long request about a report is not an activity.
    let out = show(await h.say('ahora vamos a iniciar la realización del informe de septiembre'));
    expect(out.join(' ')).not.toMatch(/Anotado/);
    expect(out.join(' ')).toMatch(/septiembre/);
    // Unsure: Pascal asks, offering the likely meaning, and does nothing until the answer.
    out = show(await h.say('¿podemos revisar el informe?'));
    expect(out[0]).toBe(
      '¿Quieres que trabajemos en ese informe?\n\nSi «¿podemos revisar el informe?» es algo que hiciste, toca *Es una actividad* y lo anoto así. [Trabajar el informe] [Es una actividad] [Ver menú]',
    );
    expect(h.store.data.notes.length).toBe(notes);
    out = show(await h.press('short:do:open_report'));
    expect(out.join(' ')).not.toMatch(/Anotado/);
    // A long activity is still recorded.
    await h.say('Hoy hice la visita de inspección a las tres IPS del municipio y levanté las actas');
    await h.press(`c:${DEMO_IDS.salud}`);
    expect(h.store.data.notes.length).toBe(notes + 1);
  });

  it('never makes support or data deletion wait for the terms (ADR-047)', async () => {
    const h = harness();
    h.store.data.consents = (h.store.data.consents ?? []).map((c) => ({ ...c, policyVersion: '1.0' }));
    expect(show(await h.say('borrar mis datos'))[0]).toMatch(/^🗂️ Recibí tu solicitud de borrar tus datos/);
    expect(show(await h.press('menu:support'))[0]).toMatch(/soporte|equipo/i);
  });

  it('asks to accept new terms once and then handles the message the user had sent', async () => {
    const h = harness();
    h.store.data.consents = (h.store.data.consents ?? []).map((c) => ({ ...c, policyVersion: '1.0' }));
    let out = show(await h.say('¿Qué me falta?'));
    expect(out[0]).toMatch(
      /^📜 Actualizamos los términos del servicio y la política de datos de CuentaFacil \(versión 1\.3\)/,
    );
    expect(out[1]).toBe(
      '¿Aceptas los términos del servicio y la política de datos? Apenas aceptes, sigo con tu mensaje. [Acepto] [No acepto] [Hablar con soporte]',
    );
    out = show(await h.press('terms:yes'));
    expect(out[0]).toBe(
      '✅ ¡Gracias! Quedó registrada tu aceptación de los términos y de la política de datos.',
    );
    expect(out[1]).toContain('📄 *0001 Salud Pública*');
    // Accepted: not asked again.
    out = show(await h.say('menú'));
    expect(out[0]).toMatch(/^Hola María/);
    expect(await h.store.acceptedVersion(h.store.data.users[0]!.id, 'terms')).toBe('1.3');
    expect(await h.store.acceptedVersion(h.store.data.users[0]!.id, 'privacy_policy')).toBe('1.3');
  });

  it('asks only for the new data policy when the terms did not change', async () => {
    const h = harness();
    const userId = h.store.data.users[0]!.id;
    // Accepted terms 1.3 and policy 1.2; the policy in force is 1.3.
    h.store.data.consents = (h.store.data.consents ?? []).map((c) => ({
      ...c,
      policyVersion: c.kind === 'terms' ? '1.3' : '1.2',
    }));
    let out = show(await h.say('menú'));
    expect(out[0]).toMatch(
      /^📜 Actualizamos la política de tratamiento de datos de CuentaFacil \(versión 1\.3\): ahora las notas de voz las transcribe Groq/,
    );
    expect(out[1]).toMatch(/^¿Aceptas la política de datos\?/);
    out = show(await h.press('terms:yes'));
    expect(out[0]).toBe('✅ ¡Gracias! Quedó registrada tu aceptación de la política de datos.');
    expect(await h.store.acceptedVersion(userId, 'privacy_policy')).toBe('1.3');
    expect(await h.store.acceptedVersion(userId, 'terms')).toBe('1.3');
    expect(show(await h.say('menú'))[0]).toMatch(/^Hola María/);
  });

  it('asks only for the new terms when the data policy did not change', async () => {
    const h = harness();
    const userId = h.store.data.users[0]!.id;
    // Accepted terms 1.2 and policy 1.3; the terms in force are 1.3 (transfer, QR Bancolombia).
    h.store.data.consents = (h.store.data.consents ?? []).map((c) => ({
      ...c,
      policyVersion: c.kind === 'terms' ? '1.2' : '1.3',
    }));
    let out = show(await h.say('menú'));
    expect(out[0]).toMatch(
      /^📜 Actualizamos los términos del servicio de CuentaFacil \(versión 1\.3\): ahora también puedes pagar por \*transferencia bancaria\*/,
    );
    expect(out[1]).toMatch(/^¿Aceptas los términos del servicio\?.*\[Acepto\]/);
    out = show(await h.press('terms:yes'));
    expect(out[0]).toBe('✅ ¡Gracias! Quedó registrada tu aceptación de los términos del servicio.');
    expect(await h.store.acceptedVersion(userId, 'terms')).toBe('1.3');
    expect(show(await h.say('menú'))[0]).toMatch(/^Hola María/);
  });

  it('keeps asking while the new terms are not accepted', async () => {
    const h = harness();
    h.store.data.consents = [];
    expect(show(await h.press('terms:no'))[0]).toMatch(/^Entendido\. Sin aceptar los términos/);
    expect(show(await h.say('hola'))[0]).toMatch(/^📜 Para seguir necesito que aceptes los términos/);
  });

  it('attaches a photo to an activity already registered, or to an obligation by its number', async () => {
    const h = harness();
    await h.say('Hoy capacité a 30 personas en misión médica en El Carmen');
    await h.press(`c:${DEMO_IDS.salud}`);
    const note = h.store.data.notes.at(-1)!;
    // Photo after the text: pick the activity from the list (album of 2 photos).
    let out = show(await h.photo());
    expect(out[0]).toContain('Hoy capacité a 30');
    expect(out[0]).toContain('Es otra actividad');
    expect(await h.photo()).toEqual([]);
    out = show(await h.press(`ph:${note.id}`));
    expect(out[0]).toBe(
      '✅ Agregué las 2 fotos a «Hoy capacité a 30 personas en misión médica en El Carmen».\n📅 Informe 03 DE 03 (1 al 30 de septiembre de 2026)',
    );
    expect((await h.store.getNote(note.id)).evidenceIds).toHaveLength(2);
    const notes = h.store.data.notes.length;

    // Or the obligation number.
    await h.photo();
    out = show(await h.say('4'));
    expect(out[0]).toMatch(/^✅ Agregué la foto a la obligación 4, en «Hoy capacité/);
    expect((await h.store.getNote(note.id)).evidenceIds).toHaveLength(3);
    expect(h.store.data.notes.length).toBe(notes);

    // An obligation without activities yet gets a photo record.
    await h.photo();
    out = show(await h.say('obligación 2'));
    expect(out[0]).toMatch(/^✅ Guardé la foto en la obligación 2: /);
    expect(h.store.data.notes.at(-1)).toMatchObject({
      obligationKey: 'specific-2',
      evidenceIds: [expect.any(String)],
    });
  });

  it('keeps a photo sent after the period closed inside the report in course', async () => {
    // The September report is still open on 2 October (Danilo, 2026-10-11).
    const h = harness({ today: '2026-10-02' });
    h.store.data.contracts = h.store.data.contracts.filter((c) => c.id === DEMO_IDS.salud);
    await h.photo();
    const out = show(await h.say('2'));
    expect(out[0]).toMatch(
      /^✅ Guardé la foto en la obligación 2: .*\n📅 Informe 03 DE 03 \(1 al 30 de septiembre de 2026\)\n/s,
    );
    expect(h.store.data.notes.at(-1)).toMatchObject({ obligationKey: 'specific-2', date: '2026-09-30' });
  });

  it('asks which report a dateless activity or photo is for while an earlier report is open', async () => {
    // EBS contract: September (02-05) is being worked on in October.
    const h = harness({ today: '2026-10-05' });
    h.store.data.contracts = h.store.data.contracts.filter((c) => c.id === DEMO_IDS.ebs);
    await h.say('informe de septiembre');
    const notes = h.store.data.notes.length;

    let out = show(await h.say('Visité la IPS de Ábrego y revisé las historias clínicas'));
    expect(out[0]).toMatch(
      /^📅 Tienes un informe anterior abierto\. ¿A qué informe corresponde esta actividad\?.*\[Septiembre 2026\] \[Hoy \(octubre\)\] \[Otra fecha\]$/s,
    );
    expect(h.store.data.notes.length).toBe(notes);
    out = show(await h.press('np:2026-09-01:2026-09-30'));
    expect(out.join('\n')).toContain('📅 Informe 02-05 (1 al 30 de septiembre de 2026)');
    expect(h.store.data.notes.at(-1)!.date.slice(0, 7)).toBe('2026-09');

    // A photo given an obligation number: same question.
    await h.photo();
    out = show(await h.say('3'));
    expect(out[0]).toMatch(
      /^📅 ¿A qué informe corresponde la foto de la obligación 3\? \[Septiembre 2026\] \[Octubre 2026 \(hoy\)\]$/,
    );
    out = show(await h.press('pp:2'));
    expect(out[0]).toContain('📅 Informe 02-05 (1 al 30 de septiembre de 2026)');
    expect(h.store.data.notes.filter((n) => n.date.slice(0, 7) === '2026-10')).toHaveLength(0);
  });

  it('dates an activity with a relative date the model understands', async () => {
    const h = harness();
    h.store.data.contracts = h.store.data.contracts.filter((c) => c.id === DEMO_IDS.salud);
    const out = show(await h.say('La semana pasada hice la jornada de vacunación en la vereda'));
    expect(out[0]).toMatch(/^.* Anotado el 21\/09\/2026/);
    expect(h.store.data.notes.at(-1)!.date).toBe('2026-09-21');
  });

  it('moves an activity to another report from the confirmation or by asking', async () => {
    // EBS contract on 5 October: September (02-05) and October (03-05) are open.
    const h = harness({ today: '2026-10-05' });
    h.store.data.contracts = h.store.data.contracts.filter((c) => c.id === DEMO_IDS.ebs);
    await h.say('Visité la IPS de Ábrego y revisé las historias clínicas');
    const note = h.store.data.notes.at(-1)!;
    expect(note.date).toBe('2026-10-05');
    await h.press(`chg:${note.id}`);
    let out = show(await h.press(`mvq:${note.id}`));
    expect(out[0]).toMatch(
      /^📅 ¿A qué informe paso esta actividad\?.*\[Septiembre 2026\] .*\[Otra fecha\]$/s,
    );
    out = show(await h.press(`mv:${note.id}:2`));
    expect(out[0]).toBe('✅ Listo, moví la actividad.\n📅 Informe 02-05 (1 al 30 de septiembre de 2026)');
    expect((await h.store.getNote(note.id)).date).toBe('2026-09-01');

    // In words, with a date.
    await h.press(`chg:${note.id}`);
    await h.press(`mvq:${note.id}`);
    out = show(await h.say('15/09/2026'));
    expect((await h.store.getNote(note.id)).date).toBe('2026-09-15');

    // "Pasa la última actividad a octubre".
    out = show(await h.say('pasa la última actividad a octubre por favor'));
    expect(out[0]).toBe('✅ Listo, moví la actividad.\n📅 Informe 03-05 (1 al 31 de octubre de 2026)');
  });

  it('asks for the compliance certificate only in contracts that need it', async () => {
    const h = harness();
    h.store.data.supports = h.store.data.supports.filter((x) => x.code !== 'CERT_CUMPLIMIENTO');
    let out = show(await h.say('¿Qué me falta?'));
    expect(out[0]).toContain('Certificado de cumplimiento');
    h.store.data.contracts = h.store.data.contracts.map((c) => ({ ...c, requiresCertification: false }));
    out = show(await h.say('¿Qué me falta?'));
    expect(out.join('\n')).not.toContain('Certificado de cumplimiento');
  });

  it('reviews notes that look misplaced before drafting', async () => {
    const h = harness();
    const base = {
      userId: h.store.data.notes[0]?.userId ?? 'u',
      contractId: DEMO_IDS.salud,
      evidenceIds: [],
      createdAt: '2026-09-28T10:00:00Z',
    };
    const maria = h.store.data.users.find((u) => u.phone === DEMO_PHONES.maria)!;
    await h.store.addNote({
      ...base,
      userId: maria.id,
      id: 'n-aug',
      date: '2026-09-10',
      text: 'En agosto se hizo la reunión de seguimiento con la ESE',
      obligationKey: 'specific-3',
    });
    await h.store.addNote({
      ...base,
      userId: maria.id,
      id: 'n-cmd',
      date: '2026-09-11',
      text: 'Rehace agosto',
      obligationKey: 'specific-1',
    });
    await h.store.addNote({
      ...base,
      userId: maria.id,
      id: 'n-ph',
      date: '2026-09-12',
      text: 'Registro fotográfico de la obligación 4.',
      obligationKey: 'specific-4',
      evidenceIds: ['e1'],
    });

    await h.say('ver borrador');
    let out = show(await h.press(`c:${DEMO_IDS.salud}`));
    expect(out[0]).toMatch(
      /^🔎 Antes de redactar tu informe 03 DE 03 .* reviso las fechas \(3 por revisar\)\. Esta actividad menciona \*agosto\*:.*¿La muevo al informe 02 DE 03 .*\[Mover a agosto\] \[Dejarla aquí\] \[Borrarla\]$/s,
    );
    out = show(await h.press('nc:move:2'));
    expect(out[0]).toContain('📅 Informe 02 DE 03 (1 al 31 de agosto de 2026)');
    expect((await h.store.getNote('n-aug')).date).toBe('2026-08-01');
    expect(out[1]).toMatch(
      /^🔎 .*esta nota parece una instrucción.*«Rehace agosto».*\[Borrarla\] \[Es una actividad\]$/s,
    );
    out = show(await h.press('nc:del'));
    expect(h.store.data.notes.some((n) => n.id === 'n-cmd')).toBe(false);
    expect(out[1]).toMatch(/^📷 .*en la obligación 4 tengo una foto sin descripción/);
    out = show(await h.say('Capacitación a líderes comunitarios en El Carmen'));
    expect((await h.store.getNote('n-ph')).text).toBe('Capacitación a líderes comunitarios en El Carmen');
    expect(out).toContain('✍️ Estoy redactando tu informe con lo que me contaste…');

    // Kept notes are not asked again.
    await h.store.addNote({
      ...base,
      userId: maria.id,
      id: 'n-dic',
      date: '2026-09-13',
      text: 'Se planearon las actividades de diciembre con el equipo',
      obligationKey: 'specific-1',
    });
    await h.say('ver borrador');
    out = show(await h.press(`c:${DEMO_IDS.salud}`));
    expect(out[0]).toMatch(/menciona \*diciembre\*/);
    await h.press('nc:keep');
    await h.say('ver borrador');
    out = show(await h.press(`c:${DEMO_IDS.salud}`));
    expect(out[0]).toBe('✍️ Estoy redactando tu informe con lo que me contaste…');
  });

  it('warns about expired certificates when they arrive and asks to generate anyway or upload them again', async () => {
    const h = harness({ today: '2026-10-25' });
    const out = show(await h.document('ANTECEDENTES.pdf'));
    expect(out[0]).toContain('⚠️ ');
    expect(out.at(-1)).toMatch(
      /^⚠️ Estos documentos están vencidos: .*¿Quieres generar el informe con estos documentos o prefieres volver a cargarlos actualizados\? \[Generar así\] \[Volver a cargar\]$/s,
    );
    const reload = show(await h.press('exp:reload'));
    expect(reload[0]).toMatch(/^Perfecto\. Descarga los documentos actualizados/);
  });

  it('asks before generating with expired certificates and generates when the contractor accepts', async () => {
    const h = harness();
    await h.say('Asistí a la reunión del comité en Ábrego');
    await h.press(`c:${DEMO_IDS.ebs}`);
    await h.say('ver borrador');
    let out = show(await h.press(`c:${DEMO_IDS.ebs}`));
    while (out.some((x) => x.startsWith('Para la obligación'))) out = show(await h.press('mis:default'));
    await h.press('rev:approve');
    await h.document('certificado.pdf');
    await h.press('s:CERT_EJECUCION_EBS');
    // The background checks are now two months old.
    h.store.data.supports = h.store.data.supports.map((x) =>
      ['POLICIA', 'RNMC', 'PROCURADURIA', 'CONTRALORIA'].includes(x.code)
        ? { ...x, issuedOn: '2026-07-20' }
        : x,
    );
    await h.say('generar');
    out = show(await h.press(`c:${DEMO_IDS.ebs}`));
    expect(out[0]).toMatch(/^⚠️ Estos documentos están vencidos: /);
    out = show(await h.press('exp:ok'));
    expect(out[0]).toBe(
      'Listo, usaré estos documentos aunque estén vencidos; quedan bajo tu responsabilidad.',
    );
    expect(out.join(' ')).toMatch(/¿De cuál contrato\?|⏳ Estoy generando tus documentos/);
    if (out.join(' ').includes('¿De cuál contrato?')) out = show(await h.press(`c:${DEMO_IDS.ebs}`));
    expect(out.join(' ')).toContain('⏳ Estoy generando tus documentos, dame un momento…');
  });

  it('changes the cut mode only for undelivered periods, after confirmation', async () => {
    const h = harness();
    await h.say('cambiar corte');
    await h.press(`c:${DEMO_IDS.ebs}`);
    let out = show(await h.press('mode:date_to_date'));
    expect(out[0]).toContain('• Cuenta 1: 20 de agosto al 19 de septiembre de 2026');
    expect((await h.store.getContract(DEMO_IDS.ebs)).periodMode).toBe('month_end');
    out = show(await h.press('cut:confirm'));
    expect(out[0]).toMatch(/^✅ Cambié el corte/);
    let ps = await h.store.listPeriods(DEMO_IDS.ebs);
    expect(ps[0]).toMatchObject({ number: 1, from: '2026-08-20', to: '2026-09-19' });
    expect((await h.store.getContract(DEMO_IDS.ebs)).periodMode).toBe('date_to_date');

    // With a delivered period, only the following ones are re-cut.
    await h.store.savePeriods(
      DEMO_IDS.ebs,
      ps.map((p) => (p.number === 1 ? { ...p, status: 'delivered' as const } : p)),
    );
    await h.say('cambiar corte');
    await h.press(`c:${DEMO_IDS.ebs}`);
    out = show(await h.press('mode:month_end'));
    expect(out[0]).toContain('(las 1 cuentas ya entregadas no cambian)');
    expect(out[0]).toContain('• Cuenta 2: 20 al 30 de septiembre de 2026');
    await h.press('cut:confirm');
    ps = await h.store.listPeriods(DEMO_IDS.ebs);
    expect(ps[0]).toMatchObject({ number: 1, to: '2026-09-19', status: 'delivered' });
    expect(ps[1]).toMatchObject({ number: 2, from: '2026-09-20', to: '2026-09-30' });
  });

  it('greets unknown numbers without storing anything', async () => {
    const h = harness({ phone: '+573999999999' });
    const out = show(await h.say('hola'));
    expect(out[0]).toMatch(/^👋 ¡Hola! Soy Pascal, el asistente de CuentaFacil de PascalIA/);
    expect(h.store.data.conversations).toEqual([]);
  });

  it('tells anyone about PascalIA and links to the website', async () => {
    const h = harness();
    const out = show(await h.say('Quiero conocer PascalIA'.replace('Quiero ', '')));
    expect(out).toEqual([
      expect.stringMatching(/^🌼 PascalIA crea soluciones .* <Ir a PascalIA → https:\/\/pascalia\.lat\/>$/s),
    ]);
    const menu = show(await h.say('menú'));
    // The menu row gave way to 'Cuentas de otra persona'; «pascalia» still answers.
    expect(menu[0]).toContain('Cuentas de otra persona');
    expect(show(await h.press('menu:about'))[0]).toContain('https://pascalia.lat/');

    const stranger = harness({ phone: '+573999999999' });
    const greet = show(await stranger.say('hola'));
    expect(greet).toHaveLength(3);
    expect(greet[1]).toContain('<Ver política → https://pascalia.lat/politica-de-datos/>');
    expect(show(await stranger.say('servicios'))).toHaveLength(1);
    expect(stranger.store.data.conversations).toEqual([]);
  });

  it('shows contracts across entities', async () => {
    const h = harness({ phone: '+573000000002', today: '2026-10-05' });
    const out = show(await h.say('mis contratos'));
    expect(out[0]).toContain('CPS-0003-2026* – ESEPRUEBA');
    expect(out[0]).toContain('corte fecha a fecha');
  });
});

describe('billing (ADR-034)', () => {
  /** EBS report approved and with its supports: the next step is generating. */
  async function readyToGenerate() {
    const h = harness();
    await h.say('Asistí a la reunión del comité en Ábrego');
    await h.press(`c:${DEMO_IDS.ebs}`);
    await h.say('ver borrador');
    let out = show(await h.press(`c:${DEMO_IDS.ebs}`));
    while (out.some((x) => x.startsWith('Para la obligación'))) out = show(await h.press('mis:default'));
    await h.press('rev:approve');
    await h.document('certificado.pdf');
    await h.press('s:CERT_EJECUCION_EBS');
    return h;
  }
  const charges = (h: Awaited<ReturnType<typeof readyToGenerate>>) => h.store.data.periodCharges ?? {};

  it('charges nothing in the pilot and marks the report as pilot', async () => {
    const h = await readyToGenerate();
    await h.say('generar');
    const out = show(await h.press(`c:${DEMO_IDS.ebs}`));
    expect(out[0]).toBe('⏳ Estoy generando tus documentos, dame un momento…');
    expect(Object.values(charges(h))).toEqual(['pilot']);
  });

  it('asks for the report payment and delivers with a valid cash code', async () => {
    const h = await readyToGenerate();
    h.store.data.billing = { mode: 'live', prices: { setup: 15_000, report: 50_000 } };
    const userId = h.store.data.users[0]!.id;
    h.store.data.cashCodes = [
      { code: 'K7M4Q2P9', userId, product: 'report', amount: 50_000, expiresAt: '2099-01-01T00:00:00Z' },
      {
        code: 'ZZZZ1111',
        userId: 'other',
        product: 'report',
        amount: 50_000,
        expiresAt: '2099-01-01T00:00:00Z',
      },
      { code: 'SETU1111', userId, product: 'setup', amount: 15_000, expiresAt: '2099-01-01T00:00:00Z' },
    ];
    await h.say('generar');
    let out = show(await h.press(`c:${DEMO_IDS.ebs}`));
    expect(out[0]).toMatch(/^💳 Tu informe .* está listo\. Para entregártelo el valor es \*\$ 50\.000\*\./);
    expect(out[0]).toContain('[Tengo un código]');
    out = show(await h.press('pay:code'));
    expect(out[0]).toMatch(/^Escríbeme tu código de pago/);
    expect(show(await h.say('ZZZZ-1111'))[0]).toMatch(/^❌ Ese código pertenece a otra persona/);
    expect(show(await h.say('AAAA-0000'))[0]).toMatch(/^❌ No encuentro ese código/);
    expect(show(await h.say('SETU-1111'))[0]).toMatch(/^❌ Ese código no corresponde a este valor/);
    out = show(await h.say('k7m4-q2p9'));
    expect(out[0]).toBe('✅ Código aceptado: $ 50.000.');
    expect(out[1]).toBe('⏳ Estoy generando tus documentos, dame un momento…');
    expect(Object.values(charges(h))).toEqual(['paid']);
  });

  it('keeps a contract inactive until its configuration is paid', async () => {
    const h = harness();
    h.store.data.billing = { mode: 'live', prices: { setup: 15_000, report: 50_000 } };
    const userId = h.store.data.users[0]!.id;
    for (const contractId of [DEMO_IDS.salud, DEMO_IDS.ebs])
      await h.store.openCharge({
        userId,
        product: 'setup',
        contractId,
        periodNumber: null,
        coversSetup: false,
        amount: 15_000,
      });
    h.store.data.cashCodes = [
      { code: 'CONF2222', userId, product: 'setup', amount: 15_000, expiresAt: '2099-01-01T00:00:00Z' },
    ];
    const notes = h.store.data.notes.length;
    let out = show(await h.say('Hoy capacité a 30 personas en misión médica en El Carmen'));
    expect(out[0]).toMatch(/^💳 Para activar tu contrato .* el valor de la configuración es \*\$ 15\.000\*/);
    expect(h.store.data.notes.length).toBe(notes);
    // Support is always available, also as a button next to the payment request.
    expect(JSON.stringify(out)).toContain('Hablar con soporte');
    expect(show(await h.say('soporte'))[0]).toMatch(/soporte/);
    expect(show(await h.press('menu:support'))[0]).toMatch(/soporte/);
    expect(show(await h.say('no más recordatorios'))[0]).not.toMatch(/^💳/);
    await h.say('hola');
    await h.press('pay:code');
    out = show(await h.say('CONF-2222'));
    expect(out[0]).toBe('✅ Código aceptado: $ 15.000.');
    expect(out[1]).toMatch(/^🎉 ¡Tu contrato quedó activo!/);
  });

  it('uses a free report of the Aliado', async () => {
    const h = await readyToGenerate();
    h.store.data.billing = { mode: 'live', prices: { setup: 15_000, report: 50_000 } };
    const userId = h.store.data.users[0]!.id;
    h.store.data.freeReports = { [userId]: 1 };
    await h.say('generar');
    const out = show(await h.press(`c:${DEMO_IDS.ebs}`));
    expect(out[0]).toBe('🎁 Usé una de tus cuentas gratis para este informe.');
    expect(out[1]).toBe('⏳ Estoy generando tus documentos, dame un momento…');
    expect(Object.values(charges(h))).toEqual(['free']);
    expect(h.store.data.freeReports?.[userId]).toBe(0);
  });

  it('delivers the report when the online payment is confirmed', async () => {
    const h = await readyToGenerate();
    h.store.data.billing = { mode: 'live', prices: { setup: 15_000, report: 50_000 } };
    await h.say('generar');
    await h.press(`c:${DEMO_IDS.ebs}`);
    const p = (await h.store.listPeriods(DEMO_IDS.ebs)).find((x) => x.status === 'approved')!;
    const charge = (await h.store.findCharge(DEMO_IDS.ebs, 'report', p.number))!;
    await h.store.settleCharge(charge.id, 'paid', 'wompi', 'tx-1');
    const { to, out } = await h.orchestrator.chargePaid(charge.id);
    expect(to).toBe(h.store.data.users[0]!.phone);
    const shown = show(out);
    expect(shown[0]).toBe('✅ Recibí tu pago de $ 50.000. ¡Gracias!');
    expect(shown[1]).toBe('⏳ Estoy generando tus documentos, dame un momento…');
  });

  it('delivers to the gestor who asked for the payment (ADR-042)', async () => {
    const h = await readyToGenerate();
    h.store.data.billing = { mode: 'live', prices: { setup: 15_000, report: 50_000 } };
    await h.say('generar');
    await h.press(`c:${DEMO_IDS.ebs}`);
    const p = (await h.store.listPeriods(DEMO_IDS.ebs)).find((x) => x.status === 'approved')!;
    const charge = (await h.store.findCharge(DEMO_IDS.ebs, 'report', p.number))!;
    // Asked for by Carlos, gestor of María.
    const carlos = h.store.data.users.find((u) => u.phone === DEMO_PHONES.carlos)!;
    h.store.data.charges = h.store.data.charges!.map((c) =>
      c.id === charge.id ? { ...c, requestedBy: carlos.id } : c,
    );
    await h.store.settleCharge(charge.id, 'paid', 'wompi', 'tx-1');
    const { to, out } = await h.orchestrator.chargePaid(charge.id);
    expect(to).toBe(DEMO_PHONES.carlos);
    expect(show(out)[0]).toMatch(/^👤 \*María .*\*\n✅ Recibí tu pago de \$ 50\.000/);
  });
});

describe('bank transfer (ADR-055)', () => {
  const transfer = {
    bank: 'BANCOLOMBIA',
    accountType: 'ahorros' as const,
    accountNumber: '00000000000',
    holder: 'PASCALIA PRUEBA S.A.S.',
    holderDoc: 'NIT 900000000',
  };
  async function waitingPayment() {
    const h = harness();
    await h.say('Asistí a la reunión del comité en Ábrego');
    await h.press(`c:${DEMO_IDS.ebs}`);
    await h.say('ver borrador');
    let out = show(await h.press(`c:${DEMO_IDS.ebs}`));
    while (out.some((x) => x.startsWith('Para la obligación'))) out = show(await h.press('mis:default'));
    await h.press('rev:approve');
    await h.document('certificado.pdf');
    await h.press('s:CERT_EJECUCION_EBS');
    h.store.data.billing = { mode: 'live', prices: { setup: 15_000, report: 50_000 }, transfer };
    await h.say('generar');
    out = show(await h.press(`c:${DEMO_IDS.ebs}`));
    const p = (await h.store.listPeriods(DEMO_IDS.ebs)).find((x) => x.status === 'approved')!;
    const charge = (await h.store.findCharge(DEMO_IDS.ebs, 'report', p.number))!;
    return { h, out, charge };
  }

  it('offers the transfer, gives the account and reference, and keeps the receipt', async () => {
    const { h, out, charge } = await waitingPayment();
    expect(out[0]).toMatch(/^💳 Tu informe .* el valor es \*\$ 50\.000\*\./);
    expect(out[0]).toMatch(/\[Transferencia\] \[Tengo un código\] \[Hablar con soporte\]$/);
    let r = show(await h.press('pay:transfer'));
    expect(r[0]).toContain('• Cuenta de ahorros: *00000000000*');
    expect(r[0]).toContain(`• Referencia: *${charge.reference}*`);
    expect(r[0]).toContain('• Valor: *$ 50.000*');
    r = show(await h.photo());
    expect(r[0]).toMatch(/^🧾 Recibí tu comprobante por \*\$ 50\.000\*/);
    const pending = await h.store.getCharge(charge.id);
    expect(pending.status).toBe('pending');
    expect(pending.transfer?.supportId).toBeTruthy();
    expect(
      h.store.data.supports.some(
        (s) => s.id === pending.transfer?.supportId && s.code === 'COMPROBANTE_PAGO',
      ),
    ).toBe(true);
    // Asking again while it is verified: no new payment request.
    await h.say('generar');
    r = show(await h.press(`c:${DEMO_IDS.ebs}`));
    expect(r[0]).toMatch(/^🧾 Ya recibí tu comprobante de transferencia/);
    // Confirmed in the panel: the worker settles it and delivers.
    await h.store.settleCharge(charge.id, 'paid', 'transfer');
    const { out: done } = await h.orchestrator.chargePaid(charge.id);
    expect(show(done)[1]).toBe('⏳ Estoy generando tus documentos, dame un momento…');
  });

  it('asks again for the receipt when the transfer is not found', async () => {
    const { h, charge } = await waitingPayment();
    await h.press('pay:transfer');
    await h.document('comprobante.pdf');
    const { to, out } = await h.orchestrator.transferRejected(charge.id);
    expect(to).toBe(h.store.data.users[0]!.phone);
    expect(show(out)[0]).toMatch(/^❌ No encontramos tu transferencia por \$ 50\.000/);
    expect((await h.store.getCharge(charge.id)).transfer).toBeNull();
    await h.press('pay:transfer');
    expect(show(await h.photo())[0]).toMatch(/^🧾 Recibí tu comprobante/);
  });

  it('is not offered without a transfer account', async () => {
    const { h } = await waitingPayment();
    h.store.data.billing = { mode: 'live', prices: { setup: 15_000, report: 50_000 } };
    await h.say('generar');
    const out = show(await h.press(`c:${DEMO_IDS.ebs}`));
    expect(out.join('\n')).not.toContain('[Transferencia]');
  });
});

describe('certificates guide', () => {
  const withoutBackgroundChecks = () => {
    const h = harness();
    h.store.data.supports = h.store.data.supports.filter((s) => !['POLICIA', 'RNMC'].includes(s.code));
    return h;
  };

  it('walks through the missing certificates one at a time', async () => {
    const h = withoutBackgroundChecks();
    await h.say('certificados');
    let out = show(await h.press(`c:${DEMO_IDS.salud}`));
    expect(out[0]).toMatch(
      /^🧭 Vamos uno por uno con los soportes de tu informe 03 DE 03 \(1 al 30 de septiembre de 2026\): te faltan 2\./,
    );
    expect(out[1]).toMatch(/^📄 \*Antecedentes Policía\* \(1 de 2\)/);
    expect(out[1]).toContain('🔗 https://antecedentes.policia.gov.co:7005/WebJudicial/');
    expect(out[1]).toMatch(/\[⏭️ Saltar este\] \[✋ Terminar\]$/);
    expect(out[2]).toBe('1000000001');

    out = show(await h.press('gd:skip'));
    expect(out[0]).toMatch(/^📄 \*Medidas Correctivas\* \(2 de 2\)/);

    // A photo is not a certificate: ask for the PDF and stay in the guide.
    expect(show(await h.photo())[0]).toMatch(/^📸 Para los certificados necesito el \*PDF\*/);

    // The PDF carries both certificates: the guide ends and offers to generate.
    out = show(await h.document('antecedentes.pdf'));
    expect(out[0]).toMatch(/^📎 \*antecedentes.pdf\*/);
    expect(out.at(-1)).toMatch(
      /^🎉 Ya tienes todos los soportes de tu informe 03 DE 03 .*\[Generar documentos\]$/,
    );
  });

  it('stops when asked and says what is still missing', async () => {
    const h = withoutBackgroundChecks();
    await h.say('certificados');
    await h.press(`c:${DEMO_IDS.salud}`);
    expect(show(await h.say('terminar'))).toEqual(['Listo. Cuando quieras retomar, escribe *certificados*.']);
    // Back to normal: free text is an activity again.
    expect(show(await h.say('¿Qué me falta?')).at(-1)).toContain('[Guíame]');
  });
});

describe('reminders', () => {
  it('lists what is missing for the report in course, and respects STOP', async () => {
    const h = harness();
    h.store.data.supports = h.store.data.supports.filter((s) => s.code !== 'POLICIA');
    const maria = h.store.data.users.find((u) => u.phone === DEMO_PHONES.maria)!;
    const r = await h.orchestrator.supportsReminder(maria.id, DEMO_IDS.salud);
    expect(r?.missing).toEqual(['Antecedentes Policía']);
    expect(r?.report).toBe('informe 03 DE 03 (1 al 30 de septiembre de 2026)');
    expect(show([r!.message])[0]).toMatch(/^⏰ Hola María, tu informe 03 DE 03 .*\[Guíame\]$/s);

    await h.say('stop');
    expect(await h.orchestrator.supportsReminder(maria.id, DEMO_IDS.salud)).toBeNull();
    expect(show(await h.say('activar recordatorios'))).toEqual(['🔔 Listo, activé tus recordatorios.']);
    expect(await h.orchestrator.supportsReminder(maria.id, DEMO_IDS.salud)).not.toBeNull();
  });
});

describe('gestor: several people from one WhatsApp (ADR-042)', () => {
  it('invites a person, who authorizes from their WhatsApp, and switches between accounts', async () => {
    const h = harness();
    const ana = '+573005556677';
    let out = show(await h.say('agregar persona'));
    expect(out[0]).toMatch(/Escríbeme su número de WhatsApp/);
    expect(show(await h.say('300 555'))[0]).toMatch(/10 dígitos/);
    out = show(await h.say('300 555 6677'));
    expect(out[0]).toBe('✍️ ¿Cuál es su *nombre completo*?');
    out = show(await h.say('Ana María Pérez Gómez'));
    // Without the approved template, the person is asked to write to Pascal.
    expect(out[0]).toMatch(/^📨 Pídele a \*Ana María Pérez Gómez\* que me escriba/);

    // Nobody can work her accounts yet.
    out = show(await h.say('cambiar persona'));
    expect(out[0]).toMatch(/⏳ Esperando autorización: Ana María Pérez Gómez/);

    // Ana writes: the authorization question comes first, with the data policy.
    const a = h.as(ana);
    out = show(await a.say('Hola'));
    expect(out[0]).toMatch(/^👋 Hola Ana\. \*María Fernanda Prueba\* quiere preparar tus cuentas de cobro/);
    expect(out[1]).toBe('¿Autorizas que prepare tus cuentas de cobro? [Autorizo] [No autorizo]');
    const d = h.store.data.delegations![0]!;
    out = show(await a.press(`dlg:yes:${d.id}`));
    expect(out[0]).toMatch(/^✅ Listo, autorizaste a \*María Fernanda Prueba\*/);
    const anaUser = (await h.store.getUserByPhone(ana))!;
    expect(
      h.store.data.consents?.filter((c) => c.userId === anaUser.id).map((c) => c.kind ?? 'policy'),
    ).toEqual(['policy', 'terms']);
    // A second answer does nothing.
    expect(show(await a.press(`dlg:yes:${d.id}`))).toEqual(['Esa solicitud ya no está vigente.']);

    // María switches to Ana: every reply says whose accounts they are.
    out = show(await h.say('cambiar persona'));
    expect(out[0]).toBe(
      '👥 ¿De quién son las cuentas que vamos a trabajar?\n\nPara dejar de manejar las cuentas de alguien, escribe *revocar autorización*. [✅ Mis cuentas] [Ana María] [➕ Agregar persona]',
    );
    out = show(await h.press(`who:${anaUser.id}`));
    expect(out[0]).toMatch(
      /^👤 \*Ana María Pérez\*\n👥 Listo, ahora trabajamos con las cuentas de \*Ana María Pérez\*/,
    );
    out = show(await h.say('Hola'));
    // Ana has no contract yet: setup starts for her.
    expect(out[0]).toMatch(/^👤 \*Ana María Pérez\*\n📄 Para empezar necesito configurar tu contrato\./);
    expect(out[1]).toMatch(/¿Con qué institución es tu contrato\?/);

    // A signature is never taken from the gestor.
    await h.say('cancelar');
    out = show(await h.say('firma'));
    expect(out.join('\n')).toMatch(/solo la puede enviar esa persona desde su propio WhatsApp/);

    // Back to her own accounts.
    out = show(await h.press('who:me'));
    expect(out[0]).toBe('👥 Listo, volvimos a *tus* cuentas.');
    out = show(await h.say('¿Qué me falta?'));
    expect(out[0]).not.toMatch(/^👤/);
  });

  it('lets the person or the gestor revoke the authorization from WhatsApp', async () => {
    const h = harness();
    const ana = '+573005556677';
    await h.say('agregar persona');
    await h.say('3005556677');
    await h.say('Ana María Pérez Gómez');
    const a = h.as(ana);
    const d = h.store.data.delegations![0]!;
    // Written instead of tapped, it also counts (no repeated question).
    await a.say('Sí, autorizo');
    expect(h.store.data.delegations![0]!.status).toBe('active');
    const anaUser = (await h.store.getUserByPhone(ana))!;
    await h.press(`who:${anaUser.id}`);

    // Ana takes the access away: asked to confirm first.
    let out = show(await a.say('revocar autorización'));
    expect(out[0]).toMatch(/^🔐 ¿Qué autorización quieres revocar\? \[María Fernanda\]$/);
    out = show(await a.press(`rvk:ask:${d.id}`));
    expect(out[0]).toMatch(/^¿Le quito a \*María Fernanda Prueba\* el acceso.*\[Sí, revocar\] \[No\]$/s);
    expect(show(await a.press(`rvk:no:${d.id}`))).toEqual(['Listo, no cambié nada.']);
    out = show(await a.press(`rvk:yes:${d.id}`));
    expect(out).toEqual(['✅ Listo, *María Fernanda Prueba* ya no tiene acceso a tus cuentas.']);
    expect(h.store.data.delegations![0]!.status).toBe('revoked');

    // María was working Ana's accounts: her next message goes back to her own.
    out = show(await h.say('¿Qué me falta?'));
    expect(out[0]).toMatch(/^⚠️ Ya no tienes autorización para las cuentas de esa persona/);
    expect(show(await a.press(`rvk:yes:${d.id}`))).toEqual(['Esa autorización ya no está activa.']);
    expect(show(await a.say('revocar autorización'))[0]).toMatch(/^No tienes autorizaciones activas/);
  });

  it('lets the gestor stop managing a person', async () => {
    const h = harness();
    const ana = '+573005556677';
    await h.say('agregar persona');
    await h.say('3005556677');
    await h.say('Ana María Pérez Gómez');
    const d = h.store.data.delegations![0]!;
    await h.as(ana).press(`dlg:yes:${d.id}`);
    let out = show(await h.say('revocar'));
    expect(out[0]).toMatch(/\[Ana María\]$/);
    out = show(await h.press(`rvk:ask:${d.id}`));
    expect(out[0]).toMatch(/^¿Dejas de manejar las cuentas de \*Ana María Pérez Gómez\*\?/);
    out = show(await h.press(`rvk:yes:${d.id}`));
    expect(out).toEqual(['✅ Listo, ya no manejas las cuentas de *Ana María Pérez Gómez*.']);
    // Someone else cannot revoke it.
    expect(show(await h.as('+573001112299').press(`rvk:yes:${d.id}`))[0]).toMatch(/👋|Esa autorización/);
  });

  it('does not let anyone act for a person without an active authorization', async () => {
    const h = harness();
    const stranger = h.store.data.users.find((u) => u.phone !== DEMO_PHONES.maria)!;
    expect(show(await h.press(`who:${stranger.id}`))).toEqual([
      'No tengo autorización para las cuentas de esa persona.',
    ]);
  });
});
