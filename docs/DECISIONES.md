# Decisiones de arquitectura (ADR) — CuentasBot

> Todas en estado **Propuesta** hasta que el dueño apruebe el plan.

## ADR-001 — Colas en Postgres con pgmq
- **Contexto:** webhooks de Meta deben responder rápido; el trabajo pesado (IA, LibreOffice) es lento y debe reintentarse.
- **Decisión:** colas `inbound`, `jobs`, `outbound` en pgmq (Supabase). Reintento por *visibility timeout*, máximo 5 intentos, luego `job_failures` (DLQ visible en el panel).
- **Alternativas:** Redis/BullMQ (otra pieza que operar), SQS (otro proveedor).
- **Consecuencias:** una sola base de datos; transaccionalidad entre "guardar mensaje" y "encolar". A 10× (5.000 cuentas) sigue holgado.

## ADR-002 — Worker y panel en Railway
- **Decisión:** worker (Docker con LibreOffice) y panel Next.js en Railway, región US East, misma región que Supabase `us-east-1`.
- **Alternativas:** Fly.io (más operación), Render (instancias fijas más caras con 2 GB RAM), Vercel para el panel (Hobby no permite uso comercial; Pro suma US$20/mes).
- **Consecuencias:** un proveedor, red privada, despliegue desde GitHub.

## ADR-003 — Motor de plantillas docx-templates
- **Decisión:** `docx-templates` (MIT): bucles, condicionales, imágenes, etiquetas en encabezados. Los DOCX los sube solo el superadmin; el código JS en plantillas se desactiva/limita y se valida contra el catálogo de etiquetas.
- **Alternativas:** docxtemplater (imágenes = módulo de pago), Carbone (servidor adicional), generar DOCX por código (cada entidad requeriría programar).
- **Riesgo a verificar en Fase 0:** imágenes en tabla de 2 columnas y etiquetas en encabezado repetido.

## ADR-004 — Conversión DOCX→PDF con LibreOffice headless
- **Decisión:** `soffice --headless --convert-to pdf`, un proceso por réplica con cola interna y timeout; fuentes métricamente compatibles instaladas en la imagen.
- **Consecuencias:** fidelidad visual depende de fuentes; golden tests por texto + revisión visual.

## ADR-005 — Cifrado de columnas en la aplicación
- **Decisión:** AES-256-GCM en el worker/panel con `ENCRYPTION_KEY` (versionada en el texto cifrado); índice ciego HMAC para búsquedas exactas por documento; valores enmascarados (últimos 4) en columnas separadas.
- **Alternativas:** pgsodium (marcado en desuso por Supabase), Vault (pensado para secretos, no para datos de filas).
- **Consecuencias:** la base de datos nunca ve texto plano de datos sensibles; rotación de clave por re-cifrado en lote.

## ADR-006 — Transcripción con OpenAI gpt-4o-transcribe tras adaptador
- **Decisión:** `STT_PROVIDER=openai` modelo `gpt-4o-transcribe` con pista de vocabulario; adaptador para `gpt-4o-mini-transcribe` y Deepgram Nova-3.
- **Consecuencias:** evaluación con ~30 audios reales en Fase 1 decide el modelo definitivo.

## ADR-007 — Máquina de estados de conversación hecha a mano
- **Decisión:** reductores tipados por flujo (`flow`, `step`, `context`) en `packages/conversation`, independientes del canal; la IA solo interpreta texto libre, clasifica, extrae y redacta.
- **Alternativas:** XState (más abstracción de la necesaria), agente LLM libre (no determinístico, difícil de probar).
- **Consecuencias:** conversaciones grabadas como tests; simulador y WhatsApp comparten código.

## ADR-008 — Montos en pesos enteros (bigint)
- **Decisión:** todos los valores en COP como `bigint`; prorrateo con redondeo explícito y ajuste en el último pago (convención configurable por entidad).

## ADR-009 — Monorepo pnpm + Turborepo, Biome, Vitest
- **Decisión:** `apps/{worker,panel,simulator}`, `packages/{shared,docgen,conversation}`, `supabase/`. Biome para lint/formato (una herramienta, rápida), Vitest para tests, pgTAP para RLS.

## ADR-010 — Variables definidas por la entidad en las plantillas
- **Contexto:** cada institución tiene formatos con datos propios (código y versión del formato, lugar de reunión, radicado…). El dueño pidió poder cargarlos desde el panel.
- **Decisión:** tabla `entity_variables` (tipo, alcance `entity|contract|period|user`, origen `admin|ask_contractor|computed`) y valores en `entity_variable_values`. En el DOCX se usan como `{{ var_<key> }}`. Las variables calculadas usan un evaluador de expresiones seguro (sin `eval`).
- **Actualización (Fase 0):** la sintaxis es `{{ var_<clave> }}` y no `{{ var.<clave> }}`, porque `var` es palabra reservada en las expresiones del motor.
- **Consecuencias:** incorporar una entidad nueva no requiere código; el validador bloquea la activación de una plantilla con etiquetas desconocidas.

## ADR-011 — Modo de corte elegido por el contratista
- **Decisión:** `contracts.period_mode` ∈ {`month_end`, `date_to_date`}, editable en cualquier momento. Al cambiarlo se recalculan solo los periodos no entregados, con confirmación y registro en `events`.
- **Consecuencias:** `buildPeriods` es una función pura y determinística; los periodos entregados son inmutables.

## ADR-012 — El clausulado define el calendario y el valor de los pagos
- **Contexto:** los clausulados de HRNO traen una tabla explícita de pagos con conceptos (honorarios, auxilio de transporte) y primer pago parcial calculado con mes comercial de 30 días; los certificados de cumplimiento pueden fijar un % de ejecución menor a 100 %.
- **Decisión:** `payment_schedule` (+ conceptos) extraído del clausulado y confirmado por el contratista es la fuente del valor de cada cuenta. Prioridad del valor del periodo: certificado de cumplimiento > calendario del clausulado > valor informado por el contratista > cálculo (30 días comerciales). `periods.amount_source` registra el origen.
- **Consecuencias:** el prorrateo calculado es solo respaldo; el IBC se calcula sobre los conceptos marcados `counts_for_ibc`.

## ADR-013 — Obligaciones con componentes, pesos y metas mensuales
- **Decisión:** `obligation_groups` (peso %) y `obligation_goals` (metas por mes) opcionales por contrato; el avance se registra en `goal_progress` y alimenta el informe y una alerta si va por debajo del umbral de la entidad (70 % en HRNO-EBS).

