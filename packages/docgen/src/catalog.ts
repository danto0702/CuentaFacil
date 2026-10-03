import { z } from 'zod';

/**
 * Base tag catalog available to every entity template, as `{{ tag }}`.
 * Values are pre-formatted strings so format authors never write code.
 * Entity-defined variables live under `var.<key>` (ADR-010).
 * This schema is the single source of truth for docs/TEMPLATE_TAGS.md.
 */

const s = (description: string) => z.string().describe(description);
const b = (description: string) => z.boolean().describe(description);
/** "X" when true, "" otherwise: for checkbox-like cells such as "Régimen simplificado _X_". */
const x = (description: string) => z.enum(['X', '']).describe(`"X" o vacío. ${description}`);

export const ImageSchema = z
  .object({
    width: z.number(),
    height: z.number(),
    data: z.any(),
    extension: z.enum(['.png', '.jpg', '.jpeg', '.gif']),
  })
  .describe('Imagen lista para el comando IMAGE (ancho y alto en cm).');

export const EvidenceSchema = z.object({
  image: ImageSchema,
  caption: s('Pie de foto (puede ir vacío).'),
});

export const ActivitySchema = z.object({ text: s('Párrafo de actividad realizada.') });

export const ObligationSchema = z.object({
  number: s('Número de la obligación ("1", "14").'),
  text: s('Texto literal de la obligación.'),
  kind: z.enum(['specific', 'general']).describe('specific | general'),
  activities: z.array(ActivitySchema).describe('Párrafos de actividad aprobados (al menos uno).'),
  evidences: z.array(EvidenceSchema).describe('Evidencias de la obligación en este periodo.'),
  has_evidence: b('Hay al menos una evidencia.'),
  approval: s('Valoración en el informe de supervisión ("CUMPLE").'),
  x_deficient: x('Calificación DEFICIENTE.'),
  x_improve: x('Calificación A MEJORAR.'),
  x_satisfactory: x('Calificación SATISFACTORIO.'),
  x_outstanding: x('Calificación SOBRESALIENTE.'),
  x_na: x('Calificación NO APLICA.'),
  observations: s('Observaciones del supervisor.'),
});

export const DutySchema = ObligationSchema.pick({
  number: true,
  text: true,
  x_deficient: true,
  x_improve: true,
  x_satisfactory: true,
  x_outstanding: true,
  x_na: true,
  observations: true,
});

export const PriorPaymentSchema = z.object({
  voucher: s('Comprobante del pago anterior ("ND 001092").'),
  value: s('Valor del pago anterior ("$ 4.000.000").'),
});

export const PaymentItemSchema = z.object({
  concept: s('Concepto del pago ("Honorarios", "Auxilio de transporte").'),
  value: s('Valor del concepto ("$ 8.400.000").'),
});

