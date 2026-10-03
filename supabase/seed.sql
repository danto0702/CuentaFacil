-- Seed: ESE Hospital Regional Noroccidental (HRNO) + synthetic test data (fictitious people).
-- Idempotent: safe to run more than once.

insert into system_settings (key, value) values
  ('smmlv', '{"2025": 1423500, "2026": null}'::jsonb)   -- 2026 must be set from the official decree before Phase 1
on conflict (key) do nothing;

insert into policy_versions (kind, version, url) values
  ('privacy_policy', '0.1-borrador', 'https://example.invalid/politica-tratamiento-datos'),
  ('terms', '0.1-borrador', 'https://example.invalid/terminos')
on conflict (kind, version) do nothing;

insert into entities (id, name, short_name, nit, municipality, department, settings) values (
  '00000000-0000-4000-8000-000000000001',
  'ESE HOSPITAL REGIONAL NOROCCIDENTAL', 'HRNO', '807.008.842-9', 'Ábrego', 'Norte de Santander',
  '{
    "proration": "commercial_30",
    "pila": { "contribution_month": "current", "payment_deadline_day": null },
    "ibc": { "pct": 0.4, "min_smmlv": 1, "max_smmlv": 25, "blocking": false },
    "certificate_max_age_days": 30,
    "background_check_date": "report_date",
    "balance": "paid_prior_accrued_current",
    "meeting": { "place": "ESE HOSPITAL REGIONAL NOROCCIDENTAL", "start": "09:00 am", "end": "10:30 am" },
    "default_activity_text": "Actividad cumplida.",
    "generate_with_missing": false,
    "goal_alert_threshold_pct": 70,
    "package": {
      "period_folder": "CUENTAS {MES} {AÑO}",
      "upload_folder": "DOCUMENTOS A CARGAR",
      "zip_name": "aprobacindelossoportespresentadosalsupervisordelcon.zip"
    }
  }'::jsonb
) on conflict (id) do nothing;

insert into entity_variables (entity_id, key, label, type, scope, source, default_value) values
  ('00000000-0000-4000-8000-000000000001', 'codigo_formato_supervision', 'Código del formato de supervisión', 'text', 'entity', 'admin', '"MA-GH-IS-03"'),
  ('00000000-0000-4000-8000-000000000001', 'version_formato_supervision', 'Versión del formato de supervisión', 'text', 'entity', 'admin', '"4.0"')
on conflict (entity_id, key) do nothing;

