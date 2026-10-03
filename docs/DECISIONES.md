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