export const TemplateContextSchema = z.object({
  // Entidad
  entity_name: s('Nombre de la entidad ("ESE HOSPITAL REGIONAL NOROCCIDENTAL").'),
  entity_nit: s('NIT de la entidad.'),
  entity_city: s('Municipio sede de la entidad.'),

  // Contrato
  contract_number: s('Número corto del contrato ("0999").'),
  contract_number_full: s('Número completo ("CPS-0999-2026").'),
  contract_year: s('Año del contrato ("2026").'),
  contract_secop: s('Código SECOP ("CO1.PCCNTR.9000001").'),
  contract_object: s('Objeto completo del contrato.'),
  process_name: s('Proceso o área ("SALUD PÚBLICA").'),
  contract_start_date: s('Inicio del contrato, dd/mm/aaaa.'),
  contract_end_date: s('Fin del contrato, dd/mm/aaaa.'),
  contract_term: s('Plazo en texto ("3 MESES", "126 DÍAS").'),
  contract_value: s('Valor total del contrato ("$ 12.000.000").'),
  contract_value_words: s('Valor total en letras y números.'),
  contract_monthly_value: s('Valor mensual ("$ 4.000.000").'),
  has_extension: b('Hay prórroga o adición registrada.'),
  extension_text: s('"SI" o "NO" (prórroga y/o adición).'),
  supervisor_name: s('Nombre del supervisor.'),
  supervisor_title: s('Cargo del supervisor ("SUBGERENTE").'),
  supervisor_name_title: s('Nombre y cargo del supervisor ("NOMBRE – SUBGERENTE").'),

  // Contratista
  contractor_name: s('Nombre completo del contratista, en mayúsculas.'),
  contractor_cedula: s('Cédula con puntos ("1.098.765.432").'),
  contractor_cedula_num: s('Cédula sin puntos ("1098765432").'),
  contractor_city: s('Lugar de expedición del documento.'),
  contractor_regime: s('Régimen tributario ("simplificado" / "común").'),
  x_regime_common: x('Régimen común.'),
  x_regime_simplified: x('Régimen simplificado.'),
  bank_name: s('Banco para el pago.'),
  bank_account: s('Número de cuenta.'),
  account_type: s('Tipo de cuenta ("Ahorros" / "Corriente").'),
  x_account_savings: x('Cuenta de ahorros.'),
  x_account_checking: x('Cuenta corriente.'),

  // Periodo / cuenta
  period_start_date: s('Inicio del periodo, dd/mm/aaaa.'),
  period_end_date: s('Fin del periodo, dd/mm/aaaa.'),
  period_start_day: s('Día de inicio ("1").'),
  period_end_day: s('Día de fin ("30").'),
  period_month: s('Mes del fin del periodo en mayúsculas ("SEPTIEMBRE").'),
  period_month_lower: s('Mes del fin del periodo en minúsculas ("septiembre").'),
  period_year: s('Año del fin del periodo ("2026").'),
  period_range_long: s('"1 al 30 de septiembre de 2026" o "3 de octubre al 2 de noviembre de 2026".'),
  period_range_upper: s('"DEL 1 AL 30 DE SEPTIEMBRE DE 2026" (para encabezados).'),
  report_number: s('Número de informe con ceros ("03").'),
  report_total: s('Total de informes con ceros ("03").'),
  report_label: s('"03 DE 03" o "02-06", según el formato del contrato.'),
  is_last_report: b('Es el último informe del contrato.'),
  next_report_date: s('Fecha del próximo informe, o "N/A – informe final".'),
  report_date: s('Fecha del informe de supervisión, dd/mm/aaaa (vacía si no se ha fijado).'),
  signing_day: s('Día de firma ("29") o "____".'),
  signing_month: s('Mes de firma en mayúsculas o "________".'),
  signing_year: s('Año de firma.'),

  // Valor de la cuenta
  payment_value: s('Valor a cobrar en este periodo ("$ 4.000.000").'),
  payment_value_words: s('"CUATRO MILLONES DE PESOS M/CTE ($4.000.000)".'),
  payment_items: z.array(PaymentItemSchema).describe('Conceptos del pago según el clausulado.'),
  execution_pct: s('% de ejecución del periodo ("100%").'),

  // Seguridad social
  has_arl: b('El contratista cotiza ARL.'),
  x_arl_yes: x('ARL: Sí.'),
  x_arl_no: x('ARL: No.'),
  ss_platform: s('Operador PILA ("APORTES EN LÍNEA").'),
  ss_planilla: s('Número de planilla.'),
  ss_pin: s('PIN / número de autorización.'),
  ss_bank: s('Entidad financiera del pago.'),
  ss_payment_date: s('Fecha de pago, dd/mm/aaaa.'),
  ss_period: s('Periodo de cotización ("SEPTIEMBRE 2026").'),
  ss_ibc: s('IBC ("$ 5.000.000").'),
  ss_eps: s('EPS.'),
  ss_eps_value: s('Aporte a salud.'),
  ss_afp: s('Fondo de pensiones.'),
  ss_afp_value: s('Aporte a pensión.'),
  ss_fsp_value: s('Fondo de Solidaridad Pensional.'),
  ss_afc_value: s('AFC voluntario.'),
  ss_arl: s('ARL.'),
  ss_arl_value: s('Aporte a ARL.'),
  ss_total: s('Total pagado en la planilla.'),

  // Antecedentes (fecha según la regla de la entidad: revisión o expedición)
  policia_date: s('Fecha del certificado de Policía.'),
  medidas_date: s('Fecha del certificado de Medidas Correctivas (RNMC).'),
  procuraduria_date: s('Fecha del certificado de Procuraduría.'),
  contraloria_date: s('Fecha del certificado de Contraloría.'),

  // Supervisión
  physical_execution: s('% de ejecución física ("100%").'),
  budget_execution: s('% de ejecución presupuestal acumulada ("66,66%").'),
  meeting_place: s('Lugar de la reunión de supervisión.'),
  meeting_start: s('Hora de inicio ("09:00 am").'),
  meeting_end: s('Hora de fin ("10:30 am").'),
  other_attendees: s('Otros asistentes ("NO HUBO").'),
  x_deficient_performance_yes: x('¿Desempeño deficiente? SI.'),
  x_deficient_performance_no: x('¿Desempeño deficiente? NO.'),
  overall_rating: ObligationSchema.pick({
    x_deficient: true,
    x_improve: true,
    x_satisfactory: true,
    x_outstanding: true,
    x_na: true,
  }).describe('Concepto general del cumplimiento de obligaciones generales.'),

  // Balance financiero
  balance_initial: s('Valor inicial del contrato.'),
  balance_additions: s('Valor de adiciones.'),
  balance_total: s('Valor total del contrato (inicial + adiciones).'),
  balance_paid: s('Valor pagado (pagos anteriores).'),
  balance_accrued_unpaid: s('Valor causado no pagado (este periodo).'),
  balance_executed: s('Valor total ejecutado.'),
  balance_not_executed: s('Valor no ejecutado.'),
  prior_payments: z.array(PriorPaymentSchema).describe('Pagos anteriores con su comprobante.'),

  // Obligaciones
  obligations: z
    .array(ObligationSchema)
    .describe('Todas las obligaciones: primero específicas y luego generales.'),
  specific_obligations: z.array(ObligationSchema).describe('Solo obligaciones específicas.'),
  general_obligations: z.array(ObligationSchema).describe('Solo obligaciones generales.'),
  evidence_obligations: z
    .array(ObligationSchema)
    .describe('Obligaciones que tienen evidencias (para el anexo).'),
  contractor_duties: z
    .array(DutySchema)
    .describe(
      'Obligaciones generales del contratista según la cláusula del contrato (tabla 1.2 del informe de supervisión).',
    ),

  // Variables propias de la entidad
  var: z.record(z.string(), z.unknown()).describe('Variables definidas por la entidad: {{ var.clave }}.'),
});

