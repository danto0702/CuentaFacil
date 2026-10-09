# CuentaFacil de Pascalia (CuentasBot) — Plan de arquitectura y Fase 0

> Estado: **PROPUESTA — pendiente de aprobación del dueño.** No hay código de producto todavía.
> Fecha: 2026-10-03. Fuente de requisitos: [`PROMPT_INICIAL.md`](./PROMPT_INICIAL.md) · Versión 4 (respuestas del dueño, paquete HRNO, clausulado y certificado EBS).
> Esquema SQL inicial: [`schema_draft.sql`](./schema_draft.sql). Decisiones: [`DECISIONES.md`](./DECISIONES.md).

---

## 1. Respuestas del dueño (2026-10-03) y su impacto

| # | Respuesta | Impacto en el diseño |
|---|-----------|----------------------|
| 1 | Repo privado nuevo `cuentasbot`. | Este repo. Los documentos se retiran de `si-aps-ccfp`. |
| 2 | En el panel se deben **cargar los formatos de cada institución** e incluir **variables definidas por la entidad**. HRNO es el ejemplo (comprimido por entregar; hay originales). | Nuevo módulo **Variables de entidad** (§3.1): el superadmin define variables propias (`var.*`) con tipo, alcance y origen; el validador de plantillas acepta catálogo base + variables de la entidad y propone crear las desconocidas. |
| 3 | El contratista elige: **corte a fin de mes** (30 o 31 según el mes) o **fecha a fecha** (p. ej. 3-oct → 2-nov), y puede **corregirlo en cualquier momento**. | `contracts.period_mode` ∈ {`month_end`, `date_to_date`} lo elige el contratista en el onboarding y con el comando `mis contratos → cambiar corte`. Al cambiarlo se **recalculan solo los periodos no entregados** (`scheduled`/`collecting`/`ready_to_draft`), se muestra el nuevo calendario y se pide confirmación; los entregados no se tocan y queda registro en `events`. |
| 4 | Balance: pagado = 1..N-1, causado no pagado = N. | Fórmula por defecto en `entity.settings.balance`. |
| 5 | HRNO: **mes en curso**, configurable por entidad en el panel; sin fecha límite de pago; IBC **solo advierte**. | `settings.pila.contribution_month = 'current' | 'previous'`, `settings.pila.payment_deadline_day = null`, `settings.ibc.blocking = false`. |
| 6 | Antecedentes: vigencia **30 días**, se piden **en cada cuenta**, y el bot debe **enviar el enlace** de cada soporte. | `support_types.max_age_days = 30`, `frequency = every_period`, nuevo campo `support_types.official_url` editable en el panel. Los recordatorios y el comando "¿qué me falta?" incluyen el enlace (plantillas de Meta con botón URL). |
| 7 | Línea nueva, API oficial de Meta. | Cloud API directa, sin BSP. |
| 8 | `us-east-1` y 24 meses; dejarlo claro en la política. | Sección de **transferencia internacional** en `docs/legal/politica_tratamiento.md` (borrador, pendiente de abogado). |
| 9 | Varios contratos, **incluso de entidades distintas**. | Multi-contrato pasa a la **Fase 1**: selector de contrato en notas/soportes; una planilla respalda periodos de contratos de varias entidades (N:M ya existe); checklist y ZIP por contrato con las reglas de su entidad; IBC calculado sobre la suma de todos los contratos vigentes en el mes. |
| 10 | Firma escaneada pospuesta. | Fase 2. |

### Pendiente por confirmar

- ~~Prorrateo~~ → resuelto: el valor de cada pago sale del **clausulado**; si no trae tabla, mes comercial de 30 días (confirmado por el clausulado EBS).
- **Comprimido de HRNO**: súbelo a esta conversación (y los DOCX originales si los tienes). Los documentos reales van a `fixtures/private/` (ignorado por git).

### Hallazgos del paquete de formatos HRNO (recibido 2026-10-03)

El paquete trae las dos plantillas con etiquetas (borradores con defectos), una cuenta completa de ejemplo (septiembre 2026, informe 3 de 3, contrato de Coordinación Administrativa de Salud Pública), los soportes individuales, los paquetes consolidados, la carpeta `DOCUMENTOS A CARGAR` con el ZIP de SECOP y un JSON con todos los valores esperados. Los datos personales vienen anonimizados. Los archivos **no se suben a este repo**: se guardan localmente en `fixtures/private/hrno/` (ignorado por git); los tests usarán copias sintéticas.

Cambios al plan:

| Hallazgo | Impacto |
|----------|---------|
| La tabla de seguridad social del Informe de Actividades es un **objeto Excel incrustado** (imagen EMF). | Se reemplaza por una tabla nativa de Word con etiquetas (tarea 0.9). |
| Las plantillas tienen texto fijo de meses anteriores (encabezado, cédula, actividades, 14 imágenes) y mezclan datos de periodo y contrato. | Reconstrucción completa con bucles: `obligations[]` con `activities[]` (varios párrafos) y `evidences[]` (1–3 imágenes); el anexo **solo incluye actividades con evidencia**. |
| Las etiquetas existentes usan `{{ snake_case }}` plano (`contract_number`, `ss_pin`…). | El catálogo base (`TEMPLATE_TAGS.md`) se diseña compatible con esos nombres para que el formato de la entidad cambie lo mínimo; se agregan las que faltan (`contract_start_date`, `prior_payments[]`, `payment_value_words`, etc.). |
| El Informe de Supervisión conserva encabezado (logos ESE y Gobernación, código/versión) y pie institucional como imágenes de la plantilla. | El motor no toca encabezados/pies con imágenes; solo reemplaza etiquetas. |
| Balance: pagos anteriores con su comprobante (`ND 001092 $4.000.000`). | Nueva tabla `period_payments` (número de nota/acta, fecha, valor) diligenciada por el contratista o el panel; alimenta `prior_payments[]` y `balance_paid`. |
| La entidad expide **Certificado de Cumplimiento** (MA-GTH-CC-04) y **Documento Soporte DIAN (DSE)**; el contratista imprime la **ficha SECOP** del contrato. | Nuevos `support_types`: `CERT_CUMPLIMIENTO`, `DSE`, `FICHA_SECOP` (solo se reciben y validan: planilla y valor coinciden). |
| `DOCUMENTOS A CARGAR` = 9 PDF + ZIP llamado `aprobacindelossoportespresentadosalsupervisordelcon.zip`. | Estructura y nombres del ZIP configurables por entidad (`settings.package`). |
| SECOP muestra fechas **MM/DD/AAAA** (inicio `07/06/2026` = 6 de julio). | El extractor de la ficha SECOP lo trata explícitamente y siempre pide confirmar fechas. |
| ARL afiliada **a nombre de la ESE**, una fila por contrato con fechas de cobertura. | Validación de cobertura por contrato (ya prevista en 8.5), leyendo la fila del contrato correcto. |
| EPS incluye fecha de nacimiento. | El extractor la descarta (no se guarda). |
| Fecha en "2.2 Inhabilidades" = **fecha de revisión** (fecha del informe), no la de expedición. | Regla por defecto en HRNO, configurable. |
| IBC = 40 % × (4.000.000 + 8.500.000) = 5.000.000; salud 12,5 %, pensión 16 %, ARL riesgo III 2,436 %. | Casos de prueba de `minIbc` y de validación de la planilla. |
| El documento real tiene errores (`$4.000.00`, `MCTTE`, `durante en el periodo`, `a los29 días`). | Ver pregunta B. |

### Preguntas del paquete HRNO que siguen abiertas

- **A. Prorrateo del primer periodo:** el contrato inició el 06/07/2026 con 3 pagos iguales de $4.000.000. ¿El informe 1 (julio) se cobró **completo** (pagos iguales sin importar los días) o **prorrateado** del 6 al 31? Si fue completo, la regla por defecto de HRNO sería "pagos iguales" y el prorrateo quedaría solo como opción.
- **B. Errores del formato oficial** (`MCTTE`, `durante en el periodo`, `a los establecido`, `Se pude verificar`): ¿los corrijo en la plantilla o los dejo idénticos al formato de la ESE? Recomiendo corregirlos; el error de cifra `$4.000.00` siempre se corrige porque el valor lo calcula el sistema.
- **C. Prórroga y/o adición = SI** con adiciones en $0 en el ejemplo: ¿hubo prórroga real o quedó fijo? Por defecto el sistema lo calcula desde `contract_amendments`.
- **D. Compromiso del último informe:** ¿fecha de fin del contrato (como el real, `30/09/2026`) o "N/A – informe final"?
- **E. Contrato EBS** ($8.500.000, "Pago No. 02-06", encabezado distinto): cuando puedas, comparte un ejemplo anonimizado de ese informe para construir la segunda variante.

### Respuestas a las preguntas del paquete HRNO (2026-10-03)

| # | Respuesta | Impacto |
|---|-----------|---------|
| A | El primer periodo se cobra **completo**, pero lo debe confirmar el contratista, o se toma del **certificado de cumplimiento** si lo tiene. | El valor de cada cuenta tiene **origen trazable**: `clausulado` → `certificado` → `contratista` (ver abajo). El bot siempre muestra el valor y pide confirmación. |
| B | Corregir los errores del formato oficial. | Las plantillas HRNO salen con la redacción corregida (`M/CTE`, "durante el periodo", "lo establecido", "Se pudo verificar", "a los 29 días"). |
| C | La prórroga/adición la informa el contratista; por defecto **no hay**. | `PRORROGA y/o ADICION = NO` salvo que existan registros en `contract_amendments`. |
| D | Último informe: **N/A**. | Compromiso del último periodo = "N/A – informe final". |
| E | Los **clausulados** definen los pagos. | El clausulado es la fuente del calendario de pagos (siguiente sección). |

### Lo que muestran el clausulado EBS y el certificado de cumplimiento EBS

Documentos reales (no anonimizados) compartidos como referencia: **no se guardan en el repo** y no se citan datos personales.

**Clausulado** (formato MA-GJ-C-EP-05 v4.0, contrato de Equipo Básico de Salud):

1. **Cláusula de valor y forma de pago con tabla explícita de pagos.** Ejemplo: valor total $39.688.000 = un primer pago de $3.608.000 (12 días) + 4 pagos de $9.020.000. Cada pago tiene **conceptos**: honorarios ($8.400.000/mes) y **auxilio de transporte** ($620.000/mes, incluido en el valor del contrato).
   - El primer pago confirma la convención de **mes comercial de 30 días**: 8.400.000 / 30 × 12 = 3.360.000 y 620.000 / 30 × 12 = 248.000.
   - → Nueva tabla `payment_schedule` (pago N, días/meses, valor) con `payment_schedule_items` (concepto, valor). El extractor lee esta cláusula y el contratista confirma. El prorrateo calculado solo se usa si el clausulado no trae la tabla.
2. **Obligaciones agrupadas por componentes con peso** (Caracterización 20 %, Plan comunitario 10 %, Planes individuales 60 %, …) y **metas mensuales por indicador** (p. ej. "Consultas totales: meta 400, 80 por mes"; "Registro caracterizaciones: 25 % por mes").
   - → Nuevas tablas `obligation_groups` (nombre, peso %) y `obligation_goals` (indicador, meta total, meta por mes). El bot pregunta el avance del mes contra la meta y lo incluye en el informe.
