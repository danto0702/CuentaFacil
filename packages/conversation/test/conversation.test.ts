import { describe, expect, it } from 'vitest';
import { DEMO_IDS, DEMO_PHONES } from '../src/demo.js';
import { MONTHS } from '../src/text.js';
import { harness, show } from './harness.js';

describe('recorded conversation: a month of notes to delivery', () => {
  it('runs the whole flow for the salud pública contract', async () => {
    const h = harness();

    expect(show(await h.say('Hola'))[0]).toMatch(/^Hola María 👋 ¿Qué quieres hacer\?/);

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
      '✅ Listo, quedó en la obligación 1.\n📅 Informe 03 DE 03 (1 al 30 de septiembre de 2026)\n¿Esta actividad sirve también para otra? [➕ Otra obligación]',
    ]);
    // The same activity can support several obligations.
    out = show(await h.press(`add:${noteId}`));
    expect(out[0]).toMatch(/^¿En qué otra obligación va esta actividad\?/);
    expect(out[0]).not.toContain('1. Coordinar');
    expect(show(await h.press('o:specific-3'))).toEqual([
      '✅ También quedó en la obligación 3.\n📅 Informe 03 DE 03 (1 al 30 de septiembre de 2026) [➕ Otra obligación]',
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
    out = show(await h.say('ok'));
    expect(out[0]).toBe(
      'No estoy seguro de qué quieres hacer con «ok». ¿Es una actividad que hiciste o quieres que haga algo? [Anotar actividad] [Ver menú]',
    );
    expect(h.store.data.notes.length).toBe(notes);
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
      '¿Quieres que trabajemos en ese informe? [Trabajar el informe] [Anotar actividad] [Ver menú]',
    );
    expect(h.store.data.notes.length).toBe(notes);
    out = show(await h.press('short:do:open_report'));
    expect(out.join(' ')).not.toMatch(/Anotado/);
    // A long activity is still recorded.
    await h.say('Hoy hice la visita de inspección a las tres IPS del municipio y levanté las actas');
    await h.press(`c:${DEMO_IDS.salud}`);
    expect(h.store.data.notes.length).toBe(notes + 1);
  });

  it('asks to accept new terms once and then handles the message the user had sent', async () => {
    const h = harness();
    h.store.data.consents = (h.store.data.consents ?? []).map((c) => ({ ...c, policyVersion: '1.0' }));
    let out = show(await h.say('¿Qué me falta?'));
    expect(out[0]).toMatch(/^📜 Actualizamos los términos del servicio de CuentaFacil \(versión 1\.1\)/);
    expect(out[1]).toBe(
      '¿Aceptas los términos del servicio? Apenas aceptes, sigo con tu mensaje. [Acepto] [No acepto]',
    );
    out = show(await h.press('terms:yes'));
    expect(out[0]).toBe('✅ ¡Gracias! Quedó registrada tu aceptación de los términos.');
    expect(out[1]).toContain('📄 *0001 Salud Pública*');
    // Accepted: not asked again.
    out = show(await h.say('menú'));
    expect(out[0]).toMatch(/^Hola María/);
    expect(await h.store.acceptedVersion(h.store.data.users[0]!.id, 'terms')).toBe('1.1');
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
    expect(menu[0]).toContain('Conocer PascalIA');
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
    // Support is always available.
    expect(show(await h.say('soporte'))[0]).toMatch(/soporte/);
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
