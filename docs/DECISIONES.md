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