## ADR-014 — Plantillas HRNO escritas en código y modo "sobre el DOCX original"
- **Contexto:** los borradores de plantilla de HRNO tenían texto fijo, una tabla de Excel incrustada y etiquetas partidas entre fragmentos de texto.
- **Decisión:** los formatos se describen en TypeScript con un constructor OOXML mínimo (`packages/docgen/src/templates/hrno.ts`). Sin archivo base generan un DOCX autónomo (usado en CI); con el DOCX original de la entidad conservan estilos, encabezado, pie y logos y solo reemplazan el cuerpo.
- **Consecuencias:** las pruebas golden no dependen de archivos reales; los documentos de la entidad nunca entran al repositorio. Las entidades nuevas suben su DOCX con etiquetas desde el panel (no requieren código).

## ADR-015 — Puertos y adaptadores para la conversación
- **Decisión:** el orquestador solo conoce interfaces (`Store`, `AI`, `STT`, `Clock`, `Generator`). En Fase 0: store en memoria, IA y STT simuladas y deterministas. En Fase 1: store sobre Supabase, Claude y el proveedor STT reales, sin cambiar los flujos.
- **Consecuencias:** las conversaciones grabadas son pruebas rápidas y sin costo; el simulador y WhatsApp comparten exactamente el mismo código.

## ADR-016 — Pruebas de base de datos sin Docker
- **Decisión:** `supabase/tests/run.sh` levanta un Postgres temporal, aplica *stubs* de `auth` y roles de Supabase, las migraciones y el seed (dos veces, para probar idempotencia) y ejecuta pruebas SQL de RLS. pgmq, pg_cron y Storage se omiten si no existen.
- **Consecuencias:** CI no necesita Docker ni la CLI de Supabase. La verificación contra un Supabase real (con `supabase start` o el proyecto) queda para el inicio de la Fase 1.

## ADR-017 — Panel con Next.js compilado con webpack
- **Decisión:** el panel compila con `next build --webpack` y `resolve.extensionAlias` para consumir los paquetes del monorepo escritos con importaciones NodeNext (`./x.js` → `./x.ts`). sharp, docx-templates, jszip y pdf-lib quedan como paquetes externos del servidor.
- **Consecuencias:** sin paso de compilación para los paquetes compartidos. Revisar cuando Turbopack soporte alias de extensión.

## ADR-018 — Documentos que la entidad expide después de la firma
- **Contexto:** el certificado de cumplimiento y el Documento Soporte DIAN los expide la entidad después de que el supervisor firma el informe.
- **Decisión:** `support_types.stage = 'after_signature'`: aparecen en el checklist como pendientes "después de la firma", no bloquean la generación de los informes. Para el ZIP final, el contratista los envía y pide *reenviar documentos* (Fase 1).

## ADR-019 — Nombre comercial Pascalia y landing estática en `web/`
- **Contexto:** el dueño adquirió el dominio `pascalia.lat` y pidió la página antes de construir el producto.
- **Decisión:** "Pascalia" es el nombre comercial que ve el usuario; "CuentasBot" queda como nombre interno del código. La landing es HTML + CSS estático en `web/` (sin build ni JavaScript), con lista de espera por correo (`contacto@pascalia.lat`). Hosting: GitHub Pages (repo público, gratis, HTTPS), publicado por `.github/workflows/pages.yml` en cada push a `main` que toque `web/`; DNS en Porkbun.
- **Alternativas:** página dentro del panel Next.js (aún no existe y mezclaría el sitio público con el admin).
- **Consecuencias:** no se publica la política de datos hasta que la revise un abogado; precio y entidad piloto no se nombran en la página. Cuando haya número de WhatsApp verificado, el botón principal pasa a un enlace `wa.me`.

## ADR-020 — Configuración del contrato por documentos (2026-10-10)
- **Decisión:** el contratista configura cada contrato por WhatsApp enviando el contrato de SECOP y el clausulado; Claude extrae los datos y las obligaciones literales en JSON validado con Zod y el contratista confirma. La fecha de inicio se toma de la base de contratos de la entidad (`FECHA ACTAINICIO`) y, si no está, se pregunta.
- **Consecuencias:** el panel ya no es el camino principal para dar de alta contratos; sigue sirviendo para corregir y para la atención humana.

## ADR-021 — Estilo por contrato a partir del informe anterior
- **Decisión:** contrato nuevo → plantilla de la entidad. Contrato con informes previos → se pide el informe anterior y se extrae su estilo (`contracts.style`) y la redacción por obligación; la plantilla de la entidad aplica ese estilo.
- **Alternativas:** convertir cada DOCX del contratista en plantilla propia (más fiel, pero exige revisión humana por contrato). Se reserva para la atención humana.

## ADR-022 — Soportes por cuenta con vigencia de 30 días
- **Decisión:** antecedentes (4, en cualquier orden) y afiliaciones (3) se piden en cada cuenta; vencen a los 30 días. Certificaciones: indicador `requires_certification` por contrato y 0..N archivos por cuenta, incluidos en el ZIP.

## ADR-023 — Unión de cuentas
- **Decisión:** una cuenta (`accounts`) agrupa uno o más periodos consecutivos (`account_periods`). Cada periodo exige su planilla y genera su propia tabla de seguridad social en ambos informes; antecedentes y afiliaciones una vez; valor = suma; se cobra un informe.
- **Consecuencias:** el contexto de plantilla pasa de `period` a `account` con `periods[]`; los formatos HRNO se ajustan para repetir la tabla de seguridad social.

## ADR-024 — Cobro por configuración y por informe
- **Decisión:** $15.000 por configurar un contrato (subido de $10.000 el 2026-10-10) y $50.000 por informe (por contrato y por cuenta), cobrados antes de activar el contrato y antes de entregar archivos. Precios en `system_settings`. Reemplaza el modelo de suscripción de la Fase 3. La configuración se cobra después de mostrar el resumen y cubre prórrogas y adiciones del mismo contrato (respuesta del dueño, 2026-10-10).

## ADR-025 — Códigos de pago en efectivo
- **Decisión:** el panel genera códigos de un solo uso con valor, tipo de servicio, nombre y documento de quien paga; el contratista lo escribe en el chat y el sistema lo valida contra lo pendiente. Se registran en `payments` (método `cash_code`) con el usuario del panel que lo generó. Cada código queda atado al contratista (documento), sirve para un solo servicio y vence a los 30 días.

## ADR-026 — Campos del supervisor siempre en blanco
- **Decisión:** fecha del informe de supervisión, día y mes de la constancia, columna de aprobación y firma del supervisor nunca se llenan. Solo se inserta la firma del contratista, si la dio.

## ADR-027 — IBC advierte y antecedentes con hallazgo bloquean
- **Decisión:** IBC inferior al 40 % advierte; si el contratista acepta, se registra en `events`. Un certificado de antecedentes con hallazgo bloquea la cuenta y se avisa.

