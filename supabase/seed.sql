-- Seed: ESE Hospital Regional Noroccidental (HRNO) configuration. Safe for production.
-- Synthetic test data lives in seed_test.sql.
-- Idempotent: safe to run more than once.

insert into system_settings (key, value) values
  -- 2026: Decreto 1469 de 2025 (ratified by Decreto 159 de 2026). Contractors get no transport allowance, so only SMMLV.
  ('smmlv', '{"2025": 1423500, "2026": 1750905}'::jsonb)
on conflict (key) do nothing;

insert into policy_versions (kind, version, url) values
  ('privacy_policy', '1.0', 'https://pascalia.lat/politica-de-datos/'),
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