-- Checklist. Official links must be verified before Phase 1 (portals change often).
insert into support_types (entity_id, code, label, required, frequency, max_age_days, bundle, bundle_order, official_url, instructions, profiles) values
  ('00000000-0000-4000-8000-000000000001', 'PILA', 'Planilla de seguridad social (PILA)', true, 'every_period', null, null, null, null, 'Descarga la planilla pagada del mes en curso desde tu operador.', null),
  ('00000000-0000-4000-8000-000000000001', 'CERT_APORTES', 'Certificado de aportes', false, 'every_period', null, null, null, null, 'Lo descargas del operador PILA.', null),
  ('00000000-0000-4000-8000-000000000001', 'POLICIA', 'Antecedentes judiciales (Policía)', true, 'every_period', 30, 'ANTECEDENTES', 1, 'https://antecedentes.policia.gov.co:7005/WebJudicial/', 'Consulta con tu cédula y guarda la página como PDF.', null),
  ('00000000-0000-4000-8000-000000000001', 'RNMC', 'Registro Nacional de Medidas Correctivas', true, 'every_period', 30, 'ANTECEDENTES', 2, 'https://srvcnpc.policia.gov.co/PSC/frm_cnp_consulta.aspx', 'Consulta con tu cédula y descarga el certificado.', null),
  ('00000000-0000-4000-8000-000000000001', 'PROCURADURIA', 'Antecedentes disciplinarios (Procuraduría)', true, 'every_period', 30, 'ANTECEDENTES', 3, 'https://www.procuraduria.gov.co/Pages/Generacion-de-antecedentes.aspx', 'Genera el certificado ordinario.', null),
  ('00000000-0000-4000-8000-000000000001', 'CONTRALORIA', 'Antecedentes fiscales (Contraloría)', true, 'every_period', 30, 'ANTECEDENTES', 4, 'https://www.contraloria.gov.co/web/guest/persona-natural', 'Consulta como persona natural y descarga el PDF.', null),
  ('00000000-0000-4000-8000-000000000001', 'EPS', 'Certificado de afiliación EPS', true, 'every_period', 30, 'AFILIACIONES', 1, null, 'Descárgalo del portal de tu EPS.', null),
  ('00000000-0000-4000-8000-000000000001', 'ARL', 'Certificado de afiliación ARL', true, 'every_period', 30, 'AFILIACIONES', 2, null, 'Pídelo a tu ARL; debe cubrir todo el periodo del contrato.', null),
  ('00000000-0000-4000-8000-000000000001', 'AFP', 'Certificado de afiliación a pensión', true, 'every_period', 30, 'AFILIACIONES', 3, null, 'Descárgalo del portal de tu fondo de pensiones.', null),
  ('00000000-0000-4000-8000-000000000001', 'CERT_CUMPLIMIENTO', 'Certificado de cumplimiento (lo expide la entidad)', true, 'every_period', null, null, null, null, 'Lo expide el supervisor después de firmar; envíamelo cuando lo tengas.', null),
  ('00000000-0000-4000-8000-000000000001', 'CERT_EJECUCION_EBS', 'Certificado de ejecución del coordinador EBS', true, 'every_period', null, null, null, null, 'Lo expide la coordinación de Equipos Básicos de Salud.', array['ebs']),
  ('00000000-0000-4000-8000-000000000001', 'DSE', 'Documento Soporte DIAN (lo expide la entidad)', true, 'every_period', null, null, null, null, 'Lo expide contabilidad de la entidad.', null),
  ('00000000-0000-4000-8000-000000000001', 'FICHA_SECOP', 'Ficha del contrato en SECOP II', true, 'once', null, null, null, null, 'Imprime la ficha del contrato desde SECOP II como PDF.', null),
  ('00000000-0000-4000-8000-000000000001', 'RUT', 'RUT', true, 'at_start', null, null, null, null, null, null),
  ('00000000-0000-4000-8000-000000000001', 'CEDULA', 'Cédula', true, 'at_start', null, null, null, null, null, null),
  ('00000000-0000-4000-8000-000000000001', 'CUENTA_BANCARIA', 'Certificación bancaria', true, 'at_start', null, null, null, null, null, null)
on conflict (entity_id, code) do nothing;

update support_types set stage = 'after_signature'
where entity_id = '00000000-0000-4000-8000-000000000001' and code in ('CERT_CUMPLIMIENTO', 'DSE');

insert into reminder_rules (entity_id, trigger_kind, trigger_value, support_code, action, wa_template)
select '00000000-0000-4000-8000-000000000001'::uuid, r.trigger_kind, r.trigger_value, r.support_code, r.action, r.wa_template
from (values
  ('day_of_month', 20, 'PILA', 'pay_pila', 'recordatorio_planilla'),
  ('day_of_month', 25, null, 'download_background_checks', 'recordatorio_antecedentes'),
  ('period_end', 0, null, 'close_report', 'recordatorio_cierre'),
  ('days_before_contract_end', 15, null, 'new_contract', 'aviso_fin_contrato')
) as r(trigger_kind, trigger_value, support_code, action, wa_template)
where not exists (
  select 1 from reminder_rules x
  where x.entity_id = '00000000-0000-4000-8000-000000000001' and x.wa_template = r.wa_template
);

-- Second, fictitious entity: a contractor can have contracts with several entities.
insert into entities (id, name, short_name, nit, municipality, department, settings) values (
  '00000000-0000-4000-8000-000000000002', 'ESE DE PRUEBA SAN JOSÉ', 'ESEPRUEBA', '900.000.000-1', 'Ocaña', 'Norte de Santander',
  '{ "proration": "commercial_30", "pila": { "contribution_month": "previous" }, "ibc": { "pct": 0.4, "blocking": false },
     "certificate_max_age_days": 30, "background_check_date": "issue_date", "default_activity_text": "Actividad cumplida." }'::jsonb
) on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Synthetic contractors and contracts (fictitious; no real people)
-- ---------------------------------------------------------------------------
insert into users (id, phone_e164, full_name, doc_type, doc_number_last4, doc_issued_in, tax_regime, bank_name, bank_account_type, bank_account_last4, status) values
  ('00000000-0000-4000-8000-000000000101', '+573000000001', 'María Fernanda Prueba Ficticia', 'CC', '0001', 'Ocaña', 'simplificado', 'Banco de Prueba', 'ahorros', '0001', 'active'),
  ('00000000-0000-4000-8000-000000000102', '+573000000002', 'Carlos Andrés Ejemplo Sintético', 'CC', '0002', 'Ábrego', 'simplificado', 'Banco de Prueba', 'ahorros', '0002', 'active')