3. **Pagos sujetos a cumplimiento de metas**: el transporte se descuenta en proporción al cumplimiento, y con menos del 70 % hay glosa/terminación.
   - → Alerta temprana en el bot si el avance reportado va por debajo del umbral configurado (70 % en HRNO-EBS).
4. **Lista de documentos de la cuenta definida en el clausulado** (para EBS: informe con evidencia, informe de supervisión, **certificado de ejecución del coordinador EBS**, planilla, afiliaciones, certificado de cumplimiento del supervisor, DSE, antecedentes en un solo PDF).
   - → El checklist se define por **tipo de contrato** (`contract_profile`), no solo por entidad; el extractor propone el checklist a partir del clausulado.
5. Plazo en días ("126 días contados a partir del perfeccionamiento") y numeración `CPS-ESEHRNO-0607-2026`.

**Certificado de cumplimiento / ejecución EBS** (expedido por la coordinación EBS):

- Tabla por cuenta: **valor base, % de ejecución, valor, transporte, total**, y el periodo exacto (p. ej. "Cuenta 1 (2026-08-20 a 2026-09-19)" → corte **fecha a fecha**).
- → El valor a cobrar puede ser **menor al 100 %**: `periods.execution_pct` y `periods.amount` confirmados con `amount_source = 'certificate'` cuando el certificado existe. El certificado también confirma el modo de corte.

### Pregunta F (resuelta)

- **Respuesta del dueño (2026-10-03): el auxilio de transporte no cuenta en el IBC.** Pregunta original — **F. IBC y auxilio de transporte:** ¿el 40 % del IBC se calcula solo sobre los **honorarios** ($8.400.000) o sobre el total del pago incluyendo transporte ($9.020.000)? Mi entendimiento es que el auxilio de transporte no hace parte del IBC, pero lo dejo **configurable por concepto** (`counts_for_ibc`) y por defecto solo honorarios.

---

## 2. Arquitectura

### 2.1 Diagrama

```
                         ┌────────────────────────── Meta Cloud API ─────────────────────────┐
  Contratista (WhatsApp) │  webhook (POST, X-Hub-Signature-256)        Graph API (envío/medios) │
                         └──────────────┬──────────────────────────────────────▲────────────┘
                                        │                                      │
                                        ▼                                      │
                      Supabase Edge Function `wa-webhook` (Deno)               │
                       • verifica firma HMAC-SHA256 con WA_APP_SECRET          │
                       • INSERT wa_inbound ON CONFLICT (wamid) DO NOTHING      │
                       • pgmq.send('inbound') solo si fue insertado            │
                       • responde 200 (< 1 s)                                  │
                                        │                                      │
 ┌──────────────────────────── Supabase (Postgres 15+) ─────────────────────────────────────┐
 │  Tablas con RLS · pgmq: inbound / jobs / outbound / *_dlq · pg_cron · Storage privado    │
 │  pg_cron: abre periodos, dispara recordatorios (→ outbound), purga retención, re-encola  │
 └───────▲───────────────────────────────▲───────────────────────────────▲──────────────────┘
         │ pgmq.read (vt) / SQL          │                               │ Auth + RLS
         │                               │                               │
 ┌───────┴───────────── Worker Node 22 / TypeScript (Railway, Docker) ───┴───────┐   ┌──────────────────┐
 │  consumer `inbound`  → Orquestador (máquina de estados por usuario,          │   │ Panel Next.js     │
 │                         lock por usuario, ver §2.3)                           │   │ (App Router)      │
 │  consumer `jobs`     → descarga de medios · STT · clasificación/extracción   │   │ Supabase Auth     │
 │                         (Claude) · redacción · generación DOCX→PDF · ZIP     │   │ (2FA superadmin)  │
 │  consumer `outbound` → token bucket por número · reintentos con backoff      ├──►│ Railway           │
 │  Puertos: Channel(WhatsApp|Simulador) · AI(Claude|Fake) · STT · Storage      │   └──────────────────┘
 │  Binarios: LibreOffice headless · Ghostscript · qpdf · libvips/libheif        │
 └──────────────────────────────────────────────────────────────────────────────┘
        ▲                                        Wompi ──webhook──► Edge Function `wompi-webhook`
        └── Anthropic API · STT API                                  (checksum + idempotencia, Fase 3)
```

### 2.2 Componentes y responsabilidades

| Componente | Tecnología | Responsabilidad |
|------------|-----------|-----------------|
| `supabase/` | Migraciones SQL, pgTAP, Edge Functions (Deno) | Esquema, RLS, colas, cron, webhooks (Meta, Wompi). Las Edge Functions **no** contienen lógica de negocio: validan, persisten, encolan. |
| `apps/worker` | Node 22 + TS, Docker (Debian slim + LibreOffice + fuentes) | Orquestador, IA, STT, documentos, envío saliente. Escala horizontalmente (varias réplicas consumiendo pgmq). |
| `apps/panel` | Next.js (App Router) + Supabase Auth + Tailwind | Panel admin/operador. Lee con RLS (clave anon + sesión), acciones privilegiadas vía Server Actions con service role. |
| `packages/shared` | TS puro, sin dependencias de runtime pesadas | Dominio: periodos/prorrateo, IBC, % presupuestal, balance, número a letras, formatos de fecha/moneda, tipos, esquemas Zod, catálogo de etiquetas. Lo usan worker, panel y simulador. |
| `packages/docgen` | docx-templates, pdf-lib, sharp, wrappers de soffice/gs/qpdf | Motor de plantillas, validador de etiquetas, conversión, paquetes PDF, ZIP. |
| `packages/conversation` | TS puro | Flujos y máquina de estados de conversación, independiente del canal. |
| `apps/simulator` | CLI (Node, readline) | Chat local que usa **el mismo** orquestador con `Channel=Console` y `AI=Fake|Claude`. |

