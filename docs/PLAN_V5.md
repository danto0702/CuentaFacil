# CuentaFacil — Plan v5: modelo de servicio y Fase 1

> Estado: **PROPUESTA — pendiente de aprobación del dueño.** Fecha: 2026-10-10.
> Complementa [`PLAN.md`](./PLAN.md) (arquitectura y Fase 0, que siguen vigentes) con las respuestas del dueño del 2026-10-10 y la *Especificación del proceso de cuentas de cobro* (documento de referencia del servicio actual del dueño, no se sube al repo).
> Decisiones nuevas: ADR-020 a ADR-028 en [`DECISIONES.md`](./DECISIONES.md).

## 1. Lo que cambia frente al plan v4

| Tema | v4 (Fase 0) | v5 |
|------|-------------|----|
| Alta del contrato | La carga un administrador en el panel | **El contratista la hace por WhatsApp** enviando contrato SECOP + clausulado; la IA extrae y él confirma |
| Fecha de inicio | Del contrato | De la **base de contratos de la entidad** (Excel, columna `FECHA ACTAINICIO`); si no está, se pregunta |
| Formato del informe | Plantilla de la entidad | Contrato nuevo → plantilla de la entidad. Contrato con informes previos → **se pide el informe anterior** y se copia su estilo y redacción |
| Afiliaciones | Una vez | **Cada cuenta** (vigencia 30 días), igual que los antecedentes |
| Certificación | Soporte "después de la firma" | Indicador por contrato **"requiere certificación"**; pueden ser **varias** (supervisor o coordinador) y van en el ZIP |
| Firma | Pospuesta | **Opcional** en la configuración; sin firma se entrega sin firma |
| Cobro | Fase 3, suscripción | **$10.000 por configurar un contrato** y **$50.000 por informe** antes de entregar el ZIP; Wompi y **códigos de pago en efectivo** |
| Varios meses | Una cuenta por periodo | **Unión de cuentas**: un informe para dos o más meses, se cobra como uno |
| Correcciones | Regenerar | **Gratis**, también a partir de una **captura de pantalla** con lo que pidió el supervisor |
| Casos difíciles | Bandeja de soporte | **Gestión personalizada por una persona**, sin costo adicional |

## 2. Los tres momentos del servicio

### 2.1 Configuración (una vez por contrato)

1. **Documentos.** Pascal pide el **contrato de SECOP** (PDF "CO1.PCCNTR…") y el **clausulado**.
2. **Extracción (IA, salida JSON validada).**
   - Contrato SECOP: ID SECOP, número (CPS-NNNN-AAAA), objeto, valor, duración, fecha de terminación, entidad, contratista, documento, banco, tipo y número de cuenta.
   - Clausulado: objeto, **obligaciones específicas (texto literal, en orden)**, obligaciones generales, valor y forma de pago (mensualidades, primer pago), duración, documentos que exige la cuenta.
3. **Base de contratos de la entidad.** Se busca por número de contrato + documento del contratista y se toman **fecha del acta de inicio**, tiempo de ejecución (días) y valor inicial. Si no está, o no coincide con el PDF, se pregunta.
4. **Resumen y confirmación.** Pascal muestra un resumen corto (sin cuenta bancaria ni cédula completas) y obligación por obligación; el contratista confirma o corrige.
5. **Preguntas de configuración.**
   - Corte: fin de mes o fecha a fecha.
   - ¿La cuenta **requiere certificación**? (sí/no)
   - ¿Es tu **primer informe** de este contrato? Si no: cuáles ya cobró (número de informe y valor) y **que envíe el informe anterior** (DOCX preferido; PDF también sirve).
   - **Firma** (opcional): foto de la firma en papel blanco → se limpia el fondo → vista previa → confirma.
   - Prórroga o adición: por defecto no hay.
6. **Pago de configuración: $10.000** (Wompi o código). El contrato queda **activo** y empieza el reporte diario.

### 2.2 Reporte de actividades (durante el periodo)

- Notas de voz, texto y fotos, con fechas relativas ("ayer", "el 15"). Si tiene varios contratos, Pascal pregunta a cuál va.
- Cada entrada se clasifica a una o varias obligaciones; la persona puede corregir.
- Recordatorio diario opcional a la hora que elija (plantilla `recordatorio_diario`).
- Comandos: *ver mi cuenta*, *qué me falta*, *hazlo ya* (adelanta el cierre), *unir cuentas*, *hablar con una persona*.

### 2.3 Cierre de la cuenta (al final del periodo o con *hazlo ya*)

1. **Soportes del mes**, con el enlace de cada portal:
   - **Planilla** de seguridad social del mes cobrado (una por cada mes si la cuenta une varios).
   - **Antecedentes** (4, en cualquier orden): Policía (judiciales), Procuraduría (disciplinarios), Contraloría (fiscales), Medidas Correctivas. Vigencia 30 días.
   - **Afiliaciones** (3): salud, pensión, ARL. Vigencia 30 días.
   - **Certificaciones** (si el contrato las requiere): una o varias.
