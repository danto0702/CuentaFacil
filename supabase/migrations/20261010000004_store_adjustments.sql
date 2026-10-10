-- Adjustments for the Supabase-backed conversation Store (Phase 1a).

-- Supports: the conversation identifies them by support-type code (entity-agnostic) and keeps the file name.
alter table supports add column code text;
alter table supports add column filename text;
-- The same file can legitimately arrive twice (e.g. re-sent for another account); dedupe happens in the app.
alter table supports drop constraint if exists supports_user_id_sha256_key;
create index supports_user_code on supports (user_id, code);

-- Drafts: 'default' = the entity's default text was used ("Actividad cumplida.").
alter table drafts drop constraint if exists drafts_status_check;
alter table drafts add constraint drafts_status_check
  check (status in ('pending', 'needs_input', 'proposed', 'approved', 'not_applicable', 'default'));

-- Contracts (plan v5): label for buttons, writing style copied from a previous report, certification flag.
alter table contracts add column short_label text;
alter table contracts add column style jsonb not null default '{}'::jsonb;
alter table contracts add column requires_certification boolean not null default false;