### 2.3 Decisiones de diseño clave

1. **Colas en Postgres (pgmq) en vez de Redis/SQS.** Menos piezas, transaccional con los datos, visible desde el panel. El worker lee con `pgmq.read(queue, vt, qty)`; si el job falla se deja vencer el *visibility timeout* y se reintenta; tras `max_attempts` (5) se mueve a `<cola>_dlq` y se registra en `job_failures` (visible en el panel con botón "reintentar").
2. **Orden y concurrencia por usuario.** Los mensajes de un mismo usuario deben procesarse en orden (y los álbumes de fotos agruparse ~60 s). El consumidor toma un `pg_try_advisory_xact_lock(hash(user_id))`; si otro worker tiene el lock, devuelve el mensaje a la cola con un `vt` corto. La agrupación de álbumes usa un "debounce" en `conversations.context` + job diferido.
3. **Idempotencia.** `wa_inbound.wamid` único; `webhook_events (provider, external_id)` único para Wompi; `outbound_messages.idempotency_key` único (no reenviar un documento ya entregado si el job se reintenta); `generated_documents (period_id, kind, version)` único.
4. **Acuse < 5 s.** El orquestador responde de inmediato con un acuse ("📎 Recibí tu planilla, la estoy revisando…") y encola el trabajo pesado en `jobs`; el resultado llega como mensaje aparte.
5. **Conversación = máquina de estados explícita** (`flow`, `step`, `context` JSON, `expires_at`) implementada a mano con reductores tipados (sin XState: el árbol de flujos es poco profundo y así los tests de conversaciones grabadas son triviales). La IA solo interviene para: (a) interpretar texto libre cuando no hay intención determinística, (b) clasificar/extraer, (c) redactar. Comandos (`menú`, `estado`, …) se resuelven sin IA por coincidencia normalizada + sinónimos.
6. **Ventana de 24 h.** `conversations.last_inbound_at` determina si el saliente puede ser libre o debe ser plantilla; el consumidor `outbound` lo valida antes de enviar (si la ventana cerró, convierte el mensaje en la plantilla equivalente o lo descarta con registro).
7. **Cifrado de datos sensibles en la aplicación** (AES-256-GCM, `ENCRYPTION_KEY` con versión de clave en el texto cifrado) + **índice ciego** HMAC-SHA256 para buscar por número de documento. Se descarta pgsodium (Supabase lo marcó como en desuso) — ADR-005.
8. **Plantillas DOCX con `docx-templates`** (ADR-003): MIT, bucles, condicionales, imágenes dinámicas, etiquetas en encabezados/pies. `docxtemplater` exige módulo de pago para imágenes; Carbone añade un servidor y licencia propia.
9. **DOCX→PDF con LibreOffice headless** en el contenedor, con fuentes métricamente compatibles instaladas (Liberation, Carlito/Caladea, y Arial/Calibri si la licencia de las fuentes de la entidad lo permite). La fidelidad de fuentes es el principal riesgo visual → golden tests por texto + revisión visual manual en Fase 0.
10. **Panel en Railway** junto al worker (ADR-002): un solo proveedor, una factura, redes privadas; Vercel Hobby no permite uso comercial y Vercel Pro suma US$20/mes sin beneficio claro aquí.

### 2.4 Proveedores propuestos (justificación)

| Necesidad | Propuesta | Alternativas evaluadas | Por qué |
|-----------|-----------|------------------------|---------|
| Worker + panel | **Railway** (plan Pro, región US East) | Fly.io, Render | Despliegue por Dockerfile desde GitHub, escalado de réplicas, red privada, facturación por uso (~US$30–50/mes para esta carga), logs y métricas incluidos. Fly exige más operación (máquinas, volúmenes); Render cobra por instancia fija y los planes con 2 GB RAM (LibreOffice) son más caros. |
| Transcripción | **OpenAI `gpt-4o-transcribe`** (≈ US$0,006/min) con `prompt` de vocabulario (municipios, programas, siglas: EBS, PAI, ESE, IEC…), detrás de un adaptador `STT_PROVIDER` | `gpt-4o-mini-transcribe` (≈ US$0,003/min), Deepgram Nova-3 multilingüe (≈ US$0,0058–0,0092/min, *keyterm prompting*) | Buena precisión en español latinoamericano, acepta OGG/Opus de WhatsApp sin transcodificar, permite pistas de vocabulario. Costo mensual pequeño (~US$20). **En Fase 1 hago una evaluación con ~30 audios reales** y, si `mini` empata en calidad, bajamos a la mitad. |
| Plantillas | **docx-templates** | docxtemplater (+módulo de imágenes de pago), Carbone, generar DOCX con `docx` (código) | Ver ADR-003. |
| PDF | **pdf-lib** (unir, metadatos), **Ghostscript** (compresión de escaneos), **qpdf** (linealizar/reparar), **sharp/libvips con libheif** (HEIC→JPEG, orientación EXIF, redimensionar) | pdfkit, ImageMagick | Bibliotecas maduras; Ghostscript se usa como binario en nuestro servidor (sin distribución → AGPL no nos obliga a publicar código, lo dejo en el ADR para revisión). |
| IA | Claude API: `AI_MODEL_FAST=claude-haiku-4-5` (clasificación, intención, extracción simple), `AI_MODEL_SMART=claude-sonnet-5-5` (contratos, planillas, redacción) | — | Ver §2.5. |
| Errores | Sentry (plan gratuito) | — | Trazas del worker y del panel; **scrubbing** de datos personales antes de enviar. |