## ADR-028 — Gestión personalizada sin costo
- **Decisión:** estado de conversación `human_attention`: el bot deja de responder solo, el caso aparece en la bandeja del panel con su contexto y un operador lo resuelve y lo devuelve. Se activa por fallas de extracción o de control de calidad, por pedido del contratista o por casos no cubiertos.

## ADR-029 — Base de contratos cargada mes a mes desde SECOP II
- **Decisión:** el panel recibe el Excel público de contratos de cada entidad y hace *upsert* por `(entidad, código, documento)`; nunca borra filas previas. Se usa para precargar fecha del acta de inicio, plazo y valor en la configuración.
- **Consecuencias:** tabla `entity_contract_registry` (solo staff y `service_role`) y `registry_imports` para auditar cada carga.

## ADR-030 — Modelos de Claude por tarea (2026-10-10)
- **Decisión:** `AI_MODEL_FAST=claude-haiku-5-5` para clasificar notas/fotos e interpretar mensajes; `AI_MODEL_SMART=claude-sonnet-5-5` para leer soportes, redactar, aplicar correcciones y control de calidad; `AI_MODEL_SETUP=claude-opus-5-5` para la configuración del contrato (contrato SECOP, clausulado, informe anterior), que ocurre una vez por contrato y es crítica.
- **Consecuencias:** costo de IA por configuración ≈ US$0,28; el resto del modelo financiero no cambia. En el piloto se mide la precisión por tarea y se sube o baja de modelo por variable de entorno, sin cambiar código.

## ADR-031 — Supabase en Canadá (ca-central-1)
- **Contexto:** el proyecto de producción de Supabase se creó en `ca-central-1` (Montreal); la región no se puede cambiar después.
- **Decisión:** se mantiene en Canadá (decisión del dueño, 2026-10-10). Railway sigue en US East (no tiene región en Canadá); Meta, Anthropic y OpenAI en EE. UU.
- **Consecuencias:** la política de datos 1.1 declara Canadá y EE. UU.; hasta que el abogado la apruebe y se publique, la base de datos solo recibe datos de prueba y del propio responsable. Reemplaza la mención a `us-east-1` de ADR-002.

## ADR-032 — Instituciones nuevas y Programa de Aliados (2026-10-11)
- **Contexto:** el dueño quiere crecer por recomendación dentro de cada institución. Análisis de rentabilidad (2026-10-11): con ~$29.000 de utilidad por cuenta, el recorrido completo hasta Premium (≥ 550 cuentas pagadas de referidos en ≥ 10 meses, ~$16 millones de utilidad) cuesta $1.050.000 en premios (11 cuentas gratis + $500.000), el 6,6 % de esa utilidad.
- **Decisión:** después de aceptar la política, el contratista elige su institución (entidades activas u «Otra»). «Otra» deja una solicitud con un modelo de cuenta de cobro y el contrato; la primera persona de cada institución recibe su primera cuenta gratis y queda como **Aliado** con un código `ALI-XXXX`. Solo cuentan los **referidos** que se registran con ese código (en el primer mensaje, por el enlace de wa.me, o escribiéndolo en los primeros 30 días). Cada mes calendario el Aliado sube como máximo un nivel si sus referidos pagan 10 × (nivel + 1) cuentas ese mes, contando una por persona y excluyendo su propia cédula; cada nivel da una cuenta gratis y el nivel 10 lo hace **Aliado Premium** con $500.000 por transferencia como bonificación por referidos (con cuenta de cobro del Aliado; confirmar el tratamiento tributario con el contador). HRNO no tiene Aliado. Solo cuentan los periodos con `charge = 'paid'` (el piloto y las cuentas gratis no).
- **Consecuencias:** tablas `institution_requests`, `allies`, `ally_levels`; tabla `free_report_grants` (una fila por cuenta gratis, **vence a los 12 meses**, decisión del dueño 2026-10-11), columnas `users.referred_by_ally`, `periods.charge`; función `evaluate_allies(mes)` que el worker corre cada hora sobre el mes anterior (idempotente). Los avisos de nivel se entregan en el siguiente mensaje del Aliado (sin plantilla). Falta: usar las cuentas gratis vigentes al cobrar (Fase 1b). La sección del programa quedó en los términos 1.1 (sección 17), revisada por el abogado y publicada el 2026-10-11.

## ADR-033 — Valor de cada cuenta: pagos iguales y decisión del contratista (2026-10-11)
- **Contexto:** un contrato de HRNO de 3 pagos por $12.000.000 que inicia el 6 de julio se prorrateaba (julio = $3.333.333) y las cuentas sumaban $11.333.333. HRNO paga cuotas iguales.
- **Decisión:** el valor de cada cuenta sale, en este orden, de: (1) el cronograma del clausulado si cubre todas las cuentas; (2) **pagos iguales** (total ÷ número de pagos, la diferencia de redondeo en la última) cuando el número de cuentas coincide con el número de pagos; (3) prorrateo por días con mes comercial de 30 días. La fecha final sale del contrato cargado al configurar. Si las cuentas no suman el valor del contrato, antes de generar Pascal muestra el valor y el contratista lo confirma o escribe otro. Si llega un certificado de cumplimiento con un valor distinto, Pascal lo sugiere y el contratista decide (cobrar ese, dejar el que había u otro).
- **Consecuencias:** `planPeriodAmounts` en `@cuentasbot/shared`; el valor confirmado queda con `amount_source = 'contractor'` o `'certificate'`. Al cambiar el corte, solo el saldo pendiente se reparte entre las cuentas nuevas.

## ADR-034 — Cobro de configuración e informes (2026-10-11, en modo de prueba)
- **Decisión:** `system_settings.billing.mode` decide si se cobra: `pilot` (por defecto, no se cobra y cada informe entregado queda `periods.charge = 'pilot'`) o `live`. En `live`, antes de entregar un informe Pascal: (1) usa una cuenta gratis vigente del Aliado si la configuración ya está pagada; si no, (2) pide el pago con un enlace firmado de Wompi o (3) un código en efectivo atado al contratista y al valor, de un solo uso y con vencimiento a 30 días. La configuración ($15.000) se cobra al terminar de configurar el contrato, como dicen los términos (sección 5): el contrato no se activa (no recibe notas ni genera informes) hasta que se pague; soporte, ayuda y agregar otro contrato siguen disponibles. Los contratos configurados durante el piloto no pagan configuración. Cuando Wompi confirma el pago, el worker verifica el evento con el secreto de eventos, marca el cobro y entrega el informe sin que el contratista escriba nada.
- **Consecuencias:** tablas `charges` (referencia única para Wompi) y `cash_codes`; `free_report_grants.used_charge_id`; Edge Function `wompi-webhook` (solo guarda y encola); variables `WOMPI_PUBLIC_KEY`, `WOMPI_INTEGRITY_SECRET`, `WOMPI_EVENTS_SECRET` en Railway; página `/cobros` del panel (modo, precios, códigos y cobros).