2. **Lectura automática** de cada soporte (operador, número, PIN, IBC, valores, fechas, resultado) → resumen → confirmación.
3. **Validaciones** (sección 5).
4. **Revisión en el chat, actividad por actividad**: Pascal muestra la redacción de cada obligación y las evidencias elegidas; la persona aprueba, corrige o dicta de nuevo. Las obligaciones sin registros se proponen con el texto del informe anterior marcado como pendiente, nunca con hechos inventados.
5. **Pago del informe: $50.000** (Wompi o código).
6. **Generación y entrega**: informe de actividades (DOCX + PDF), informe de supervisión (DOCX + PDF), ANTECEDENTES.pdf, AFILIACIONES.pdf, planilla(s), certificación(es) y el **ZIP** con la estructura de carpetas. Antes de pagar no se entregan archivos.
7. **Correcciones gratis**: la persona describe el cambio o envía una **captura** del mensaje del supervisor; la IA extrae los cambios, Pascal los confirma y regenera desde los datos (nunca edita el PDF).

## 3. Unión de cuentas

Una **cuenta** cubre uno o más periodos consecutivos del mismo contrato (`account_periods`).

| Elemento | Regla |
|----------|-------|
| Periodo | `DEL 1 DE AGOSTO AL 30 DE SEPTIEMBRE DE 2026` |
| Pago No. | `02 y 03 de 03` (si la plantilla usa guion: `02-03 de 03`) |
| Encabezado | `INFORME – No. 02 y 03 DE 03 - DEL 1 DE AGOSTO AL 30 DE SEPTIEMBRE DE 2026` |
| Seguridad social | **Una tabla completa por mes** (con su planilla) en el informe de actividades y en el de supervisión (2.1) |
| Antecedentes y afiliaciones | Una sola vez, vigentes al radicar |
| Actividades | Una tabla; cada obligación integra lo de todos los meses |
| Valor certificado | Suma de los periodos, en letras y números |
| Balance | Todos los periodos unidos como "causado no pagado"; % presupuestal hasta el último periodo unido |
| Compromiso | Último día del periodo siguiente al último unido |
| Carpeta | `CUENTAS AGOSTO-SEPTIEMBRE 2026` |
| Precio | Un informe ($50.000) |

## 4. Pagos

| Concepto | Valor | Cuándo |
|----------|-------|--------|
| Configuración de contrato | $10.000 | Después de mostrar el resumen de la configuración, antes de activar el contrato. Cubre prórrogas y adiciones |
| Informe | $50.000 | Por contrato y por cuenta (una cuenta unida de varios meses paga uno), antes de entregar archivos |
| Correcciones y gestión personalizada | $0 | Siempre |

- **Wompi**: link de pago enviado por WhatsApp (botón URL). El webhook firmado de Wompi confirma y dispara la entrega. Idempotencia por referencia.
- **Códigos en efectivo**: en el panel, **Pagos › Generar código** con: valor, tipo de servicio (configuración $10.000 / informe $50.000), nombre y documento de quien paga. Se genera un código corto (ej. `PF-7K3M-Q9`) **atado al contratista** (su documento): solo funciona desde su conversación, sirve para **un solo servicio** (una configuración o una cuenta) y **vence a los 30 días**. La persona lo escribe en el chat; el sistema valida contratista, valor y servicio contra lo pendiente y lo marca usado. Todo queda en `payments` con método `cash_code` y quién lo generó.
- Precios en `system_settings` (no en el código), para poder cambiarlos sin desplegar.

## 5. Validaciones (de la especificación, con las respuestas del dueño)

| Comprobación | Severidad |
|--------------|-----------|
| Periodo dentro del plazo; número de informe válido | Bloquea |
| Planilla del mes cobrado (una por mes en cuentas unidas) | Bloquea |
| IBC ≥ 40 % de la suma de honorarios de los contratos cubiertos | **Advierte**; si la persona acepta, queda registrado (`events`) |
| Suma de aportes = total (± $100) | Bloquea |
| Identidad (nombre y documento) en planilla y certificados | Bloquea |
| Antecedentes con hallazgo | **Bloquea y avisa** |
| Certificados vencidos (más de 30 días al radicar) | Bloquea |
| Cobertura ARL que no cubre el periodo | Advierte |
| Certificación faltante en contrato que la requiere | Bloquea |
| Coherencia entre informes (planilla, valores, periodo) | Bloquea |
| % presupuestal, balance y monto en letras | Bloquea |
| Obligaciones completas y literales; sin pendientes sin confirmar | Bloquea |
| **Campos del supervisor en blanco**: fecha del informe, día y mes de la constancia, columna de aprobación, **firma del supervisor** | Bloquea |
| Búsqueda de residuos del mes anterior en ambos documentos | Bloquea |

## 6. Gestión personalizada (humana)