export type TemplateContext = z.infer<typeof TemplateContextSchema>;
export type ObligationCtx = z.infer<typeof ObligationSchema>;

export interface CatalogEntry {
  path: string;
  type: string;
  description: string;
}

/** Flattens the schema into `path → type, description` (arrays as `name[].field`). */
export function catalogEntries(): CatalogEntry[] {
  const out: CatalogEntry[] = [];
  const walk = (schema: z.ZodType, path: string, description?: string) => {
    const desc = description ?? schema.description ?? '';
    if (schema instanceof z.ZodObject && !path.endsWith('image')) {
      if (path) out.push({ path, type: 'objeto', description: desc });
      for (const [k, v] of Object.entries(schema.shape as Record<string, z.ZodType>)) {
        walk(v, path ? `${path}.${k}` : k);
      }
      return;
    }
    if (schema instanceof z.ZodArray) {
      out.push({ path: `${path}[]`, type: 'lista', description: desc });
      walk(schema.element as z.ZodType, `${path}[]`, '');
      return;
    }
    const type =
      schema instanceof z.ZodBoolean
        ? 'sí/no'
        : schema instanceof z.ZodRecord
          ? 'variables'
          : path.endsWith('image')
            ? 'imagen'
            : 'texto';
    out.push({ path, type, description: desc });
  };
  walk(TemplateContextSchema, '');
  return out;
}

/** Top-level tag names usable directly in templates. */
export function topLevelTags(): Set<string> {
  return new Set(Object.keys(TemplateContextSchema.shape));
}