### 2.5 Uso de Claude (verificado en la referencia de API vigente al 2026-10-03)

- Modelos: Haiku 4.5 (`claude-haiku-4-5`, US$1 / US$5 por MTok entrada/salida) y Sonnet 5.5 (`claude-sonnet-5-5`, US$2 / US$10; lectura de caché US$0,20). El ID con fecha `claude-haiku-4-5-20251001` también sirve para fijar la versión; se valida contra la Models API al arrancar el worker.
- **Salidas estructuradas**: `output_config.format` con JSON Schema generado desde Zod, y se vuelve a validar con Zod. *Nota:* Sonnet 5.5 rechaza `tool_choice` forzado (`any`/`tool`), así que no usaremos tool use forzado para obtener JSON.
- Sonnet 5.5 no permite desactivar el razonamiento con `disabled`; para extracción usaremos `effort: "low"` y para redacción `effort: "medium"`; se ajusta con las evaluaciones.
- PDFs como bloque `document` (base64) — Claude lee PDF nativos; para contratos largos primero se extrae texto con `pdftotext` y solo se mandan como imagen las páginas sin capa de texto.
- Caché de prompts para instrucciones fijas + obligaciones del contrato (prefijo estable, contenido variable al final).
- `stop_reason: "refusal"` se maneja explícitamente (reintento con el otro modelo y, si persiste, `needs_human`).
- Cada llamada registra `ai_usage` (tokens de entrada, caché, salida, costo estimado, propósito, usuario, periodo).

### 2.6 Variables de entorno (se suman a las de la sección 16)

```
# Supabase
SUPABASE_DB_URL=                 # conexión directa (Supavisor, modo sesión) para pgmq desde el worker
# WhatsApp
WA_GRAPH_API_VERSION=            # fijada explícitamente; se revisa en cada actualización de Meta
WA_OUTBOUND_RATE_PER_SEC=20      # token bucket según el tier del número
# IA
AI_MODEL_FAST=claude-haiku-4-5
AI_MODEL_SMART=claude-sonnet-5-5
AI_CONFIDENCE_THRESHOLD=0.8
AI_COST_ALERT_USD_PER_PERIOD=2
STT_MODEL=gpt-4o-transcribe
# Seguridad
ENCRYPTION_KEY_ID=v1             # versión activa de ENCRYPTION_KEY
BLIND_INDEX_KEY=                 # clave HMAC distinta de ENCRYPTION_KEY
# Operación
WORKER_CONCURRENCY=4
SOFFICE_TIMEOUT_MS=60000
MAX_DOC_MB=2
RETENTION_MONTHS=24
SENTRY_DSN=
LOG_LEVEL=info
```

---

## 3. Modelo de datos

El DDL completo propuesto está en [`schema_draft.sql`](./schema_draft.sql). Resumen y cambios respecto a la propuesta de la sección 6 del prompt:

| Cambio | Motivo |
|--------|--------|
| `staff_members` (vincula `auth.users` con rol `superadmin`/`operator`) | Los roles de panel viven en una tabla, no en `users` (que son contratistas de WhatsApp sin cuenta de Auth). `users.auth_user_id` queda nulo hasta el portal de la Fase 4. |
| `contract_templates` (contrato ↔ plantilla por tipo) + `contracts.contract_profile` | HRNO tiene variantes por tipo de contrato (Salud Pública vs EBS). |
| `period_social_security` (N:M) | Una planilla respalda periodos de varios contratos. |
| `period_payments` (pagos anteriores con comprobante ND/acta) | Balance financiero y columna de pagos del Informe de Supervisión. |
| `wa_inbound` separado de `messages` | Crudo e idempotente por `wamid`; `messages` es el log legible (resumido, sin datos sensibles). |
| `outbound_messages` | Cola persistente de salida con `idempotency_key`, estado de entrega (webhooks `statuses` de Meta) y costo. |
| `webhook_events` | Idempotencia genérica (Meta statuses, Wompi). |
| `support_tickets`, `job_failures`, `policy_versions`, `consents`, `data_requests` | Bandeja de soporte, DLQ visible, habeas data (versionado + solicitudes de supresión). |
| `entity_settings` como JSONB validado con Zod | Reglas variables por entidad (IBC, vigencias, fórmulas de balance, horas de reunión, textos fijos) sin migraciones por cada entidad. |
| Montos en `bigint` (pesos, sin decimales) | Evita errores de coma flotante; los porcentajes se calculan con aritmética entera/decimal en `shared`. |

### 3.1 Formatos y variables por entidad (respuesta 2)

Flujo en el panel → **Entidades › Formatos**:

1. El superadmin sube el DOCX del formato (Informe de Actividades, Informe de Supervisión, carta, etc.) y lo asigna a un **tipo de contrato** (`contract_profile`) de esa entidad.
2. El sistema extrae todas las etiquetas `{{…}}` del documento (cuerpo, tablas, encabezados y pies) y las clasifica:
   - **Catálogo base** (`contract.number`, `period.from_long`, `ss.total`, `obligations[]`, …) → OK.
   - **Variables de la entidad** (`var.codigo_formato`, `var.lugar_reunion`, `var.nombre_gerente`, …) → OK si existen.
   - **Desconocidas** → el panel propone crearlas como variables de la entidad (nombre, tipo, alcance, valor por defecto) o marcarlas como error de digitación.