- Se activa cuando: falla la extracción o el control de calidad, la persona escribe *hablar con una persona*, o un caso no está cubierto (formato raro, contrato de un tercero, etc.).
- La conversación pasa a estado **atención humana**: el bot deja de responder solo y avisa el horario; en el panel aparece en **Bandeja** con el contexto (documentos, extracciones, errores).
- **Atiende el dueño**, de **8:00 a. m. a 12:00 m. y de 2:00 p. m. a 6:00 p. m.** (hora de Colombia). Fuera de ese horario Pascal responde: "Te atiende una persona de nuestro equipo a partir de las 8:00 a. m.". El horario queda en `system_settings`.
- El operador puede corregir datos, subir un DOCX corregido, marcar validaciones como resueltas (queda registrado) y enviar mensajes por el bot. Al terminar, devuelve la conversación a Pascal.
- Sin costo adicional; el pago del informe sigue siendo el mismo.

## 7. Base de contratos de la entidad

- **Fuente:** información pública de contratación de la entidad (SECOP II). El archivo de referencia cubre del 1 de enero al 10 de octubre de 2026 (658 contratos de HRNO).
- Panel → **Entidades › Base de contratos**: **cargar el Excel mes a mes**; se mapean columnas (código, objeto, valor, tiempo de ejecución en días, contratista "documento + nombre", fecha de registro, **fecha del acta de inicio**) y se **agregan o actualizan** filas por `(entidad, código, documento)`, sin borrar las anteriores. Cada carga queda registrada (fecha, archivo, filas nuevas y actualizadas).
- Tabla `entity_contract_registry` (solo staff y `service_role`; el contratista nunca la ve completa). Búsqueda por `(entidad, número, documento)`.
- Aunque la fuente es pública, los documentos de identidad se guardan cifrados y solo se usan para precargar la configuración de quien se registra; la política 1.1 menciona esta fuente.

## 8. Formatos y estilo por contrato

- **Contrato nuevo** → plantilla predeterminada de la entidad (`contract_profile`).
- **Contrato con informes previos** → se pide el informe anterior:
  - Se extrae el **estilo**: número de informe (`03 DE 03` vs `3 de 6`), texto del periodo, mayúsculas, tiempo verbal, numeración de obligaciones, rótulos de anexos; se guarda en `contracts.style` y la plantilla lo aplica.
  - Se guarda la **redacción anterior por obligación** como referencia para proponer textos y para la búsqueda de residuos.
  - Si el informe anterior solo está en **PDF**, basta con copiar estilo y redacción (no pasa a atención humana).
  - Si el DOCX trae un formato de la entidad distinto al cargado (otra versión), se marca para que un operador lo revise y lo suba al panel como nueva versión (gestión personalizada).

## 9. Fases propuestas (reemplaza la sección 6 de `PLAN.md`)

| Fase | Contenido | Recursos pagados |
|------|-----------|------------------|
| **1a — Núcleo real, piloto interno** | Supabase, worker, webhook de WhatsApp y colas; configuración por documentos (extracción de contrato y clausulado, base de contratos, informe anterior); reporte diario (voz/texto/foto); cierre con soportes y lectura automática; validaciones; revisión en el chat; generación y entrega; firma opcional; correcciones con captura; atención humana. Solo con tu número y 2–3 contratistas de confianza, sin cobro. | Supabase Pro, Railway, Anthropic, STT, Meta (pido autorización antes) |
| **1b — Cobro y unión de cuentas** | Códigos de pago en efectivo (panel), cobro de $10.000 y $50.000, unión de cuentas, recordatorios con plantillas. Piloto con contratistas de HRNO. | — |
| **2 — Wompi y operación** | Wompi (sandbox → producción), panel de pagos y métricas, más entidades y formatos. | Cuenta Wompi |
| **3 — Escala** | Portal web de solo lectura, Drive/correo, entidades sin plantilla. | — |

## 10. Preguntas abiertas

1. ~~Configuración de $10.000~~ **Resuelta (2026-10-10):** se cobra después de mostrar el resumen y antes de activar el contrato; cubre prórrogas y adiciones del mismo contrato. Un contrato nuevo paga de nuevo.
2. ~~Códigos en efectivo~~ **Resuelta:** atado al contratista, válido para un solo servicio (una cuenta de $50.000 o una configuración de $10.000), vence a los 30 días.
3. ~~Base de contratos~~ **Resuelta:** es información pública de SECOP II; se carga en el panel mes a mes.
4. ~~Informe anterior en PDF~~ **Resuelta:** basta con copiar estilo y redacción.
5. ~~Atención humana~~ **Resuelta:** atiende el dueño, 8–12 y 2–6.
6. **Política de datos 1.1:** borrador en [`legal/politica_tratamiento_v1_1.md`](./legal/politica_tratamiento_v1_1.md), pendiente de revisión del abogado.
7. **Atención humana:** ¿el horario es de lunes a viernes, o también sábados? (Supuesto: lunes a viernes, sin festivos.)
