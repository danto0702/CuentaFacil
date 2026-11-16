# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary users (confirmed by the owner, 2026-11-16):** the owner (superadmin) and a few PascalIA operators. They run the CuentaFacil service from a computer: they configure entities and their formats, look after contractors and their cuentas de cobro, and step in when a WhatsApp conversation needs a person.
- **Not panel users:** contratistas use CuentaFacil only through WhatsApp (the assistant is called Pascal). Staff of the contracting entities do not enter the panel.

## Product Purpose

CuentaFacil (by PascalIA) accompanies contratistas de prestación de servicios of Colombian public entities over WhatsApp so they can prepare their monthly cuenta de cobro: activities and evidence, supporting documents, the Informe de Actividades, the draft Informe de Supervisión and the PDF packages to sign and upload to SECOP II.

The panel (`apps/panel`) is the internal back office of that service. It succeeds when a small team can keep every entity's formats correct and every cuenta moving to "delivered" without the contratista needing anything outside WhatsApp.

## Positioning

Each entity's own formats, variables and rules are configured once and then reused for every contratista of that entity; the service is multi-entity by design and a contratista can hold contracts with several entities. The contratista is responsible for what they sign: the system organizes, calculates, drafts and validates, never invents activities, and always asks for approval before final documents.

## Operating Context

- Three moments of the service: contract configuration (SECOP contract + clausulado), daily activity reporting, and closing the cuenta (supports, review in the chat, ZIP). See `docs/PLAN_V5.md`.
- Operators work with entity formats as DOCX templates with tags (`docs/TEMPLATE_TAGS.md`), upload new versions and preview the result.
- Cuentas move through states: scheduled, collecting, ready to draft, draft review, approved, generating, delivered, blocked by payment.
- Pilot entity: ESE Hospital Regional Noroccidental (HRNO), Ábrego, Norte de Santander.
- Without Supabase credentials the panel runs in demo mode with synthetic data.

## Capabilities and Constraints

- Scope of this file: the panel only (confirmed 2026-11-16). The public landing lives in the `pascalia-web` repository; `web/` in this repo is not a design target.
- Stack: Next.js App Router (`next build --webpack`, ADR-017), React 19, Supabase Auth, plain CSS in `apps/panel/app/globals.css`.
- Roles: `superadmin` and `operador` (table `staff_members`); a signed-in user without a role sees "Sin acceso".
- Existing sections: Inicio (counts and cuentas by state), Entidades y formatos (format upload and preview), Contratistas, Cuentas, Catálogo de etiquetas, Login.
- Planned, not built (`docs/PLAN_V5.md`): Pagos › Generar código (cash payment codes), Bandeja for human attention, Entidades › Base de contratos (monthly Excel upload), payments and metrics panel. Phases must not be advanced without the owner's approval.
- Money is COP as integers. Sensitive data is encrypted and shown only as last four digits; no personal data in logs. Real entity documents never enter the repository.
- Prices: $15.000 per contract configuration and $50.000 per informe.
- Code, tables and comments in English; everything a person sees in Spanish from Colombia.

## Brand Commitments

Same commitments as CuentaFacil on pascalia.lat (confirmed 2026-11-16):

- Name **CuentaFacil**, a service of **PascalIA**; the WhatsApp assistant is **Pascal**. "CuentasBot" is only an internal code name and is never shown.
- CuentaFacil keeps its own identity as a sub-brand: green, with the calendar-with-check logo (assets in `pascalia-web/cuentafacil/`).
- Voice: Spanish from Colombia, cordial, using tú.
- Binding principle: AI assists, people decide. Nothing is presented as final without human approval.

## Evidence on Hand

- Synthetic demo data in the panel's demo mode and synthetic fixtures in tests. No real contractor data, client names, usage figures or testimonials may be shown or fabricated.
- HRNO formats (Informe de Actividades, Informe de Supervisión MA-GH-IS-03 v4.0) exist as generated templates; the originals stay in the ignored `fixtures/private/`.

## Product Principles

1. The contratista never needs the panel: everything they do happens in WhatsApp, and the panel exists to make that possible.
2. Configure once per entity, reuse for every cuenta.
3. AI assists, people decide: drafts and extractions always end in human review and approval.
4. Show only what exists: no invented activities, figures or states.
5. Protect personal data by default: masked values, no sensitive data in logs or screens that do not need it.