## ADR-035 — Certificados: guía uno por uno, sin resolver captchas (2026-10-12)
- **Contexto:** el dueño pidió descargar automáticamente antecedentes y afiliaciones con un servicio que resuelve captchas. Los portales de Policía, Procuraduría, Contraloría y SISPRO usan el captcha precisamente para impedir consultas automáticas; saltarlo va contra sus condiciones de uso y expone a PascalIA a riesgo legal y a bloqueos. Los proveedores con API (Verifik, TusDatos) no sirvieron.
- **Decisión:** no se automatiza la descarga. Con *certificados* (o el botón *Guíame* del checklist y del aviso de faltantes) Pascal pide un soporte faltante o vencido a la vez: enlace oficial, pasos cortos y el número de documento en un mensaje aparte para copiarlo. Cuando llega el PDF lo clasifica como siempre y pasa al siguiente; se puede saltar o terminar. Un certificado vigente se reutiliza en las cuentas siguientes y el checklist dice hasta cuándo sirve.
- **RNMC (2026-10-12):** su consulta no tiene captcha, pero el dueño decidió mantenerla también en la guía, sin consultas automáticas.
- **Consecuencias:** flujo `support_guide` en el orquestador; las instrucciones de cada certificado (`support_types.instructions`) son los pasos que ve el contratista y se editan en el panel.

## ADR-036 — Recordatorio de soportes antes del corte (2026-10-12, apagado)
- **Decisión:** el worker revisa cada 15 minutos los periodos abiertos de contratos activos que cierran en `daysBeforeEnd` días (3 por defecto) y, desde las 8:00 de Bogotá, le escribe una sola vez por periodo a cada contratista al que le falten soportes o los tenga vencidos, con el botón *Guíame* (ADR-035). Si el contratista escribió en las últimas 24 horas va como mensaje normal; si no, con la plantilla `faltan_soportes`, ya aprobada por Meta, que nombra el mes de la cuenta y trae el botón *¿Qué me falta?* (abre el checklist, que ofrece la guía). *STOP* apaga los recordatorios (ahora sí queda guardado) y *activar recordatorios* los vuelve a encender.
- **Consecuencias:** no hay cambio de esquema: cada envío queda en `outbound_messages` con la clave `reminder:supports:<contrato>:<informe>`, que impide repetirlo. Se controla con `system_settings.reminders` (`enabled`, `daysBeforeEnd`, `hour`, `template`, `language`); sin esa fila está **apagado**. Para encenderlo hace falta que Meta apruebe la plantilla y que el dueño acepte el costo de los mensajes.

## ADR-037 — Texto libre interpretado por IA (2026-10-12)
- **Contexto:** solo los mensajes de hasta 5 palabras pasaban por la IA; uno más largo como «ahora vamos a iniciar la realización del informe de septiembre» se guardaba como actividad.
- **Decisión:** todo texto libre que no coincide con un comando pasa por el modelo más económico (`AI_MODEL_FAST`, Claude Haiku 5.5, esfuerzo bajo). El modelo decide si es una actividad o una petición (abrir, redactar, generar, rehacer o reiniciar el informe de un mes; qué me falta; guía de certificados; contratos; datos; firma; borrar la última nota; soporte; ayuda; menú). Si duda, responde «unclear» con su mejor hipótesis y una pregunta corta; Pascal pregunta con botones (la hipótesis, *Anotar actividad*, *Ver menú*) y no guarda nada hasta la respuesta. Si la IA falla, el mensaje se guarda como actividad, como antes.
- **Consecuencias:** una llamada de ~1.000 tokens por mensaje libre (≈ US$0,0001); los comandos exactos y las frases conocidas siguen resolviéndose sin IA.

## ADR-038 — Sin fecha, Pascal pregunta el informe cuando hay uno anterior abierto (2026-10-12)
- **Contexto:** con el informe de septiembre aún abierto en octubre, una foto asignada por número de obligación quedó con la fecha de hoy y salió del informe (Danilo, 2026-10-11).
- **Decisión:** nunca se supone «hoy» si hay un informe anterior en trabajo: uno sin entregar que el contratista abrió («vamos con septiembre») o que cerró en los últimos 62 días y ya tiene actividades. Una actividad sin fecha o una foto asignada por número de obligación generan la pregunta «¿A qué informe corresponde?» con botones (el informe anterior, hoy, otra fecha); el contratista también puede escribir la fecha. Sin informe anterior en trabajo, sigue siendo hoy. Cada confirmación dice a qué informe quedó.
- **Consecuencias:** el informe abierto se recuerda en la conversación (`context.working`) aunque cambie el flujo; un informe anterior hecho por fuera de Pascal (sin actividades) no dispara la pregunta.

## ADR-039 — Revisión de actividades mal ubicadas (2026-10-12)
- **Decisión:** cuatro capas, además de la pregunta de ADR-038.
  1. **Antes de redactar** un informe, Pascal revisa sus notas y pregunta una a una por las que mencionan un mes fuera del periodo (mover al informe de ese mes, dejarla o borrarla), las fotos sin descripción (describirla, dejarla o borrarla) y las instrucciones guardadas como actividad (borrarla o dejarla). Las respuestas se recuerdan (`context.checkedNotes`) para no repetir la pregunta. Si una nota sale de una obligación ya aprobada, esa obligación se redacta de nuevo.
  2. **Corregir al momento:** cada confirmación trae *✏️ Corregir* (la obligación, el informe o fecha, o borrarla), y «pasa la última actividad a septiembre» mueve la última nota (intención `move_note`).
  3. **Fechas relativas:** la misma llamada a Haiku que clasifica el mensaje devuelve el día de la actividad («la semana pasada», «el lunes pasado») cuando la lectura propia de Pascal no lo encuentra.
  4. **Control continuo:** se guarda la fecha de la primera entrega de cada informe (`periods.delivered_at`; las anteriores se completaron con la fecha del primer documento generado o, sin él, con la última actualización) y el inicio del panel lista las actividades por revisar de todos los contratistas (fuera de periodo, registradas después de entregar el informe, o sospechosas por las reglas de la capa 1).

