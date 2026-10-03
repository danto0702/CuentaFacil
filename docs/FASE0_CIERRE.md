# Cierre de la Fase 0 — Base (sin WhatsApp real)

Fecha: 2026-10-03 · Rama: `claude/fase-0`

## Criterio de aceptación

> Con datos de prueba, desde el simulador, se generan el Informe de Actividades y el Informe de Supervisión de HRNO para un periodo completo y uno prorrateado, y los PDF se ven como los originales.

| Escenario | Cómo reproducirlo | Resultado |
|-----------|-------------------|-----------|
| Periodo completo: contrato 0001 Salud Pública, informe 03 DE 03 (1 al 30 de septiembre), con pagos anteriores ND 000001 y ND 000002 | `pnpm sim:demo` (primer guion) | 5 PDF (informes, ANTECEDENTES, AFILIACIONES, planilla), 2 DOCX y el ZIP con `CUENTAS SEPTIEMBRE 2026/DOCUMENTOS A CARGAR` |
| Periodo prorrateado: contrato 0002 EBS, pago 01-05 (20 al 31 de agosto, 12 días) con el valor del clausulado ($ 3.608.000 = honorarios + transporte) | `pnpm sim:demo` (segundo guion) | Igual; % presupuestal 9,09 %, balance y valor en letras correctos |

Lo mismo se verifica automáticamente en `apps/worker/test/generator.test.ts` (de punta a punta con LibreOffice) y en las pruebas golden de `packages/docgen`.

**Pendiente de tu revisión visual:** comparar lado a lado los PDF del simulador con los originales de HRNO (ver "Pruebas manuales").

## Qué quedó construido

- **Dominio** (`packages/shared`): montos en letras ("CUATRO MILLONES DE PESOS M/CTE ($4.000.000)"), moneda, fechas en español, rangos ("3 de octubre al 2 de noviembre de 2026"), cortes **fin de mes** y **fecha a fecha** con recorte al cambiar de modo, mes comercial de 30 días, calendario de pagos del clausulado con prioridad certificado > clausulado > contratista > cálculo, IBC (40 %, mín./máx. SMMLV, varios contratos), aportes y FSP, balance financiero y % presupuestal truncado ("66,66%").
- **Motor de documentos** (`packages/docgen`): catálogo de etiquetas (195 entradas, `docs/TEMPLATE_TAGS.md` generado), variables de entidad `{{ var_<clave> }}`, inspección y validación de etiquetas, formatos HRNO (actividades y supervisión MA-GH-IS-03 v4.0) con las correcciones de redacción aprobadas, modo sobre el DOCX original (conserva logos y pie), DOCX→PDF con LibreOffice, ANTECEDENTES/AFILIACIONES, ZIP partido si supera el límite de WhatsApp.
- **Conversación** (`packages/conversation`): notas por texto, audio y fotos (álbumes), fechas relativas ("ayer", "el martes", "el 15"), varios contratos y entidades ("¿A cuál contrato? [0001] [0002] [Ambos]"), clasificación a obligación con confianza, checklist con enlaces oficiales, borrador con preguntas para obligaciones sin registros ([Escribir/Audio] [Texto por defecto] [No aplicó]), edición, aprobación, generación y entrega en orden (PDF → DOCX → ZIP), cambio de corte con vista previa y confirmación.
- **Base de datos** (`supabase/`): esquema completo con RLS por rol, colas pgmq, pg_cron, buckets privados, seed idempotente de HRNO (checklist, enlaces, recordatorios) y datos sintéticos de dos entidades.
- **Panel** (`apps/panel`): login con Supabase Auth y roles, modo demo, entidades, **formatos y variables** (subir DOCX, ver etiquetas, crear variables, vista previa DOCX/PDF), catálogo, contratistas y cuentas.
- **Simulador** (`apps/simulator`) y **CI** (`.github/workflows/ci.yml`): lint, tipos, 95 pruebas, base de datos y build del panel.

## Pruebas manuales (te pido revisarlas)

1. `pnpm sim:demo` y abre `apps/simulator/out/2026-09-28/` y `apps/simulator/out/2026-08-31/`: compara los PDF con los originales de HRNO.
2. Abre los DOCX en Word: encabezado repetido en cada página, tablas, anexo de evidencias (2 fotos por fila).
3. Repite el paso 1 con tus DOCX originales (`--base-activity` / `--base-supervision`, ver README) para ver los logos y el pie de la ESE.
4. `pnpm panel` → Entidades → HRNO → Formatos: descarga una plantilla, cambia una etiqueta en Word, súbela, crea una variable y descarga la vista previa.
5. Revisa 3–4 valores en letras de casos reales que conozcas.
6. Confirma la estructura del ZIP contra lo que cargas en SECOP II.

## Limitaciones conocidas (a resolver en la Fase 1)

- La IA y la transcripción son **simuladas** (`FakeAI`, `FakeSTT`): la redacción solo pasa las notas a impersonal y no corrige la gramática ("Se realizó consultas…"). Claude y el proveedor STT reales entran en la Fase 1 con evaluaciones.
- La fuente **Arial Narrow** del encabezado de HRNO no está en el servidor; LibreOffice usa una sustituta. Hay que instalar la fuente (con licencia) en la imagen del worker o aceptar la sustituta.
- El **Dockerfile** del worker no se pudo construir aquí (sin Docker). Se valida al crear el servicio en Railway.
- Las migraciones se probaron en Postgres 16 con *stubs* de Supabase; falta aplicarlas a un proyecto Supabase real (pgmq, pg_cron, Storage).
- HEIC de iPhone: los binarios precompilados de sharp no lo leen; en la Fase 1 se agrega libheif a la imagen o un conversor.
- El valor del **SMMLV 2026** no está cargado (`system_settings.smmlv`): debe tomarse del decreto oficial.
- Los **enlaces oficiales** de antecedentes del seed deben verificarse antes de enviarlos a contratistas reales.
- Al cambiar de corte, el número de cuentas puede no coincidir con el número de pagos del clausulado; el bot muestra el calendario y pide confirmación, pero la regla fina se define con casos reales.
- Pendiente tu respuesta **F**: ¿el IBC se calcula solo sobre honorarios o también sobre el auxilio de transporte? (por defecto: solo honorarios).

## Lo que necesito de ti para arrancar la Fase 1

- Tu aprobación de la Fase 0 (y los ajustes visuales que veas).
- Meta Business verificado, app de WhatsApp, número nuevo y token permanente.
- Proyecto de Supabase (plan Pro), cuenta de Railway, API key de Anthropic y de OpenAI (transcripción) — te pediré autorización antes de crear recursos pagados.
- Valor del SMMLV 2026 y confirmación de los enlaces de antecedentes.
- Si puedes, un ejemplo anonimizado del informe de un contrato EBS.
