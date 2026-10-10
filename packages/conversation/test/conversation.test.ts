import { describe, expect, it } from 'vitest';
import { DEMO_IDS } from '../src/demo.js';
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
    expect(show(await h.photo())).toEqual([
      '📷 Recibí tu foto. ¿Qué actividad muestra? Cuéntamelo en un mensaje.',
    ]);
    expect(await h.photo()).toEqual([]);
    await h.say('Ayer asistí a la reunión de entidades territoriales en el COVE de Ábrego');
    out = show(await h.press(`c:${DEMO_IDS.salud}`));
    expect(out[0]).toMatch(/^✅ Anotado el 27\/09\/2026 con 2 fotos en la obligación 3/);

    // Low-confidence note → the contractor picks the obligation from the list.
    await h.say('nota: hice el informe semanal');
    out = show(await h.press(`c:${DEMO_IDS.salud}`));
    expect(out[0]).toMatch(/¿A cuál obligación corresponde\? \{1\. Coordinar/);
    expect(show(await h.press('o:specific-1'))).toEqual(['✅ Listo, quedó en la obligación 1.']);

    // Checklist for both contracts.
    out = show(await h.say('¿Qué me falta?'));
    expect(out).toHaveLength(2);
    expect(out[0]).toContain('Informe 03 DE 03 (1 al 30 de septiembre de 2026)');
    expect(out[0]).toContain('⚠️ Obligación 2: 0 registros');
    expect(out[0]).toContain('✅ Antecedentes Policía');
    expect(out[0]).toContain('📌 Después de la firma del supervisor');
    expect(out[1]).toContain('❌ Certificado ejecución EBS');

    // Draft: obligation 2 has no notes → ask; then review and approve.
    await h.say('ver borrador');
    out = show(await h.press(`c:${DEMO_IDS.salud}`));
    expect(out[0]).toBe('✍️ Estoy redactando tu informe con lo que me contaste…');
    expect(out[1]).toMatch(
      /^Para la obligación 2 .* \[Escribir\/Audio\] \[Texto por defecto\] \[No aplicó\]$/,
    );
    out = show(await h.press('mis:na'));
    expect(out[0]).toContain('📄 *Borrador – Informe 03 DE 03*');
    expect(out[0]).toContain('→ Se capacitó a 30 personas en misión médica en El Carmen.');
    expect(out[0]).toContain('→ Se asistió a la reunión de entidades territoriales');
    expect(out[0]).toContain('*5.* Reserva y confidencialidad');
    expect(out[0]).toContain('→ Actividad cumplida.');

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

  it('blocks generation when a required support is missing, with links', async () => {
    const h = harness();
    // Approve all EBS drafts quickly with default texts.
    await h.say('ver borrador');
    await h.press(`c:${DEMO_IDS.ebs}`);
    for (let i = 0; i < 3; i++) await h.press('mis:default');
    await h.press('rev:approve');
    await h.say('generar');
    const out = show(await h.press(`c:${DEMO_IDS.ebs}`));
    expect(out[0]).toMatch(
      /^⚠️ Me faltan estos soportes para generar tu cuenta:\n❌ Certificado ejecución EBS/,
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