3. Vista previa con datos de ejemplo (DOCX y PDF) antes de **activar** la versión. Las versiones anteriores quedan para regenerar cuentas viejas igual que se entregaron.

**Variables de la entidad** (`entity_variables`):

| Campo | Valores |
|-------|---------|
| `key` | `snake_case`, se usa como `{{var.key}}` |
| `type` | `text`, `long_text`, `number`, `money`, `date`, `boolean`, `select` (con opciones), `image` |
| `scope` | `entity` (un valor fijo: p. ej. código y versión del formato), `contract` (por contrato: p. ej. dependencia), `period` (por cuenta: p. ej. número de radicado), `user` (por contratista) |
| `source` | `admin` (lo diligencia el panel), `ask_contractor` (el bot lo pregunta por WhatsApp en el momento indicado), `computed` (expresión segura sobre el catálogo, p. ej. `period.amount * 0.4`) |
| `required`, `default_value`, `prompt_text` | Texto con que el bot pregunta, validación |

Valores en `entity_variable_values (variable_id, scope_ref_id, value jsonb)`. El motor arma el contexto `catálogo base + var.*` y falla con mensaje claro si falta una variable obligatoria.

### 3.2 Modo de corte del periodo (respuesta 3)

- `month_end`: periodos del día 1 al último día del mes (28/29/30/31); el primero y el último pueden ser parciales.
- `date_to_date`: periodos del día de inicio al día anterior del mes siguiente (3-oct → 2-nov); si el día no existe en el mes (31), se usa el último día.
- Cambio de modo en cualquier momento: recalcula solo periodos no entregados, muestra el calendario nuevo y pide confirmación.

### 3.3 Soportes con enlace (respuesta 6)

`support_types.official_url` y `instructions` editables en el panel. Valores iniciales para HRNO (a verificar antes de la Fase 1, porque los portales cambian): Policía (antecedentes judiciales), RNMC (medidas correctivas), Procuraduría (antecedentes disciplinarios), Contraloría (responsabilidad fiscal), y los portales de afiliación de EPS/ARL/AFP que indique el contratista.

**RLS**: activado en todas las tablas. Funciones `security definer` `is_staff()`, `is_superadmin()`, `current_contractor_id()`.
- Superadmin: todo. Operador: lectura de todo excepto `payments`/`subscriptions` completos (vista `subscriptions_operator` sin montos ni referencias) y sin `DELETE`; `UPDATE` solo en columnas corregibles (vía funciones RPC).
- Contratista (futuro portal): solo filas donde `user_id = current_contractor_id()`, solo lectura.
- Worker y Edge Functions: `service_role` (bypass RLS) solo del lado servidor.
- Storage: buckets privados `contracts`, `supports`, `evidences`, `templates`, `outputs`; ruta `{entity_id}/{user_id}/{contract_id}/{period_number}/…`; URLs firmadas de ≤ 5 min.
- Tests de RLS con **pgTAP** (`supabase test db`) en CI.

---

## 4. Estimación de costos mensuales — 500 cuentas/mes

**Supuestos** (explícitos; se recalibran con datos reales del piloto):
- 500 cuentas = **350 contratistas** activos (1,43 contratos c/u).
- Por contratista/mes: 40 notas (25 texto, 10 audios de ~1 min, 5 solo foto), 30 fotos, 10 soportes, 1 ciclo de borrador por contrato con 2 rondas de edición, **~200 mensajes salientes** (acuses, confirmaciones, ~10 documentos por cuenta) y ~8 plantillas de recordatorio fuera de la ventana de 24 h.
- TRM supuesta: **COP 4.000 / US$** (solo para referencia).
- Precios de terceros verificados el 2026-10-03; la tarifa de Meta para Colombia proviene de fuentes secundarias porque `developers.facebook.com` está bloqueado desde este entorno → **confirmar en el rate card oficial**.

| Rubro | Cálculo | US$/mes |
|-------|---------|--------:|
| **WhatsApp – servicio** (nuevo desde 1-oct-2026: los mensajes libres dentro de la ventana se cobran a tarifa de utilidad, 1.000 gratis/número/mes) | (350 × 200 − 1.000) × US$0,0008 | ≈ 55 |
| **WhatsApp – plantillas de utilidad** | 350 × 8 × US$0,0008 | ≈ 2 |
| **Claude – clasificación de notas** (Haiku, prefijo en caché) | 350 × 40 × ~US$0,0033 | ≈ 46 |
| **Claude – soportes** (clasificación Haiku + extracción Sonnet de planilla/certificados) | 350 × ~US$0,13 | ≈ 46 |
| **Claude – redacción + 2 ediciones** (Sonnet 5.5) | 500 × ~US$0,10 | ≈ 50 |
| **Claude – intención en texto libre, fotos, contratos (amortizado)** | | ≈ 40 |
| Margen IA (reintentos, mensajes largos) +30 % | | ≈ 55 |
| **Transcripción** (`gpt-4o-transcribe`) | 350 × 10 min × US$0,006 | ≈ 21 |
| **Supabase Pro** + cómputo Small (incluye 100 GB Storage, backups diarios 7 días) | 25 + (15 − 10 crédito) | ≈ 30 |
| Storage adicional (≈ 15 GB nuevos/mes; supera 100 GB hacia el mes 7) | 0,021 US$/GB extra | 0 → 5 |
| **Railway** (worker 2 GB RAM, 1–2 réplicas + panel) | uso | ≈ 30–50 |
| Dominio, correo transaccional, Sentry free | | ≈ 3 |
| **Total** | | **≈ US$380–410/mes** |