on conflict (id) do nothing;

insert into contracts (id, user_id, entity_id, number, number_full, secop_code, object_text, process_area, contract_profile,
                       start_date, end_date, term_text, total_value, monthly_value, payments_count, report_number_fmt,
                       period_mode, supervisor_name, supervisor_title, status) values
  ('00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000001',
   '0001', 'CPS-0001-2026', 'CO1.PCCNTR.0000001',
   'PRESTACIÓN DE LOS SERVICIOS PROFESIONALES ESPECIALIZADOS INDEPENDIENTES COMO COORDINADOR ADMINISTRATIVO DE SALUD PÚBLICA DE LA ESE HOSPITAL REGIONAL NOROCCIDENTAL.',
   'SALUD PÚBLICA', 'salud_publica', '2026-07-06', '2026-09-30', '3 MESES', 12000000, 4000000, 3, 'NN DE NN',
   'month_end', 'SUPERVISOR DE PRUEBA', 'SUBGERENTE', 'active'),
  ('00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000001',
   '0002', 'CPS-0002-2026', 'CO1.PCCNTR.0000002',
   'PRESTACIÓN DE SERVICIOS INDEPENDIENTES COMO ENFERMERO PROFESIONAL PARA LA CONFORMACIÓN DEL EQUIPO BÁSICO DE ATENCIÓN.',
   'EQUIPOS BÁSICOS DE SALUD', 'ebs', '2026-08-20', '2026-12-23', '126 DÍAS', 39688000, 9020000, 5, 'NN-NN',
   'date_to_date', 'COORDINADOR DE PRUEBA', 'COORDINADOR EBS', 'active'),
  ('00000000-0000-4000-8000-000000000203', '00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000002',
   '0003', 'CPS-0003-2026', null,
   'PRESTACIÓN DE SERVICIOS DE APOYO ADMINISTRATIVO.', 'ADMINISTRATIVA', null, '2026-10-03', '2027-01-02', '3 MESES',
   6000000, 2000000, 3, 'NN DE NN', 'date_to_date', 'SUPERVISORA DE PRUEBA', 'GERENTE', 'active')
on conflict (id) do nothing;

