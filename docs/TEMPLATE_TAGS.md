# Catálogo de etiquetas de plantillas

> Archivo generado con `pnpm tags:doc` a partir de `packages/docgen/src/catalog.ts`. No lo edites a mano.

## Cómo se usan

- Valor simple: `{{ contract_number }}`. Todos los valores llegan ya formateados (moneda, fechas, mayúsculas).
- Variables propias de la entidad (definidas en el panel): `{{ var_<clave> }}`, por ejemplo `{{ var_codigo_formato }}`.
- Valor por defecto si viene vacío: `{{ x_arl_no || '_' }}`.
- Repetir filas o párrafos: `{{FOR o IN obligations}}` … `{{$o.text}}` … `{{END-FOR o}}`.
  Dentro del ciclo los campos se leen con `$` (`$o.number`, `$o.activities`). En tablas, el `FOR` y el `END-FOR` van en filas propias.
- Condicional: `{{IF has_arl}}` … `{{END-IF}}`.
- Imagen: `{{IMAGE $e.image}}` dentro de `{{FOR e IN $o.evidences}}`.
- Las etiquetas pueden ir en el cuerpo, en tablas, en encabezados y en pies de página.

## Etiquetas

| Etiqueta | Tipo | Descripción |
|----------|------|-------------|
| `entity_name` | texto | Nombre de la entidad ("ESE HOSPITAL REGIONAL NOROCCIDENTAL"). |
| `entity_nit` | texto | NIT de la entidad. |
| `entity_city` | texto | Municipio sede de la entidad. |
| `contract_number` | texto | Número corto del contrato ("0999"). |
| `contract_number_full` | texto | Número completo ("CPS-0999-2026"). |
| `contract_year` | texto | Año del contrato ("2026"). |
| `contract_secop` | texto | Código SECOP ("CO1.PCCNTR.9000001"). |
| `contract_object` | texto | Objeto completo del contrato. |
| `process_name` | texto | Proceso o área ("SALUD PÚBLICA"). |
| `contract_start_date` | texto | Inicio del contrato, dd/mm/aaaa. |
| `contract_end_date` | texto | Fin del contrato, dd/mm/aaaa. |
| `contract_term` | texto | Plazo en texto ("3 MESES", "126 DÍAS"). |
| `contract_value` | texto | Valor total del contrato ("$ 12.000.000"). |
| `contract_value_words` | texto | Valor total en letras y números. |
| `contract_monthly_value` | texto | Valor mensual ("$ 4.000.000"). |
| `has_extension` | sí/no | Hay prórroga o adición registrada. |
| `extension_text` | texto | "SI" o "NO" (prórroga y/o adición). |
| `supervisor_name` | texto | Nombre del supervisor. |
| `supervisor_title` | texto | Cargo del supervisor ("SUBGERENTE"). |
| `supervisor_name_title` | texto | Nombre y cargo del supervisor ("NOMBRE – SUBGERENTE"). |
| `contractor_name` | texto | Nombre completo del contratista, en mayúsculas. |
| `contractor_cedula` | texto | Cédula con puntos ("1.098.765.432"). |
| `contractor_cedula_num` | texto | Cédula sin puntos ("1098765432"). |
| `contractor_city` | texto | Lugar de expedición del documento. |
| `contractor_regime` | texto | Régimen tributario ("simplificado" / "común"). |
| `x_regime_common` | texto | "X" o vacío. Régimen común. |
| `x_regime_simplified` | texto | "X" o vacío. Régimen simplificado. |
| `bank_name` | texto | Banco para el pago. |
| `bank_account` | texto | Número de cuenta. |
| `account_type` | texto | Tipo de cuenta ("Ahorros" / "Corriente"). |
| `x_account_savings` | texto | "X" o vacío. Cuenta de ahorros. |
| `x_account_checking` | texto | "X" o vacío. Cuenta corriente. |
| `period_start_date` | texto | Inicio del periodo, dd/mm/aaaa. |
| `period_end_date` | texto | Fin del periodo, dd/mm/aaaa. |
| `period_start_day` | texto | Día de inicio ("1"). |
| `period_end_day` | texto | Día de fin ("30"). |
| `period_month` | texto | Mes del fin del periodo en mayúsculas ("SEPTIEMBRE"). |
| `period_month_lower` | texto | Mes del fin del periodo en minúsculas ("septiembre"). |
| `period_year` | texto | Año del fin del periodo ("2026"). |
| `period_range_long` | texto | "1 al 30 de septiembre de 2026" o "3 de octubre al 2 de noviembre de 2026". |
| `period_range_upper` | texto | "DEL 1 AL 30 DE SEPTIEMBRE DE 2026" (para encabezados). |
| `report_number` | texto | Número de informe con ceros ("03"). |
| `report_total` | texto | Total de informes con ceros ("03"). |
| `report_label` | texto | "03 DE 03" o "02-06", según el formato del contrato. |
| `payment_label` | texto | "03 de 03" o "02-06" (línea "Pago No."). |
| `is_last_report` | sí/no | Es el último informe del contrato. |
| `next_report_date` | texto | Fecha del próximo informe, o "N/A – informe final". |
| `report_date` | texto | Fecha del informe de supervisión, dd/mm/aaaa (vacía si no se ha fijado). |
| `signing_day` | texto | Día de firma ("29") o "____". |
| `signing_month` | texto | Mes de firma en mayúsculas o "________". |
| `signing_year` | texto | Año de firma. |
| `payment_value` | texto | Valor a cobrar en este periodo ("$ 4.000.000"). |
| `payment_value_words` | texto | "CUATRO MILLONES DE PESOS M/CTE ($4.000.000)". |
| `payment_items[]` | lista | Conceptos del pago según el clausulado. |
| `payment_items[]` | objeto |  |
| `payment_items[].concept` | texto | Concepto del pago ("Honorarios", "Auxilio de transporte"). |
| `payment_items[].value` | texto | Valor del concepto ("$ 8.400.000"). |
| `execution_pct` | texto | % de ejecución del periodo ("100%"). |
| `has_arl` | sí/no | El contratista cotiza ARL. |
| `x_arl_yes` | texto | "X" o vacío. ARL: Sí. |
| `x_arl_no` | texto | "X" o vacío. ARL: No. |
| `ss_platform` | texto | Operador PILA ("APORTES EN LÍNEA"). |
| `ss_planilla` | texto | Número de planilla. |
| `ss_pin` | texto | PIN / número de autorización. |
| `ss_bank` | texto | Entidad financiera del pago. |
| `ss_payment_date` | texto | Fecha de pago, dd/mm/aaaa. |
| `ss_period` | texto | Periodo de cotización ("SEPTIEMBRE 2026"). |
| `ss_ibc` | texto | IBC ("$ 5.000.000"). |
| `ss_eps` | texto | EPS. |
| `ss_eps_value` | texto | Aporte a salud. |
| `ss_afp` | texto | Fondo de pensiones. |
| `ss_afp_value` | texto | Aporte a pensión. |
| `ss_fsp_value` | texto | Fondo de Solidaridad Pensional. |
| `ss_afc_value` | texto | AFC voluntario. |
| `ss_arl` | texto | ARL. |
| `ss_arl_value` | texto | Aporte a ARL. |
| `ss_total` | texto | Total pagado en la planilla. |
| `policia_date` | texto | Fecha del certificado de Policía. |
| `medidas_date` | texto | Fecha del certificado de Medidas Correctivas (RNMC). |
| `procuraduria_date` | texto | Fecha del certificado de Procuraduría. |
| `contraloria_date` | texto | Fecha del certificado de Contraloría. |
| `physical_execution` | texto | % de ejecución física ("100%"). |
| `budget_execution` | texto | % de ejecución presupuestal acumulada ("66,66%"). |
| `meeting_place` | texto | Lugar de la reunión de supervisión. |
| `meeting_start` | texto | Hora de inicio ("09:00 am"). |
| `meeting_end` | texto | Hora de fin ("10:30 am"). |
| `other_attendees` | texto | Otros asistentes ("NO HUBO"). |
| `x_deficient_performance_yes` | texto | "X" o vacío. ¿Desempeño deficiente? SI. |
| `x_deficient_performance_no` | texto | "X" o vacío. ¿Desempeño deficiente? NO. |
| `overall_rating` | objeto | Concepto general del cumplimiento de obligaciones generales. |
| `overall_rating.x_deficient` | texto | "X" o vacío. Calificación DEFICIENTE. |
| `overall_rating.x_improve` | texto | "X" o vacío. Calificación A MEJORAR. |
| `overall_rating.x_satisfactory` | texto | "X" o vacío. Calificación SATISFACTORIO. |
| `overall_rating.x_outstanding` | texto | "X" o vacío. Calificación SOBRESALIENTE. |
| `overall_rating.x_na` | texto | "X" o vacío. Calificación NO APLICA. |
| `balance_initial` | texto | Valor inicial del contrato. |
| `balance_additions` | texto | Valor de adiciones. |
| `balance_total` | texto | Valor total del contrato (inicial + adiciones). |
| `balance_paid` | texto | Valor pagado (pagos anteriores). |
| `balance_accrued_unpaid` | texto | Valor causado no pagado (este periodo). |
| `balance_executed` | texto | Valor total ejecutado. |
| `balance_not_executed` | texto | Valor no ejecutado. |
| `prior_payments[]` | lista | Pagos anteriores con su comprobante. |
| `prior_payments[]` | objeto |  |
| `prior_payments[].voucher` | texto | Comprobante del pago anterior ("ND 001092"). |
| `prior_payments[].value` | texto | Valor del pago anterior ("$ 4.000.000"). |
| `obligations[]` | lista | Todas las obligaciones: primero específicas y luego generales. |
| `obligations[]` | objeto |  |
| `obligations[].number` | texto | Número de la obligación ("1", "14"). |
| `obligations[].text` | texto | Texto literal de la obligación. |
| `obligations[].kind` | texto | specific \| general |
| `obligations[].activities[]` | lista | Párrafos de actividad aprobados (al menos uno). |
| `obligations[].activities[]` | objeto |  |
| `obligations[].activities[].text` | texto | Párrafo de actividad realizada. |
| `obligations[].evidences[]` | lista | Evidencias de la obligación en este periodo. |
| `obligations[].evidences[]` | objeto |  |
| `obligations[].evidences[].image` | imagen | Imagen lista para el comando IMAGE (ancho y alto en cm). |
| `obligations[].evidences[].caption` | texto | Pie de foto (puede ir vacío). |
| `obligations[].has_evidence` | sí/no | Hay al menos una evidencia. |
| `obligations[].approval` | texto | Valoración en el informe de supervisión ("CUMPLE"). |
| `obligations[].x_deficient` | texto | "X" o vacío. Calificación DEFICIENTE. |
| `obligations[].x_improve` | texto | "X" o vacío. Calificación A MEJORAR. |
| `obligations[].x_satisfactory` | texto | "X" o vacío. Calificación SATISFACTORIO. |
| `obligations[].x_outstanding` | texto | "X" o vacío. Calificación SOBRESALIENTE. |
| `obligations[].x_na` | texto | "X" o vacío. Calificación NO APLICA. |
| `obligations[].observations` | texto | Observaciones del supervisor. |
| `specific_obligations[]` | lista | Solo obligaciones específicas. |
| `specific_obligations[]` | objeto |  |
| `specific_obligations[].number` | texto | Número de la obligación ("1", "14"). |
| `specific_obligations[].text` | texto | Texto literal de la obligación. |
| `specific_obligations[].kind` | texto | specific \| general |
| `specific_obligations[].activities[]` | lista | Párrafos de actividad aprobados (al menos uno). |
| `specific_obligations[].activities[]` | objeto |  |
| `specific_obligations[].activities[].text` | texto | Párrafo de actividad realizada. |
| `specific_obligations[].evidences[]` | lista | Evidencias de la obligación en este periodo. |
| `specific_obligations[].evidences[]` | objeto |  |
| `specific_obligations[].evidences[].image` | imagen | Imagen lista para el comando IMAGE (ancho y alto en cm). |
| `specific_obligations[].evidences[].caption` | texto | Pie de foto (puede ir vacío). |
| `specific_obligations[].has_evidence` | sí/no | Hay al menos una evidencia. |
| `specific_obligations[].approval` | texto | Valoración en el informe de supervisión ("CUMPLE"). |
| `specific_obligations[].x_deficient` | texto | "X" o vacío. Calificación DEFICIENTE. |
| `specific_obligations[].x_improve` | texto | "X" o vacío. Calificación A MEJORAR. |
| `specific_obligations[].x_satisfactory` | texto | "X" o vacío. Calificación SATISFACTORIO. |
| `specific_obligations[].x_outstanding` | texto | "X" o vacío. Calificación SOBRESALIENTE. |
| `specific_obligations[].x_na` | texto | "X" o vacío. Calificación NO APLICA. |
| `specific_obligations[].observations` | texto | Observaciones del supervisor. |
| `general_obligations[]` | lista | Solo obligaciones generales. |
| `general_obligations[]` | objeto |  |
| `general_obligations[].number` | texto | Número de la obligación ("1", "14"). |
| `general_obligations[].text` | texto | Texto literal de la obligación. |
| `general_obligations[].kind` | texto | specific \| general |
| `general_obligations[].activities[]` | lista | Párrafos de actividad aprobados (al menos uno). |
| `general_obligations[].activities[]` | objeto |  |
| `general_obligations[].activities[].text` | texto | Párrafo de actividad realizada. |
| `general_obligations[].evidences[]` | lista | Evidencias de la obligación en este periodo. |
| `general_obligations[].evidences[]` | objeto |  |
| `general_obligations[].evidences[].image` | imagen | Imagen lista para el comando IMAGE (ancho y alto en cm). |
| `general_obligations[].evidences[].caption` | texto | Pie de foto (puede ir vacío). |
| `general_obligations[].has_evidence` | sí/no | Hay al menos una evidencia. |
| `general_obligations[].approval` | texto | Valoración en el informe de supervisión ("CUMPLE"). |
| `general_obligations[].x_deficient` | texto | "X" o vacío. Calificación DEFICIENTE. |
| `general_obligations[].x_improve` | texto | "X" o vacío. Calificación A MEJORAR. |
| `general_obligations[].x_satisfactory` | texto | "X" o vacío. Calificación SATISFACTORIO. |
| `general_obligations[].x_outstanding` | texto | "X" o vacío. Calificación SOBRESALIENTE. |
| `general_obligations[].x_na` | texto | "X" o vacío. Calificación NO APLICA. |
| `general_obligations[].observations` | texto | Observaciones del supervisor. |
| `evidence_obligations[]` | lista | Obligaciones que tienen evidencias (para el anexo). |
| `evidence_obligations[]` | objeto |  |
| `evidence_obligations[].number` | texto | Número de la obligación ("1", "14"). |
| `evidence_obligations[].text` | texto | Texto literal de la obligación. |
| `evidence_obligations[].kind` | texto | specific \| general |
| `evidence_obligations[].activities[]` | lista | Párrafos de actividad aprobados (al menos uno). |
| `evidence_obligations[].activities[]` | objeto |  |
| `evidence_obligations[].activities[].text` | texto | Párrafo de actividad realizada. |
| `evidence_obligations[].evidences[]` | lista | Evidencias de la obligación en este periodo. |
| `evidence_obligations[].evidences[]` | objeto |  |
| `evidence_obligations[].evidences[].image` | imagen | Imagen lista para el comando IMAGE (ancho y alto en cm). |
| `evidence_obligations[].evidences[].caption` | texto | Pie de foto (puede ir vacío). |
| `evidence_obligations[].has_evidence` | sí/no | Hay al menos una evidencia. |
| `evidence_obligations[].approval` | texto | Valoración en el informe de supervisión ("CUMPLE"). |
| `evidence_obligations[].x_deficient` | texto | "X" o vacío. Calificación DEFICIENTE. |
| `evidence_obligations[].x_improve` | texto | "X" o vacío. Calificación A MEJORAR. |
| `evidence_obligations[].x_satisfactory` | texto | "X" o vacío. Calificación SATISFACTORIO. |
| `evidence_obligations[].x_outstanding` | texto | "X" o vacío. Calificación SOBRESALIENTE. |
| `evidence_obligations[].x_na` | texto | "X" o vacío. Calificación NO APLICA. |
| `evidence_obligations[].observations` | texto | Observaciones del supervisor. |
| `contractor_duties[]` | lista | Obligaciones generales del contratista según la cláusula del contrato (tabla 1.2 del informe de supervisión). |
| `contractor_duties[]` | objeto |  |
| `contractor_duties[].number` | texto | Número de la obligación ("1", "14"). |
| `contractor_duties[].text` | texto | Texto literal de la obligación. |
| `contractor_duties[].x_deficient` | texto | "X" o vacío. Calificación DEFICIENTE. |
| `contractor_duties[].x_improve` | texto | "X" o vacío. Calificación A MEJORAR. |
| `contractor_duties[].x_satisfactory` | texto | "X" o vacío. Calificación SATISFACTORIO. |
| `contractor_duties[].x_outstanding` | texto | "X" o vacío. Calificación SOBRESALIENTE. |
| `contractor_duties[].x_na` | texto | "X" o vacío. Calificación NO APLICA. |
| `contractor_duties[].observations` | texto | Observaciones del supervisor. |