- **Costo por cuenta ≈ US$0,80 (≈ COP 3.200).** La IA es ~60 % del costo; las palancas principales son caché, agrupar confirmaciones (menos salientes) y bajar a `mini` en STT si la evaluación lo permite.
- Rango de incertidumbre: **US$250–600/mes** según volumen real de notas/mensajes.
- **Wompi** no es costo fijo: comisión por transacción (plan agregador ≈ 2,65 % + COP 700 + IVA; Nequi/Bancolombia por link ≈ 1,5 % + IVA). Considerarlo en el precio.
- La **Fase 0 no genera costos** (todo local: Supabase CLI + Docker). Te pediré autorización antes de crear cualquier recurso pagado.

Fuentes: referencia de precios de la API de Anthropic (skill `claude-api`, caché 2026-09-25); [Wati – cambios de precio de mensajes de servicio](https://www.wati.io/en/blog/whatsapp-service-message-pricing/), [Techweez – cobro de mensajes de servicio sobre 1.000](https://techweez.com/2026/09/28/whatsapp-business-pricing-october-2026/), [Plivo – tarifas WhatsApp Colombia](https://www.plivo.com/whatsapp/pricing/co/); [Deepgram pricing](https://deepgram.com/pricing), [OpenAI gpt-4o-mini-transcribe](https://developers.openai.com/api/docs/models/gpt-4o-mini-transcribe), [CostGoat – OpenAI transcription](https://costgoat.com/pricing/openai-transcription); [Wompi – planes y tarifas](https://wompi.com/es/co/planes-tarifas/).

---

## 5. Plan detallado de la Fase 0 — Base (sin WhatsApp real)

**Objetivo:** con datos de prueba, desde el simulador, generar el Informe de Actividades y el Informe de Supervisión de HRNO para **un periodo completo y uno prorrateado**, con PDF visualmente equivalentes a los originales.

**Fuera de alcance:** Meta, Wompi, STT, despliegue en la nube, panel completo (solo esqueleto con login).

### 5.1 Tareas

| # | Tarea | Entregable | Criterio de aceptación |
|---|-------|-----------|------------------------|
| 0.1 | Monorepo | `pnpm` workspaces + Turborepo; `apps/{worker,panel,simulator}`, `packages/{shared,docgen,conversation}`, `supabase/`; TypeScript estricto; Biome (lint+formato); Vitest | `pnpm install && pnpm lint && pnpm test` pasa en limpio |
| 0.2 | CI | GitHub Actions: lint, typecheck, unit tests, `supabase db reset` + pgTAP, golden tests en imagen Docker del worker | PR verde; falla si una migración rompe RLS |
| 0.3 | `CLAUDE.md`, `README`, `.env.example`, `docs/DECISIONES.md`, `docs/TEMPLATE_TAGS.md`, `docs/WHATSAPP_TEMPLATES.md` (borrador) | Documentación | Glosario del dominio completo; comandos dev/test documentados |
| 0.4 | Esquema inicial | Migraciones desde `schema_draft.sql` (ajustado a tus respuestas), RLS, buckets, colas pgmq, `pg_cron` (sin jobs activos aún) | `supabase db reset` sin errores; pgTAP: un operador no ve `payments`, un contratista solo ve lo suyo, anon no ve nada |
| 0.5 | Seed HRNO | Entidad HRNO, `support_types` (PILA, POLICIA, RNMC, PROCURADURIA, CONTRALORIA, EPS, ARL, AFP, RUT, CEDULA, CUENTA_BANCARIA, EVIDENCIA) con paquetes y orden, reglas de recordatorio (día 20, 25, último día), 2 contratistas y 3 contratos **sintéticos** (uno de ellos en otra entidad ficticia; corte fin de mes, fecha a fecha 24→23, inicio 06/07 prorrateado), enlaces oficiales de soportes | Seed idempotente |
| 0.6 | `packages/shared` – dominio | `numberToWordsCOP` ("CUATRO MILLONES DE PESOS M/CTE ($4.000.000)"), `formatCOP` ("$ 4.000.000"), fechas (`dd/mm/aaaa`, "1 al 31 de agosto de 2026", "DEL 1 AL 31 DE AGOSTO DE 2026"), `padReport` ("02 DE 03", "02-06"), `formatPercent` ("66,66%"), `buildPeriods` (`month_end` / `date_to_date`, recálculo al cambiar de modo, primer y último periodo parciales, prórrogas/adiciones), `proratedAmount` (30 días comerciales o reales, ajuste en el último pago), `budgetExecutionPct`, `financialBalance` (fórmulas por entidad), `minIbc` (40 %, mín 1 / máx 25 SMMLV por año, multi-contrato) | Cobertura ≥ 95 % en `shared`; casos: millones, miles, ceros, "UN MILLÓN", "VEINTIÚN", 1.000.000.000, febrero, año bisiesto, contrato que termina a mitad de mes, suma de pagos = valor total |
| 0.7 | Catálogo de etiquetas | `TEMPLATE_TAGS.md` generado desde un esquema Zod (`TemplateContext`) — una sola fuente de verdad | El doc se regenera en CI y falla si está desactualizado |
| 0.8 | Motor de plantillas (`packages/docgen`) | `render(template, context)` con docx-templates; contexto = catálogo base + `var.*` de la entidad; helpers registrados; imágenes (evidencias escaladas al ancho útil, 2 por fila); `validateTemplate(docx)` que lista etiquetas desconocidas o mal formadas | Plantilla con etiqueta inexistente → error legible con nombre y ubicación |
| 0.9 | Plantillas HRNO | `activity_report` (variante Salud Pública y variante EBS "Pago No. 02-06"), `supervision_report` MA-GH-IS-03 v4.0, construidas desde tus DOCX/PDF | Revisión visual tuya lado a lado con los originales |
| 0.10 | Conversión y paquetes | Dockerfile del worker (LibreOffice + fuentes + gs + qpdf + libheif); `docxToPdf` con cola de 1 proceso soffice por réplica y timeout; `imagesToPdf` (HEIC, EXIF, compresión < 2 MB configurable); `mergePdfs` en orden configurable (ANTECEDENTES, AFILIACIONES); `buildZip` con la estructura HRNO (carpeta del periodo + `DOCUMENTOS A CARGAR`) y partición si supera el límite de documento de WhatsApp | HEIC de iPhone rotado sale derecho; paquete de 4 certificados escaneados < 2 MB y legible |
| 0.11 | Golden tests | Fixtures **sintéticos** en `fixtures/synthetic/` (los reales en `fixtures/private/`, ignorado por git); genera → `pdftotext` → normaliza → compara con `.golden.txt`; además renderiza la página 1 a PNG para revisión manual | Periodo completo y prorrateado, ambos informes, pasan en CI |
| 0.12 | Orquestador mínimo (`packages/conversation`) | Puertos `Channel`, `AI`, `Clock`, `Repo`; flujos: `menu`, `nota` (texto con fecha relativa "ayer", "el martes", "el 15"), asignación manual a obligación por lista, `estado`, `ver borrador`, aprobar/editar texto, `generar`; `AI=Fake` determinístico (y `AI=Claude` opcional tras bandera, sin costo en CI) | Tests de conversaciones grabadas (JSON entrada → salidas esperadas) |
| 0.13 | Simulador CLI | `pnpm sim --user +57300…`: muestra botones/listas como opciones numeradas, permite adjuntar archivos locales (`/adjuntar ruta.jpg`), escribe los documentos generados en `out/` | **Criterio de aceptación de la fase** (abajo) |
| 0.14 | Panel: esqueleto + **Formatos y variables** | Next.js + Supabase Auth; Entidades › Formatos: subir DOCX, detectar etiquetas, crear variables de entidad, vista previa, activar versión | Subo el DOCX de HRNO, el panel lista etiquetas, creo una variable `var.*` y la vista previa la muestra |

### 5.2 Criterio de aceptación de la Fase 0

1. `supabase start && pnpm db:reset && pnpm sim` con el contratista sintético.
2. Registro 5–6 notas y 3 fotos, las asigno a obligaciones, apruebo textos, escribo `generar`.
3. Obtengo en `out/` para el **periodo completo** y el **prorrateado**: Informe de Actividades (DOCX+PDF), Borrador de Informe de Supervisión (DOCX+PDF), ANTECEDENTES.pdf, AFILIACIONES.pdf, planilla PDF y ZIP con la estructura de carpetas.
4. Valores, letras, porcentajes y balance correctos según tus respuestas a las preguntas 3 y 4.
5. Tú comparas lado a lado con los originales de HRNO y apruebas.

### 5.3 Lo que te pediré probar manualmente al cierre

- Abrir los DOCX en Word y en el celular (WhatsApp → visor) y verificar encabezado repetido, tablas y evidencias.
- Revisar valores en letras de 3–4 casos reales que conozcas.
- Confirmar la estructura del ZIP contra lo que carga HRNO.

### 5.4 Riesgos de la Fase 0

| Riesgo | Mitigación |
|--------|-----------|
| Fidelidad visual DOCX→PDF (fuentes, saltos de página) | Fuentes métricamente compatibles en la imagen; plantillas con estilos simples; revisión visual temprana (tarea 0.9 antes de 0.11) |
| Solo hay PDF de HRNO, no DOCX | Reconstrucción manual; más tiempo en 0.9 |
| Convenciones de prorrateo/balance ambiguas | Fórmulas configurables + tus respuestas 3 y 4 + golden con un caso real |
| HEIC en sharp (binarios precompilados sin HEVC) | libvips con libheif en el Docker, o `heic-convert` como respaldo |

---

## 6. Fases siguientes (ajustadas con las respuestas)

- **Fase 1** – MVP WhatsApp HRNO sin cobro: webhook + colas reales, **multi-contrato (incluso de entidades distintas)**, onboarding con contrato cargado desde el panel, notas (texto/foto/audio), soportes con clasificación, checklist, recordatorios con plantillas, redacción IA + aprobación, entrega por WhatsApp. Evaluación STT. **Recursos pagados: Meta, Supabase Pro, Railway, Anthropic, STT → te pido autorización antes.**
- **Fase 2** – Extracción de contrato en auto-registro, extracción de planillas/certificados, validaciones 8.5, firma escaneada.
- **Fase 3** – Wompi (sandbox), planes, suspensión, panel de pagos y costos, bandeja de soporte, legal publicado.
- **Fase 4** – Entidades sin plantilla, Drive, correo al supervisor, portal de solo lectura, rol Entidad.

## 7. Lo que necesitaré de ti (sección 17) — cuándo

| Ítem | Necesario para |
|------|----------------|
| PDFs/DOCX anonimizados de HRNO | **Fase 0** (tarea 0.9) |
| Meta Business verificado, app, número, token permanente | Inicio de Fase 1 (la verificación puede tardar semanas: conviene empezar ya) |
| Proyecto Supabase Pro y cuenta Railway | Inicio de Fase 1 |
| API keys Anthropic y OpenAI (STT) | Inicio de Fase 1 |
| Dominio y página de política de datos | Antes del primer piloto (Fase 1) |
| Wompi sandbox | Fase 3 |
| Revisión legal, nombre comercial y precio | Antes de cobrar (Fase 3) |
