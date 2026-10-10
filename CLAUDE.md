# CLAUDE.md — CuentasBot

## Producto
Servicio: **CuentaFacil de PascalIA** (PascalIA es la empresa); el asistente de WhatsApp se llama **Pascal**. "CuentasBot" queda solo como nombre interno del código (paquetes `@cuentasbot/*`).

SaaS que acompaña por WhatsApp a contratistas de prestación de servicios de entidades públicas colombianas para preparar cada mes su cuenta de cobro. Entidad piloto: ESE Hospital Regional Noroccidental (HRNO), Ábrego, Norte de Santander. Multi-entidad desde el diseño; un contratista puede tener varios contratos con entidades distintas.

**Principio rector:** el contratista es responsable de lo que firma. El bot organiza, calcula, redacta borradores y valida; **nunca inventa actividades** y siempre pide aprobación antes de generar documentos finales.

Requisitos completos: `docs/PROMPT_INICIAL.md`. Plan vigente: `docs/PLAN.md` (arquitectura, Fase 0) y `docs/PLAN_V5.md` (modelo de servicio y fases siguientes). Decisiones: `docs/DECISIONES.md`.

## Estado
Fase 0 terminada (ver `docs/FASE0_CIERRE.md`), pendiente de aprobación del dueño. **No adelantar fases** (ver `docs/PLAN_V5.md` §9).

## Stack (propuesto)
- Supabase: Postgres + RLS, Storage privado, Auth (panel), Edge Functions (webhooks), pgmq, pg_cron.
- Worker Node 22 + TypeScript en Docker (Railway) con LibreOffice headless, Ghostscript, qpdf, libvips/libheif.
- Panel Next.js (App Router) + Supabase Auth (Railway).
- IA: Claude API — `AI_MODEL_FAST` = Haiku 5.5 (clasificación, intención), `AI_MODEL_SMART` = Sonnet 5.5 (soportes, redacción, correcciones, QA), `AI_MODEL_SETUP` = Opus 5.5 (configuración del contrato). Salidas estructuradas validadas con Zod (ADR-030).
- STT: adaptador `STT_PROVIDER` (OpenAI `gpt-4o-transcribe` por defecto).
- Monorepo pnpm + Turborepo, Biome, Vitest, pgTAP.

## Convenciones
- Código, tablas y comentarios en **inglés**. Todo lo que ve el usuario final en **español de Colombia**, cordial, tuteo.
- Montos en COP como enteros (`bigint`/`number` entero). Nunca flotantes para dinero.
- Datos sensibles cifrados en la aplicación (`*_enc`) + índice ciego (`*_bidx`) + últimos 4 (`*_last4`). Sin datos personales en logs.
- Documentos reales de entidades solo en `fixtures/private/` (ignorado). Los tests usan fixtures sintéticos.
- Toda decisión técnica nueva → ADR corto en `docs/DECISIONES.md`.
- Preguntar al dueño antes de: crear recursos que cuesten dinero, cambiar esquema en producción, enviar mensajes a números reales.
- Variables de plantilla: catálogo base (`docs/TEMPLATE_TAGS.md`, generado desde `packages/docgen/src/catalog.ts`) + variables de entidad `{{ var_<clave> }}`.
- Paquetes TypeScript sin compilar, importaciones NodeNext con extensión `.js`. El panel usa `next build --webpack` (ADR-017).
- La conversación solo usa puertos (`packages/conversation/src/ports.ts`); nada de llamadas directas a Supabase, Meta o Claude desde los flujos.
- Golden tests: si cambias un formato a propósito, regenera con `pnpm --filter @cuentasbot/docgen exec vitest run -u` y revisa el diff.

## Comandos
- `pnpm install` · `pnpm lint` · `pnpm -r typecheck`
- `pnpm -r --workspace-concurrency=1 test` (requiere LibreOffice + pdftotext para golden/e2e; se saltan si faltan)
- `pnpm db:test` (Postgres 16 local, sin Docker)
- `pnpm sim` / `pnpm sim:demo` (simulador) · `pnpm panel` (panel en modo demo)
- `pnpm tags:doc` (regenera el catálogo de etiquetas)
- Deploy: worker con `apps/worker/Dockerfile` en Railway; panel en Railway (Fase 1).

## Glosario del dominio
- **Contratista:** persona natural con Contrato de Prestación de Servicios (CPS) con una entidad pública.
- **Contrato:** número (ej. CPS-0330-2026), código SECOP (ej. CO1.PCCNTR.9618889), objeto, plazo, valor total, valor mensual, número de pagos/informes, supervisor, ordenador del gasto, obligaciones específicas y generales.
- **Periodo / cuenta de cobro:** tramo del contrato que se cobra. El contratista elige el **modo de corte**: `month_end` (del 1 al último día del mes) o `date_to_date` (p. ej. 3-oct → 2-nov); puede cambiarlo en cualquier momento (solo afecta periodos no entregados). Primer y último periodo pueden ser parciales (prorrateo configurable por entidad).
- **Informe No. X de N / Pago No. X de N:** consecutivos del periodo dentro del contrato (formato configurable: "02 DE 03" o "02-06").
- **Planilla PILA:** pago de seguridad social del independiente vía operador (Aportes en Línea, SOI, Mi Planilla…): número, PIN/autorización, fecha de pago, periodo de cotización, IBC, salud, pensión, ARL, total, banco. El periodo de cotización exigido (mes en curso o vencido) se configura por entidad; HRNO = mes en curso.
- **IBC:** Ingreso Base de Cotización; por regla general 40 % de la suma de honorarios mensuales (mín. 1 SMMLV, máx. 25 SMMLV). El auxilio de transporte **no** cuenta (confirmado por el dueño). La validación solo advierte (configurable).
- **Antecedentes:** Policía, RNMC (medidas correctivas), Procuraduría, Contraloría. El contratista los descarga (captcha) desde el enlace que le envía el bot; vigencia 30 días, se piden en cada cuenta.
- **Afiliaciones:** certificados de EPS, ARL y fondo de pensiones; se piden en cada cuenta (vigencia 30 días).
- **Momentos del servicio:** configuración (contrato SECOP + clausulado, $15.000), reporte diario, cierre (soportes, revisión en el chat, $50.000 por informe, ZIP). Ver `docs/PLAN_V5.md`.
- **Unión de cuentas:** un informe para varios periodos consecutivos; una planilla y una tabla de seguridad social por mes; se cobra un informe.
- **Certificación:** algunos contratos la requieren (indicador por contrato); la sube el contratista, puede haber varias.
- **Informe de supervisión:** lo firma el supervisor; el bot genera el borrador prellenado (HRNO: MA-GH-IS-03 v4.0). Fecha del informe, constancia, aprobación y firma del supervisor **siempre en blanco**.
- **Balance financiero:** pagado = pagos 1..N-1; causado no pagado = periodo N; ejecutado = pagado + causado; no ejecutado = total − ejecutado (configurable por entidad).
- **SECOP II:** plataforma donde el contratista carga los documentos; el bot no se conecta a ella.