-- EBS-style schedule: 12 days + 4 months, each with fees + transport (transport doesn't count for IBC).
insert into payment_schedule (id, contract_id, payment_number, days, months, amount, source) values
  ('00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000202', 1, 12, null, 3608000, 'clauses'),
  ('00000000-0000-4000-8000-000000000302', '00000000-0000-4000-8000-000000000202', 2, null, 1, 9020000, 'clauses'),
  ('00000000-0000-4000-8000-000000000303', '00000000-0000-4000-8000-000000000202', 3, null, 1, 9020000, 'clauses'),
  ('00000000-0000-4000-8000-000000000304', '00000000-0000-4000-8000-000000000202', 4, null, 1, 9020000, 'clauses'),
  ('00000000-0000-4000-8000-000000000305', '00000000-0000-4000-8000-000000000202', 5, null, 1, 9020000, 'clauses')
on conflict (id) do nothing;

insert into payment_schedule_items (schedule_id, concept, amount, counts_for_ibc)
select ps.id, i.concept, i.amount, i.counts_for_ibc
from payment_schedule ps
cross join lateral (values
  ('Honorarios', case when ps.payment_number = 1 then 3360000 else 8400000 end, true),
  ('Auxilio de transporte', case when ps.payment_number = 1 then 248000 else 620000 end, false)
) as i(concept, amount, counts_for_ibc)
where ps.contract_id = '00000000-0000-4000-8000-000000000202'
  and not exists (select 1 from payment_schedule_items x where x.schedule_id = ps.id);

insert into obligations (contract_id, kind, number, literal_text) values
  ('00000000-0000-4000-8000-000000000201', 'specific', 1, 'Coordinar los procesos y actividades de vigilancia en salud pública y notificación de eventos epidemiológicos de la entidad a los entes responsables y hacer seguimiento a las IPS.'),
  ('00000000-0000-4000-8000-000000000201', 'specific', 2, 'Reorganizar los programas y actividades que sean establecidos en cada línea de acción de salud pública a nivel de la entidad.'),
  ('00000000-0000-4000-8000-000000000201', 'specific', 3, 'Asistir a las reuniones en las diferentes entidades territoriales de jurisdicción de la ESE cuando sea requerido.'),
  ('00000000-0000-4000-8000-000000000201', 'specific', 4, 'Enlace en las actividades extramurales y/o intramurales en cada uno de los municipios donde tiene injerencia la entidad.'),
  ('00000000-0000-4000-8000-000000000201', 'general', 5, 'Reserva y confidencialidad de la información que se obtenga por medio del presente contrato.'),
  ('00000000-0000-4000-8000-000000000201', 'general', 6, 'Cumplir las demás obligaciones afines con la naturaleza de la labor contratada.'),
  ('00000000-0000-4000-8000-000000000202', 'specific', 1, 'Caracterización y seguimiento a planes de cuidado familiares.'),
  ('00000000-0000-4000-8000-000000000202', 'specific', 2, 'Formulación y ejecución del plan de cuidado comunitario.'),
  ('00000000-0000-4000-8000-000000000202', 'specific', 3, 'Formulación y seguimiento a planes de cuidado individuales.'),
  ('00000000-0000-4000-8000-000000000203', 'specific', 1, 'Apoyar la gestión documental del área.'),
  ('00000000-0000-4000-8000-000000000203', 'general', 2, 'Cumplir las demás obligaciones afines con la naturaleza de la labor contratada.')
on conflict (contract_id, kind, number) do nothing;

insert into contractor_duties (contract_id, number, text) values
  ('00000000-0000-4000-8000-000000000201', 1, 'Actuar con plena eficiencia y responsabilidad desarrollando aquellas actividades que sean compatibles con el objeto del contrato.'),
  ('00000000-0000-4000-8000-000000000201', 2, 'Cumplir con los objetivos, actos, obligaciones, orientaciones y prioridades que vayan estableciéndose durante la ejecución del contrato.'),
  ('00000000-0000-4000-8000-000000000201', 3, 'Asumir por cuenta propia los valores de los gastos por concepto de estampillas e impuestos.'),
  ('00000000-0000-4000-8000-000000000201', 4, 'Afiliarse al Sistema General de Seguridad Social y presentar dichas certificaciones para su respectivo pago.')
on conflict (contract_id, number) do nothing;

insert into periods (contract_id, report_number, payment_number, date_from, date_to, amount, amount_source, status) values
  ('00000000-0000-4000-8000-000000000201', 1, 1, '2026-07-06', '2026-07-31', 4000000, 'contractor', 'delivered'),
  ('00000000-0000-4000-8000-000000000201', 2, 2, '2026-08-01', '2026-08-31', 4000000, 'schedule', 'delivered'),
  ('00000000-0000-4000-8000-000000000201', 3, 3, '2026-09-01', '2026-09-30', 4000000, 'schedule', 'collecting'),
  ('00000000-0000-4000-8000-000000000202', 1, 1, '2026-08-20', '2026-09-19', 3608000, 'schedule', 'delivered'),
  ('00000000-0000-4000-8000-000000000202', 2, 2, '2026-09-20', '2026-10-19', 9020000, 'schedule', 'collecting'),
  ('00000000-0000-4000-8000-000000000203', 1, 1, '2026-10-03', '2026-11-02', 2000000, 'schedule', 'collecting')
on conflict (contract_id, report_number) do nothing;

insert into period_payments (period_id, voucher, paid_on, amount)
select p.id, v.voucher, v.paid_on, 4000000
from periods p
join (values (1, 'ND 000001', date '2026-08-12'), (2, 'ND 000002', date '2026-09-11')) as v(n, voucher, paid_on)
  on p.report_number = v.n
where p.contract_id = '00000000-0000-4000-8000-000000000201'
  and not exists (select 1 from period_payments x where x.period_id = p.id);
