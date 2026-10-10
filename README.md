# CuentaFacil de PascalIA

> Servicio: **CuentaFacil** (de la empresa **PascalIA**). El asistente de WhatsApp se llama **Pascal**. "CuentasBot" es el nombre interno del código (paquetes `@cuentasbot/*`).

Asistente de WhatsApp que acompaña a contratistas de prestación de servicios de entidades públicas colombianas para preparar cada mes su cuenta de cobro: registro de actividades y evidencias, recordatorios de soportes, y generación del Informe de Actividades, el borrador del Informe de Supervisión y los paquetes PDF listos para firmar y cargar en SECOP II.

**Estado:** Fase 0 (base, sin WhatsApp real) terminada — ver [`docs/FASE0_CIERRE.md`](docs/FASE0_CIERRE.md).

## Estructura

```
apps/
  worker/       generador de cuentas (plantillas → DOCX/PDF, paquetes, ZIP); en Fase 1, consumidores de colas
  simulator/    chat de WhatsApp por terminal con el mismo orquestador y generador
  panel/        panel web (Next.js + Supabase Auth): entidades, formatos y variables, contratistas, cuentas
packages/
  shared/       dominio: montos en letras, fechas, periodos y cortes, calendario de pagos, IBC, balance
  docgen/       motor de plantillas DOCX, catálogo de etiquetas, formatos HRNO, LibreOffice, PDF y ZIP
  conversation/ orquestador de conversación (máquina de estados), puertos, IA/STT simuladas, datos demo
supabase/       migraciones, RLS, seed de HRNO y pruebas de base de datos
docs/           plan, decisiones (ADR), catálogo de etiquetas, plantillas de WhatsApp, borradores legales
```

## Requisitos

- Node 22 y pnpm 10 (`corepack enable`).
- LibreOffice Writer y poppler para generar y probar PDF:
  `sudo apt-get install libreoffice-writer-nogui fonts-liberation poppler-utils`
- PostgreSQL 16 (binarios del servidor) para las pruebas de base de datos.

## Comandos

| Comando | Qué hace |
|---------|----------|
| `pnpm install` | Instala dependencias |
| `pnpm lint` | Lint y formato (Biome) |
| `pnpm -r typecheck` | Verificación de tipos de todos los paquetes |
| `pnpm -r --workspace-concurrency=1 test` | Pruebas unitarias, conversaciones grabadas, golden y de punta a punta |
| `pnpm db:test` | Migraciones + seed + pruebas de RLS en un Postgres temporal (sin Docker) |
| `pnpm sim` | Simulador de WhatsApp interactivo (`pnpm sim -- --fecha 2026-08-31 --reset`) |
| `pnpm sim:demo` | Guiones de aceptación: periodo completo y periodo prorrateado |
| `pnpm panel` | Panel en http://localhost:3000 (modo demo sin credenciales de Supabase) |
| `pnpm tags:doc` | Regenera `docs/TEMPLATE_TAGS.md` desde el catálogo |
| `pnpm --filter @cuentasbot/docgen templates` | Genera las plantillas HRNO en `packages/docgen/out` |

Los documentos generados por el simulador quedan en `apps/simulator/out/<fecha>/`.

Para generar con los formatos originales de la entidad (logos, estilos), sin subirlos al repo:

```
pnpm sim -- --base-activity fixtures/private/hrno/PLANTILLA_Informe_Actividades_HRNO.docx \
            --base-supervision fixtures/private/hrno/PLANTILLA_Informe_Supervision_HRNO.docx
```

## Variables de entorno

Ver [`.env.example`](.env.example). En Fase 0 ninguna es obligatoria: sin `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` el panel corre en modo demo.

## Sitio web

`web/` contiene la landing estática de pascalia.lat (HTML + CSS, sin build). Para verla en local: `python3 -m http.server -d web 8000`. Se publica en GitHub Pages con cada push a `main` que toque `web/`.

## Documentos

- [`docs/PROMPT_INICIAL.md`](docs/PROMPT_INICIAL.md) — requisitos del dueño.
- [`docs/PLAN.md`](docs/PLAN.md) — arquitectura, costos y Fase 0.
- [`docs/PLAN_V5.md`](docs/PLAN_V5.md) — modelo de servicio (configuración, reporte, cierre, pagos, unión de cuentas) y fases siguientes.
- [`docs/DECISIONES.md`](docs/DECISIONES.md) — decisiones de arquitectura (ADR).
- [`docs/TEMPLATE_TAGS.md`](docs/TEMPLATE_TAGS.md) — catálogo de etiquetas para los formatos.
- [`docs/WHATSAPP_TEMPLATES.md`](docs/WHATSAPP_TEMPLATES.md) — plantillas de WhatsApp para registrar en Meta.
- [`docs/legal/politica_tratamiento.md`](docs/legal/politica_tratamiento.md) — versión 1.1 aprobada por el abogado, publicada en https://pascalia.lat/politica-de-datos/.