## ADR-040 — «Otra institución»: documentos que pide y modelos (2026-10-12)
- **Decisión:** después del nombre de la institución, Pascal muestra una lista numerada de documentos que suelen pedir para una cuenta de cobro (informe de actividades, informe de supervisión y cuenta de cobro, que prepara Pascal; planilla, antecedentes, afiliaciones, certificado de cumplimiento, RUT, certificación bancaria, cédula) y el contratista escribe los números, con «otro: …» para lo que no esté. Debe elegir al menos uno de los tres que prepara Pascal. De cada uno de esos que elija, se le pide un **modelo** (obligatorio, PDF o Word), uno por uno; el resto solo queda registrado para saber qué pedirle al generar la cuenta. Al final envía su contrato, como antes.
- **Consecuencias:** columna `institution_requests.documents` (jsonb: `required` y `models`); `model_support_id` guarda el primer modelo por compatibilidad. La página Solicitudes del panel muestra la lista y un enlace por modelo; con eso el equipo configura la entidad, su lista de chequeo y sus formatos. Al crear la entidad desde la solicitud, su lista de chequeo se precarga con esos documentos y sus ajustes habituales (vigencia de 30 días y paquete para antecedentes y afiliaciones, certificado de cumplimiento cada mes con los soportes de la cuenta en curso, RUT, cédula y certificación bancaria solo al inicio); lo que el contratista escribió entra como soporte de cada periodo. Los tres documentos que prepara Pascal no entran a la lista: son los formatos de la entidad.

## ADR-041 — Qué es el certificado de cumplimiento (2026-10-12)
- **Decisión:** el certificado de cumplimiento (`CERT_CUMPLIMIENTO`) es el que expide una dependencia o coordinación de la entidad y dice cuánto se le paga al contratista; Pascal lo usa para sugerir el valor de la cuenta (ADR-033). No es la aprobación del supervisor, que nunca se pide. Se envía con los soportes de la cuenta en curso, cada periodo, y solo en los contratos que lo requieren: la respuesta «¿Tu cuenta necesita certificado de cumplimiento?» de la configuración (`contracts.requires_certification`) decide si aparece en el checklist.
- **Consecuencias:** textos de la configuración, de la lista de «Otra institución», de la lista de chequeo y de la lectura con IA corregidos; el seed del HRNO lo deja como soporte previo a generar.

## ADR-042 — Gestor: varias personas desde un WhatsApp (2026-10-13)
- **Decisión:** un número puede preparar las cuentas de otras personas. Con *agregar persona* (o el menú «Cuentas de otra persona») da el WhatsApp y el nombre de la persona; Pascal le escribe con la plantilla `autorizar_gestor` y ella responde *Autorizo* o *No autorizo* desde su número. Aceptar registra su consentimiento a la política de datos y a los términos (Ley 1581). Si la plantilla no está aprobada o falla, se le pide al gestor que la persona escriba a Pascal; al escribir, Pascal le hace la misma pregunta antes de cualquier otra cosa. Con *cambiar persona* el gestor elige cuyas cuentas trabaja; mientras trabaja las de otra persona cada respuesta empieza con «👤 *Nombre*». La persona también puede usar Pascal desde su número sobre las mismas cuentas. Los documentos y los avisos de pago van a quien pidió la cuenta (el cobro guarda `requested_by`); los recordatorios van a los gestores y a la persona si ella usa Pascal. Mismo precio por persona.
- **Consecuencias:** tabla `delegations` (pendiente, activa, rechazada, revocada); el contexto de la conversación guarda la persona activa (`actingFor`), que se valida en cada mensaje. Con *revocar autorización* la persona le quita el acceso a un gestor, o el gestor deja de manejar las cuentas de una persona; se confirma con un botón, la autorización queda `revoked` y a la otra parte se le avisa. Si el gestor estaba trabajando esas cuentas, su siguiente mensaje vuelve a las suyas. El gestor nunca puede cargar la firma de otra persona (solo ella, desde su número), y las preguntas por datos personales nombran a la persona («la cédula de Ana») para que el gestor no responda con los suyos. Pendiente: revisión del abogado del texto de autorización y de los términos (tratamiento por un tercero autorizado).

## ADR-043 — Mensajes de Pascal fuera de la ventana de 24 horas (2026-10-15)
- **Contexto:** los documentos después de un pago en línea, los avisos al gestor y las novedades de pago se enviaban como mensaje libre; si la persona llevaba más de 24 horas sin escribir, WhatsApp los rechazaba (error 131047) y solo quedaba el error en el log.
- **Decisión:** esos mensajes pasan por `deliver`: si WhatsApp responde 131047, el mensaje y los siguientes se guardan en `outbound_messages` (`status = 'queued'`, clave `held:<uuid>`; los documentos van a Storage, `outputs/held/…`) y se envía la plantilla `aviso_pendiente` con el botón *Ver ahora*. Cualquier mensaje de la persona, o ese botón, entrega primero lo pendiente, en orden.
- **Consecuencias:** sin cambio de esquema. Mientras Meta no apruebe la plantilla, lo pendiente se entrega cuando la persona escriba. Cada aviso es una plantilla de utilidad y Meta la cobra.

## ADR-044 — Reintentos sin repetir acciones (2026-10-15)
- **Decisión:** los ids de lo que guarda un turno (actividades, fotos, soportes) se derivan del id del mensaje de WhatsApp, y esas escrituras son idempotentes; si un turno falla a mitad y el mensaje se reintenta, se sobrescriben en lugar de duplicarse. El mensaje se marca procesado apenas el turno termina, antes de enviar las respuestas. El worker corre `node` directamente (recibe SIGTERM) y Railway le da 120 s para terminar (`RAILWAY_DEPLOYMENT_DRAINING_SECONDS`).
- **Consecuencias:** si el worker se detiene justo mientras envía respuestas, alguna puede perderse, pero el turno no se repite.


## ADR-045 — Resumen diario de fallas por WhatsApp (2026-10-15)
- **Decisión:** los errores del worker quedan en `job_failures` (los mensajes no procesados y, como `warning`, las respuestas o avisos no enviados, los audios sin transcribir, los recordatorios fallidos y los pagos con valor distinto). El inicio del panel los lista (últimos 7 días) y, una vez al día desde las 7 a. m., si hubo fallas en las últimas 24 horas, Pascal le envía el resumen por WhatsApp al usuario configurado en `system_settings.alerts` (`enabled`, `userId`, `hour`). Fuera de la ventana de 24 horas va con la plantilla `aviso_pendiente` (ADR-043).
- **Consecuencias:** sin la fila `alerts`, o con `enabled: false`, no se envía nada. Solo escribe cuando hubo fallas.

## ADR-046 — El informe anterior enseña la forma de redactar (2026-10-15)
- **Contexto:** la configuración pedía «tu último informe… así copio tu forma de redactar», pero el informe solo se guardaba.
- **Decisión:** cuando el contratista envía un informe que ya hizo (en la configuración, al elegir «Informe de actividades (uno que ya hiciste)» o con el comando *informe anterior*), el modelo intermedio lo lee una vez (los Word se pasan a PDF) y devuelve qué documento es, una guía de su estilo (persona, tiempo verbal, extensión, estructura) y hasta 3 párrafos de ejemplo. Pascal muestra qué leyó con *Sí, es ese* / *No es ese*; si no parece un informe de actividades no lo usa salvo que el contratista toque *Sí es mi informe*. *No es ese* o *Quitarlo* lo retiran y marcan el archivo como `DESCARTADO`. Al redactar, la guía y los ejemplos van en el prompt solo como estilo: los hechos salen únicamente de las notas del periodo.
- **Consecuencias:** sin cambio de esquema: el estilo se guarda como `supports/<usuario>/estilo-redaccion.json`. Una lectura por documento (≈ US$0,02). Los informes enviados antes de este cambio no se leyeron; el contratista puede enviarlos de nuevo con *informe anterior*.

## ADR-047 — Ninguna conversación sin salida (2026-10-15)
- **Contexto:** varios flujos repetían la misma pregunta mientras el contratista no diera la respuesta exacta (la configuración, «Otra obligación», el tipo de documento, la firma, el municipio de la cédula), y un mensaje con dos botones iguales hacía fallar el envío.
- **Decisión:**
  1. **Regla general:** «menú», «cancelar» y los botones del menú salen de cualquier estado. Si Pascal está por repetir palabra por palabra su último mensaje con la misma pregunta abierta, agrega *Salir y ver menú* y *Hablar con soporte*. La configuración tiene su propia salida desde la segunda pregunta repetida.
  2. **Escribir otra cosa en lugar de elegir** se atiende como un mensaje normal: al elegir contrato (si son 3 o más palabras), al elegir el tipo de documento (el archivo queda guardado sin clasificar), cuando se espera la foto de la firma, y en «generar sin planilla», que antes ignoraba el mensaje sin responder.
  3. **Cada pregunta que se puede repetir trae cómo terminarla:** *✅ Listo* junto a *➕ Otra obligación*, y *🗑️ No era actividad* en la lista de obligaciones. «No», «listo», «gracias» solo cierran la pregunta.
  4. **El municipio de expedición de la cédula** se pregunta como máximo una vez al día.
  5. **Los términos** ofrecen *Hablar con soporte*; *soporte* y *borrar mis datos* (que ahora existe y abre una solicitud para el equipo) funcionan sin aceptarlos.
  6. **La autorización de un gestor** se puede responder escribiendo («sí, autorizo», «no»).
  7. **Botones repetidos:** se eliminan al armar el mensaje y otra vez antes de enviarlo a WhatsApp.

## ADR-048 — Borrado de la firma y conservación de archivos (2026-10-17)
- **Contexto:** la política de datos (versión 1.1) promete *borrar mi firma* (sección 4-A) y el borrado automático de los archivos a los 24 meses (sección 7); ninguno estaba implementado.
- **Decisión:**
  - **Borrar mi firma:** *borrar mi firma* (también «eliminar» o «quitar») pide confirmación y borra el archivo y su registro. Solo lo puede hacer el titular desde su número, no un gestor.
  - **Borrado automático:** una vez al día, el worker borra los soportes y las fotos de evidencia con más de 24 meses. Antes suelta las referencias desde las planillas y las solicitudes de institución. La firma no se borra por tiempo, sino cuando el titular lo pide.
  - **Copias de entrega:** los ZIP (con enlace de 7 días) y las copias de mensajes retenidos se borran a los 30 días. Si un mensaje retenido pierde su archivo, se marca `dropped`.
  - **Solicitudes de gestor sin autorizar:** las rechazadas, y las pendientes con más de 30 días, se borran con el nombre y el número que dio el gestor (política 1.2, sección 4-D).
- **Consecuencias:** sin cambio de esquema. Los consentimientos y los cobros no son archivos y se conservan por el término legal. Los borradores 1.2 de los términos y de la política quedaron en `docs/legal/*_v1.2_borrador.md`, pendientes de revisión del abogado.

## ADR-049 — PascalBot: chat informativo en la página web (2026-10-18)
- **Contexto:** quienes visitan pascalia.lat preguntan qué hace CuentaFacil, cuánto cuesta y cómo empezar antes de escribirle a Pascal.
- **Decisión:** un chat redondo, *PascalBot*, en la esquina de la página de inicio y de `/cuentafacil/`. Solo informa sobre el alcance del servicio: no identifica a nadie, no ve cuentas ni pagos y no recibe datos personales; para lo de cada cuenta envía a Pascal por WhatsApp.
  - **Respuestas:** ruta `POST /api/pascalbot` del panel. Llama a Claude (Haiku, `PASCALBOT_MODEL`) con una base de conocimiento tomada solo de la página de CuentaFacil, los términos 1.1 y la política 1.1 (`apps/panel/lib/pascalbot-knowledge.ts`). Si algo no está en la base, lo dice y ofrece WhatsApp o el correo.
  - **Límites:** solo acepta llamadas desde pascalia.lat (más `PASCALBOT_ORIGINS`). Cada mensaje tiene máximo 600 caracteres, se envían los últimos 10 turnos y la respuesta tiene máximo 450 tokens. Hay un tope de 20 mensajes cada 10 minutos por visitante y 1.500 al día para todo el sitio. Si falla o no hay clave, responde con el enlace de WhatsApp.
  - **Widget:** `pascalbot/` en el repositorio de la página (JS y CSS sin dependencias, avatar en `pascalbot/avatar.svg`). La conversación se guarda solo en la pestaña (`sessionStorage`).
- **Consecuencias:** sin tablas nuevas ni plantillas de Meta. El panel necesita `ANTHROPIC_API_KEY` (variable de referencia al worker). El uso se registra en los logs del panel (`pascalbot.reply`), no en `ai_usage`. Cuando cambien los términos o los precios, hay que actualizar la base de conocimiento.

## ADR-050 — Cuenta bancaria por WhatsApp (2026-10-19)
- **Contexto:** la cuenta bancaria del informe (banco, tipo y número) sale del resumen del contrato de SECOP II. Si SECOP no la trae o el contratista cambia de cuenta, no había forma de corregirla por WhatsApp. La certificación bancaria estaba en la lista de soportes, pero no se leía.
- **Decisión:**
  - **Cambiarla:** *cambiar mi cuenta bancaria* (también «cuenta bancaria», «cambié de banco», «certificación bancaria»). El contratista envía la certificación bancaria en PDF o foto, que se lee con IA (modelo rápido) y solo copia lo impreso, o escribe los datos («Ahorros Bancolombia 123…»), que se leen sin IA. Si falta el tipo, se pregunta con botones (ahorros o corriente). Nada se guarda sin confirmar con «Sí, guardarla».
  - **Advertencia de titular:** si la certificación está a nombre de otra cédula, se advierte; no se bloquea.
  - **Pedirla si falta:**
    - en la configuración, después del resumen, si SECOP no trae la cuenta: con certificación, escrita o «Después»;
    - a quienes ya tienen contratos y les falta, una vez al día después de un mensaje, igual que el lugar de expedición. Esa pregunta no la pidió el contratista, así que una foto que no es certificación sigue como evidencia.
  - **Gestor:** puede registrar la cuenta de la persona, y los textos la nombran.
  - **Antes de generar:** si falta la cuenta, Pascal avisa que saldría en blanco y ofrece «🏦 Enviar cuenta» o «Generar sin cuenta». Elegir generar sin cuenta vale para esa cuenta de cobro, y luego sigue la pregunta de la PILA si falta.
- **Consecuencias:** sin cambio de esquema. La certificación válida queda en los soportes con el código `CUENTA_BANCARIA`. *Mis datos* indica cómo cambiar la cuenta.

## ADR-051 — Informes según los aprobados por el supervisor de HRNO (2026-10-19)
- **Contexto:** se revisaron clausulados de equipos básicos (EBS), vacunación y administrativos, y los informes de actividades y de supervisión que el supervisor aprobó. Las respuestas del dueño fijan las reglas.
- **Decisión:**
  - **Ejecución presupuestal:** 100 % ÷ número de cuentas × número de la cuenta actual (1 de 5 = 20 %). Es el ajuste `budget_execution` de la entidad: `by_count` (por defecto) o `by_value`.
  - **Obligaciones generales en la supervisión:** las 4 fijas del formato (`supervision_duties`), no las del contrato.
  - **Coordinador EBS en la reunión:** solo cuando el objeto del contrato es de un Equipo Básico de Salud, con el coordinador del municipio del objeto (`ebs_coordinators`). Ábrego y El Carmen tienen uno; Convención y Teorama, otro. En los demás contratos no sale esa fila, y se quitó la fila «Otros asistentes: NO HUBO».
  - **Metas mensuales:**
    - La IA lee las tablas del clausulado al configurar (por obligación y por mes; la cuenta 1 es el mes 1) y el contratista las confirma en el resumen.
    - Antes de redactar cada cuenta, Pascal pregunta cuántas hizo de cada una («Cumplí todas», o las cantidades en orden) y pide confirmar. Avisa si alguna queda por debajo del 70 % (cláusula de cumplimiento).
    - Las cantidades van tal cual, sin pasar por la IA de redacción, en el informe de actividades (dentro de la obligación) y en el borrador de supervisión (el supervisor las corrige si no está de acuerdo).
    - En el borrador hay un botón «🎯 Cambiar metas».
  - **Pensionado:** si la planilla no tiene aporte a pensión, se pregunta una vez si es pensionado(a) y se guarda.
    - Si lo es, no se pide certificado de afiliación a pensión.
    - Si no lo es, se advierte en cada planilla sin pensión.
  - **Valor que no cuadra:** la IA lo avisa en el resumen de configuración y, al generar, Pascal pregunta qué valor cobrar (ya existía).
  - **Soportes:** la lista de la entidad más los documentos que solo pide ese contrato (cláusula de pago). La IA los compara con la lista de la entidad al configurar. Se piden, se reconocen y se empacan como los demás (código `X<contrato>-<n>`).
  - Las fotos con GPS Map Camera no se exigen. «Ahorro a la mano» (Nequi) es una cuenta de ahorros.
- **Consecuencias:** sin cambio de esquema.
  - Las metas y los documentos extra del contrato quedan en `contracts.extracted`.
  - Las cantidades de cada cuenta y la respuesta de pensionado quedan en Storage (`supports/<usuario>/metas/…` y `perfil.json`), como el estilo de redacción.
  - Los contratos configurados antes no tienen metas: se leen si se vuelve a configurar el contrato.
  - Los ajustes de HRNO están en `seed.sql`; en producción se aplican con el mismo `update`.

## ADR-052 — Términos y política de datos 1.2 (2026-10-19)
- **Contexto:** desde la 1.1 se agregaron gestores, el informe anterior como modelo, *borrar mi firma*, la conservación automática, la cuenta bancaria por WhatsApp, las metas mensuales, la pregunta de pensionado, los documentos propios de cada contrato, el formato de supervisión de la entidad (coordinador EBS) y el chat PascalBot de la página.
- **Decisión:** versión 1.2 de los dos documentos, publicada en pascalia.lat.
  - Los textos están en `docs/legal/terminos.md` y `docs/legal/politica_tratamiento.md`; los cambios y las preguntas para el abogado, en `docs/legal/CAMBIOS_v1.2.md`.
  - Quien aceptó una versión anterior recibe una sola invitación con el resumen y los dos enlaces. El mismo «Acepto» registra los términos y la política 1.2.
  - *soporte* y *borrar mis datos* siguen sin esperar la aceptación.
  - Las páginas se generan del markdown con el mismo formato.
- **Consecuencias:** filas 1.2 en `policy_versions` (también en `seed.sql`). La base de conocimiento de PascalBot se actualizó. El precio por niveles para gestores no se aprobó: el precio sigue igual por persona.

## ADR-053 — Transcripción de notas de voz con Groq (2026-10-19)
- **Contexto:** OpenAI se quedó sin créditos y no acepta las tarjetas del dueño; las notas de voz no se transcribían.
- **Decisión:** `STT_PROVIDER` elige el proveedor: `openai` (por defecto) o `groq`.
  - Groq usa Whisper (`whisper-large-v3`) con una API compatible con la de OpenAI. Se usa el mismo SDK y el mismo código, cambiando solo la dirección del servicio.
  - Solo se exige la clave del proveedor elegido (`OPENAI_API_KEY` o `GROQ_API_KEY`).
  - Si `STT_MODEL` es de otro proveedor, se usa el modelo por defecto del elegido.
  - El worker registra `stt.provider` al arrancar.
- **Consecuencias:** cambiar de proveedor es cambiar dos variables en Railway, sin desplegar código. Groq procesa el audio en EE. UU.; la política de datos (sección 4) nombra hoy a OpenAI para la transcripción, así que en la próxima versión hay que agregar a Groq como encargado.

## ADR-054 — Política de datos 1.3: Groq en la transcripción (2026-10-20)
- **Contexto:** desde ADR-053 las notas de voz las transcribe Groq, pero la política 1.2 nombraba a OpenAI como encargado.
- **Decisión:** política 1.3, con Groq, Inc. (EE. UU.) en la tabla de encargados. Se publicó en pascalia.lat. Los términos siguen en la 1.2.
  - El control de aceptación ahora revisa las dos versiones. Si solo cambió la política, Pascal lo dice así («Actualizamos la política de tratamiento de datos… ahora las notas de voz las transcribe Groq»), con el botón «Ver política». El «Acepto» registra solo lo que falta.
  - *soporte* y *borrar mis datos* siguen sin esperar.
- **Consecuencias:** fila `privacy_policy 1.3` en `policy_versions` (también en `seed.sql`). PascalBot ya nombra a Groq. Los usuarios de prueba tienen aceptadas las dos versiones vigentes.

## ADR-055 — Pago por transferencia y QR Bancolombia (2026-10-20)
- **Contexto:** algunos contratistas prefieren transferir o pagar con QR. Wompi solo cubría tarjeta, PSE, Nequi y botón Bancolombia, y los pagos en efectivo dependían de un código.
- **Decisión:** el dueño confirma las transferencias en el panel.
  - La cuenta que recibe va en `system_settings.billing.transfer` y se edita en /cobros. Sin cuenta, Pascal no ofrece transferencias.
  - Al pedir el pago, Pascal agrega el botón *Transferencia*. Con él da banco, tipo, número, titular, valor y la referencia del cobro, y pide la foto o PDF del comprobante.
  - El comprobante se guarda entre los soportes (código `COMPROBANTE_PAGO`). Su id y la hora quedan en `charges.raw.transfer`. Se abre la solicitud «Transferencia por confirmar» para que el dueño la vea en el inicio del panel.
  - En /cobros, *Transferencias por confirmar* muestra el comprobante con *Confirmar* y *Rechazar*. La función `transfer_review` (solo superadmin) deja la decisión en la cola `inbound` como un evento `transfer`.
  - El worker procesa ese evento. Al confirmar, marca el cobro pagado (`method = 'transfer'`) y entrega como con Wompi. Al rechazar, borra el comprobante del cobro y le pide al contratista revisarlo o pagar de otra forma.
  - En los dos casos cierra la solicitud.
  - El QR Bancolombia es un medio más del enlace de Wompi: se activa en el panel de Wompi, sin código. El texto del pago ahora dice «tarjeta, PSE, Nequi, QR o botón Bancolombia».
- **Consecuencias:** migración `20261020000001_transfer_payments.sql`: `transfer` en `charges.method` y en `webhook_inbox.provider`, y la función `transfer_review`. Mientras el comprobante está en verificación, pedir el informe muestra «ya recibí tu comprobante» y no un cobro nuevo. Los términos (sección 6, medios de pago) deben nombrar la transferencia.

## ADR-056 — Términos 1.3: transferencia y QR Bancolombia (2026-10-20)
- **Contexto:** con ADR-055 hay dos medios de pago nuevos que la sección 6 de los términos 1.2 no nombraba.
- **Decisión:** términos 1.3, publicados en pascalia.lat.
  - La sección 6 agrega el QR Bancolombia en el enlace de Wompi y la transferencia bancaria: referencia del cobro, comprobante por WhatsApp, confirmación de PascalIA y costos bancarios a cargo del usuario.
  - La política de datos sigue en la 1.3.
  - Si solo cambiaron los términos, Pascal lo dice así («ahora también puedes pagar por transferencia bancaria… o con QR Bancolombia»), con el botón «Ver términos». El «Acepto» registra solo los términos.
- **Consecuencias:** fila `terms 1.3` en `policy_versions` (también en `seed.sql`). PascalBot conoce los nuevos medios de pago. Queda para el abogado si el comprobante de transferencia debe nombrarse en la política de datos (`CAMBIOS_v1.2.md`).

## ADR-057 — El dueño escribe en la conversación con Pascal desde el panel (2026-10-21)
- **Contexto:** el dueño necesita escribirle a un contratista (por ejemplo, a quien configuró y no ha pagado) y que el mensaje llegue en su chat con Pascal, no desde un número personal. El panel no tenía cómo, y WhatsApp solo deja enviar texto libre en las 24 horas siguientes al último mensaje de la persona.
- **Decisión:** en la ficha del contratista (/contratistas/[id]) hay un formulario «Escribir en su conversación con Pascal».
  - La función `staff_message` (solo superadmin, de 1 a 1500 caracteres, contratista existente) deja el mensaje en la cola `inbound` como un evento `staff`, igual que `transfer_review`.
  - El worker lo entrega con `deliver` (ADR-043), firmado «👤 *Equipo CuentaFácil*». Con la ventana cerrada lo guarda y envía la plantilla `aviso_pendiente` («tengo listo un mensaje del equipo de CuentaFácil · Ver ahora»); el mensaje sale cuando la persona toca el botón o vuelve a escribir.
  - La ficha dice si la ventana está abierta (último mensaje en `wa_inbound`) y hasta qué hora.
- **Consecuencias:** migración `20261021000001_staff_messages.sql`: `staff` en `webhook_inbox.provider` y la función `staff_message`. El mensaje queda en `messages` como cualquier salida de Pascal. No reemplaza el soporte con tickets; es para avisos puntuales del dueño.

## ADR-058 — Actividades repetidas: queda una sola (2026-10-23)
- **Contexto:** un contratista envió dos veces la misma actividad (el simulacro de sismo, 22/10). Quedó contada dos veces en el estado y en el borrador.
- **Decisión:** Pascal toma como repetidas dos actividades del mismo contrato y del mismo día con el mismo texto. Se ignoran tildes, mayúsculas, signos y errores de digitación (hasta 5 % de caracteres distintos).
  - No son repetidas si cambia un número o una cantidad («25 familias» / «30 familias»), si se agrega una palabra que cambia el sentido («capacité *de nuevo*…») o si la misma rutina se hizo otro día.
  - Los registros fotográficos sin descripción nunca se toman como repetidos.
  - **Al anotar:** si la actividad ya existe, no se guarda otra vez. Pascal responde «♻️ Esa actividad ya la tenía registrada…», con *Corregir* y *Otra obligación*. Las fotos nuevas se agregan a la actividad que ya estaba.
  - **Antes del estado y del borrador:** las repetidas que ya estaban guardadas se unen. Queda la primera, con las obligaciones y fotos de todas, y Pascal avisa cuántas unió.
- **Consecuencias:** `packages/conversation/src/duplicates.ts` (`similarText`, `sameActivity`, `dedupeNotes`). Las repetidas se borran de `activity_notes` y sus fotos pasan a la que queda. Un borrador que usaba la nota borrada se vuelve a redactar.
