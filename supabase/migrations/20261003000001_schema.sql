-- CuentasBot — initial schema.
-- Amounts in COP as bigint (integer pesos). Sensitive columns (*_enc) hold AES-256-GCM ciphertext produced by
-- the application (ADR-005); *_bidx hold HMAC blind indexes; *_last4 keep the masked suffix.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type staff_role as enum ('superadmin', 'operator');
create type user_status as enum ('onboarding', 'pending_templates', 'active', 'suspended', 'deleted');
create type contract_status as enum ('draft', 'active', 'finished', 'terminated');
create type period_mode as enum ('month_end', 'date_to_date');
create type period_status as enum (
  'scheduled', 'collecting', 'ready_to_draft', 'draft_review',
  'approved', 'generating', 'delivered', 'blocked_payment'
);
create type obligation_kind as enum ('specific', 'general');
create type support_frequency as enum ('every_period', 'once', 'at_start');
create type support_status as enum ('received', 'extracted', 'confirmed', 'rejected', 'expired');
create type template_kind as enum ('activity_report', 'supervision_report', 'cover_letter', 'control_sheet');
create type template_status as enum ('draft', 'active', 'retired');
create type subscription_status as enum ('trial', 'active', 'past_due', 'suspended', 'canceled');
create type msg_direction as enum ('in', 'out');
create type ticket_status as enum ('open', 'in_progress', 'closed');
create type data_request_kind as enum ('access', 'rectification', 'deletion');
create type variable_type as enum ('text', 'long_text', 'number', 'money', 'date', 'boolean', 'select', 'image');
create type variable_scope as enum ('entity', 'contract', 'period', 'user');
create type variable_source as enum ('admin', 'ask_contractor', 'computed');
create type amount_source as enum ('schedule', 'certificate', 'contractor', 'computed');

create or replace function set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- Staff and global settings
-- ---------------------------------------------------------------------------
create table staff_members (
  auth_user_id uuid primary key references auth.users(id) on delete cascade,
  role         staff_role not null,
  full_name    text not null,
  created_at   timestamptz not null default now()
);

create table system_settings (
  key         text primary key,                 -- e.g. 'smmlv' → {"2025": 1423500, "2026": null}
  value       jsonb not null,
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Organizations and entities
-- ---------------------------------------------------------------------------
create table organizations (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  nit          text,
  billing_plan jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

create table entities (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  name            text not null,
  short_name      text not null unique,
  nit             text,
  municipality    text,
  department      text,
  logo_path       text,
  -- Validated by the app (EntitySettings): proration, PILA month rule, IBC rules, certificate validity,
  -- background-check date rule, balance formulas, meeting place/hours, package layout, fixed texts.
  settings        jsonb not null default '{}'::jsonb,
  status          text not null default 'active' check (status in ('active', 'pending_templates', 'inactive')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create trigger entities_updated before update on entities for each row execute function set_updated_at();

create table entity_variables (
  id             uuid primary key default gen_random_uuid(),
  entity_id      uuid not null references entities(id) on delete cascade,
  key            text not null check (key ~ '^[a-z][a-z0-9_]{1,62}$'),
  label          text not null,
  type           variable_type not null,
  scope          variable_scope not null,
  source         variable_source not null default 'admin',
  options        jsonb,
  expression     text,
  required       boolean not null default false,
  default_value  jsonb,
  prompt_text    text,
  created_at     timestamptz not null default now(),
  unique (entity_id, key)
);

create table entity_variable_values (
  variable_id    uuid not null references entity_variables(id) on delete cascade,
  scope_ref_id   uuid not null,
  value          jsonb not null,
  updated_by     text not null,
  updated_at     timestamptz not null default now(),
  primary key (variable_id, scope_ref_id)
);

create table templates (
  id               uuid primary key default gen_random_uuid(),
  entity_id        uuid not null references entities(id),
  kind             template_kind not null,
  contract_profile text,
  name             text not null,
  version          int not null,
  file_path        text not null,
  tags_used        text[] not null default '{}',
  unknown_tags     text[] not null default '{}',
  status           template_status not null default 'draft',
  created_by       uuid references auth.users(id),
  created_at       timestamptz not null default now(),
  unique (entity_id, kind, name, version),
  check (status <> 'active' or cardinality(unknown_tags) = 0)
);

create table support_types (
  id              uuid primary key default gen_random_uuid(),
  entity_id       uuid not null references entities(id) on delete cascade,
  code            text not null,
  label           text not null,
  required        boolean not null default true,
  frequency       support_frequency not null default 'every_period',
  max_age_days    int,
  bundle          text,
  bundle_order    int,
  official_url    text,
  instructions    text,
  profiles        text[],                          -- null = every contract profile of the entity
  unique (entity_id, code)
);

create table policy_versions (
  id           uuid primary key default gen_random_uuid(),
  kind         text not null check (kind in ('privacy_policy', 'terms')),
  version      text not null,
  url          text not null,
  published_at timestamptz not null default now(),
  unique (kind, version)
);

-- ---------------------------------------------------------------------------
-- Contractors
-- ---------------------------------------------------------------------------
create table users (
  id                    uuid primary key default gen_random_uuid(),
  auth_user_id          uuid unique references auth.users(id),
  phone_e164            text not null unique check (phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  full_name             text,
  doc_type              text check (doc_type in ('CC', 'CE', 'PPT', 'PA')),
  doc_number_enc        text,
  doc_number_bidx       text,
  doc_number_last4      text,
  doc_issued_in         text,
  tax_regime            text check (tax_regime in ('simplificado', 'comun')),
  bank_name             text,
  bank_account_type     text check (bank_account_type in ('ahorros', 'corriente', 'deposito_electronico')),
  bank_account_enc      text,
  bank_account_last4    text,
  signature_path_enc    text,
  signature_consent_at  timestamptz,
  has_arl               boolean not null default true,
  status                user_status not null default 'onboarding',
  reminders_opt_out     boolean not null default false,
  daily_reminder_time   time,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  deleted_at            timestamptz
);
create index users_doc_bidx on users (doc_number_bidx);
create trigger users_updated before update on users for each row execute function set_updated_at();

create table consents (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references users(id),
  phone_e164        text not null,
  policy_version_id uuid not null references policy_versions(id),
  accepted          boolean not null,
  channel           text not null default 'whatsapp',
  evidence_wamid    text,
  created_at        timestamptz not null default now()
);

create table data_requests (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references users(id),
  kind         data_request_kind not null,
  status       text not null default 'open' check (status in ('open', 'done', 'rejected')),
  due_at       timestamptz not null,
  resolved_at  timestamptz,
  notes        text,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Contracts
-- ---------------------------------------------------------------------------
create table contracts (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references users(id),
  entity_id           uuid not null references entities(id),
  number              text not null,
  number_full         text,
  secop_code          text,
  object_text         text not null,
  process_area        text,
  contract_profile    text,
  start_date          date not null,
  end_date            date not null,
  term_text           text,
  total_value         bigint not null check (total_value > 0),
  monthly_value       bigint not null check (monthly_value > 0),
  payments_count      int not null check (payments_count > 0),
  report_number_fmt   text not null default 'NN DE NN' check (report_number_fmt in ('NN DE NN', 'NN-NN')),
  period_mode         period_mode not null default 'month_end',
  period_mode_set_at  timestamptz,
  supervisor_name     text,
  supervisor_title    text,
  spending_officer    text,
  status              contract_status not null default 'draft',
  contract_pdf_path   text,
  clauses_pdf_path    text,
  extracted           jsonb,
  confirmed_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (entity_id, number_full),
  check (end_date >= start_date)
);
create index contracts_user on contracts (user_id);
create trigger contracts_updated before update on contracts for each row execute function set_updated_at();

create table contract_amendments (
  id            uuid primary key default gen_random_uuid(),
  contract_id   uuid not null references contracts(id) on delete cascade,
  kind          text not null check (kind in ('addition', 'extension', 'addition_extension', 'suspension')),
  signed_on     date not null,
  added_value   bigint not null default 0,
  new_end_date  date,
  notes         text
);

create table contract_templates (
  contract_id  uuid not null references contracts(id) on delete cascade,
  kind         template_kind not null,
  template_id  uuid not null references templates(id),
  primary key (contract_id, kind)
);

create table reminder_rules (
  id              uuid primary key default gen_random_uuid(),
  entity_id       uuid not null references entities(id) on delete cascade,
  contract_id     uuid references contracts(id) on delete cascade,
  trigger_kind    text not null check (trigger_kind in ('day_of_month', 'days_before_period_end', 'period_end', 'days_before_contract_end')),
  trigger_value   int not null default 0,
  support_code    text,
  action          text,
  wa_template     text not null,
  send_at_local   time not null default '08:00',
  active          boolean not null default true
);

create table payment_schedule (
  id             uuid primary key default gen_random_uuid(),
  contract_id    uuid not null references contracts(id) on delete cascade,
  payment_number int not null check (payment_number > 0),
  days           int,
  months         int,
  amount         bigint not null check (amount >= 0),
  source         text not null default 'clauses' check (source in ('clauses', 'computed', 'contractor')),
  unique (contract_id, payment_number)
);

create table payment_schedule_items (
  id             uuid primary key default gen_random_uuid(),
  schedule_id    uuid not null references payment_schedule(id) on delete cascade,
  concept        text not null,
  amount         bigint not null check (amount >= 0),
  counts_for_ibc boolean not null default true
);

create table obligation_groups (
  id           uuid primary key default gen_random_uuid(),
  contract_id  uuid not null references contracts(id) on delete cascade,
  number       int not null,
  name         text not null,
  weight_pct   numeric(5,2),
  unique (contract_id, number)
);

create table obligation_goals (
  id              uuid primary key default gen_random_uuid(),
  group_id        uuid not null references obligation_groups(id) on delete cascade,
  indicator       text not null,
  unit            text not null default 'count' check (unit in ('count', 'percent')),
  total_target    numeric,
  monthly_targets numeric[] not null default '{}'
);

create table obligations (
  id                 uuid primary key default gen_random_uuid(),
  contract_id        uuid not null references contracts(id) on delete cascade,
  kind               obligation_kind not null,
  group_id           uuid references obligation_groups(id),
  number             int not null,
  literal_text       text not null,
  default_text       text not null default 'Actividad cumplida.',
  requires_evidence  boolean not null default false,
  unique (contract_id, kind, number)
);

create table contractor_duties (                -- "obligaciones del contratista" rated in the supervision report
  id           uuid primary key default gen_random_uuid(),
  contract_id  uuid not null references contracts(id) on delete cascade,
  number       int not null,
  text         text not null,
  unique (contract_id, number)
);

create table periods (
  id                  uuid primary key default gen_random_uuid(),
  contract_id         uuid not null references contracts(id) on delete cascade,
  report_number       int not null,
  payment_number      int not null,
  date_from           date not null,
  date_to             date not null,
  amount              bigint not null check (amount >= 0),
  amount_source       amount_source not null default 'schedule',
  execution_pct       numeric(5,2) not null default 100,
  status              period_status not null default 'scheduled',
  report_date         date,
  closed_at           timestamptz,
  delivered_at        timestamptz,
  forced_with_missing boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (contract_id, report_number),
  check (date_to >= date_from)
);
create index periods_status on periods (status, date_to);
create trigger periods_updated before update on periods for each row execute function set_updated_at();

create table period_payments (
  id         uuid primary key default gen_random_uuid(),
  period_id  uuid not null references periods(id) on delete cascade,
  voucher    text,
  paid_on    date,
  amount     bigint not null check (amount >= 0),
  created_at timestamptz not null default now()
);

create table goal_progress (
  goal_id      uuid not null references obligation_goals(id) on delete cascade,
  period_id    uuid not null references periods(id) on delete cascade,
  achieved     numeric not null,
  reported_by  text not null,
  primary key (goal_id, period_id)
);

-- ---------------------------------------------------------------------------
-- Supports, social security, notes, evidences, drafts, documents
-- ---------------------------------------------------------------------------
create table supports (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references users(id),
  period_id        uuid references periods(id),
  support_type_id  uuid references support_types(id),
  original_path    text not null,
  normalized_path  text,
  mime_type        text,
  sha256           text not null,
  issued_on        date,
  valid_until      date,
  holder_name      text,
  holder_doc_bidx  text,
  coverage_from    date,
  coverage_to      date,
  status           support_status not null default 'received',
  rejection_reason text,
  extracted        jsonb,
  created_at       timestamptz not null default now(),
  unique (user_id, sha256)
);

create table social_security_payments (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references users(id),
  operator           text,
  sheet_number       text,
  auth_code          text,
  paid_on            date,
  contribution_month date,
  ibc                bigint,
  health_entity      text,
  health_value       bigint,
  pension_entity     text,
  pension_value      bigint,
  fsp_value          bigint,
  arl_entity         text,
  arl_value          bigint,
  arl_risk_class     int check (arl_risk_class between 1 and 5),
  afc_value          bigint,
  total_value        bigint,
  bank               text,
  support_id         uuid references supports(id),
  extracted          jsonb,
  confirmed_at       timestamptz,
  created_at         timestamptz not null default now()
);

create table period_social_security (
  period_id  uuid not null references periods(id) on delete cascade,
  ssp_id     uuid not null references social_security_payments(id) on delete cascade,
  primary key (period_id, ssp_id)
);

create table activity_notes (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references users(id),
  contract_id              uuid references contracts(id),
  activity_date            date not null,
  text                     text,
  transcript               text,
  audio_path               text,
  source_wamids            text[] not null default '{}',
  suggested_obligation_id  uuid references obligations(id),
  confirmed_obligation_id  uuid references obligations(id),
  confidence               numeric(4,3),
  created_at               timestamptz not null default now()
);
create index activity_notes_contract on activity_notes (contract_id, activity_date);

create table evidences (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references users(id),
  note_id        uuid references activity_notes(id) on delete set null,
  period_id      uuid references periods(id),
  obligation_id  uuid references obligations(id),
  file_path      text not null,
  caption        text,
  taken_on       date,
  sort_order     int not null default 0,
  included       boolean not null default true,
  created_at     timestamptz not null default now()
);

create table drafts (
  id              uuid primary key default gen_random_uuid(),
  period_id       uuid not null references periods(id) on delete cascade,
  obligation_id   uuid not null references obligations(id),
  version         int not null default 1,
  ai_text         text,
  user_text       text,
  final_text      text,
  status          text not null default 'pending' check (status in ('pending', 'needs_input', 'proposed', 'approved', 'not_applicable')),
  source_note_ids uuid[] not null default '{}',
  approved_at     timestamptz,
  unique (period_id, obligation_id, version)
);

create table generated_documents (
  id            uuid primary key default gen_random_uuid(),
  period_id     uuid not null references periods(id),
  kind          text not null,
  version       int not null,
  template_id   uuid references templates(id),
  docx_path     text,
  pdf_path      text,
  sha256        text not null,
  size_bytes    bigint,
  generated_by  text not null,
  created_at    timestamptz not null default now(),
  unique (period_id, kind, version)
);

-- ---------------------------------------------------------------------------
-- Billing (Phase 3; created now to keep the model stable)
-- ---------------------------------------------------------------------------
create table plans (
  id                          uuid primary key default gen_random_uuid(),
  name                        text not null,
  monthly_price               bigint not null,
  multi_contract_discount_pct numeric(5,2) not null default 0,
  trial_days                  int not null default 0,
  trial_periods               int not null default 1,
  active                      boolean not null default true
);

create table subscriptions (
  id              uuid primary key default gen_random_uuid(),
  contract_id     uuid not null unique references contracts(id),
  plan_id         uuid not null references plans(id),
  status          subscription_status not null default 'trial',
  paid_through    date,
  grace_until     date,
  created_at      timestamptz not null default now()
);

create table payments (
  id                 uuid primary key default gen_random_uuid(),
  subscription_id    uuid not null references subscriptions(id),
  amount             bigint not null,
  currency           text not null default 'COP',
  wompi_reference    text unique,
  wompi_transaction  text unique,
  status             text not null,
  covers_month       date,
  raw                jsonb,
  created_at         timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Messaging, conversation state, idempotency
-- ---------------------------------------------------------------------------
create table wa_inbound (
  wamid        text primary key,
  phone_e164   text not null,
  received_at  timestamptz not null default now(),
  payload      jsonb not null,
  processed_at timestamptz
);

create table conversations (
  user_id          uuid primary key references users(id) on delete cascade,
  flow             text not null default 'idle',
  step             text not null default 'start',
  context          jsonb not null default '{}'::jsonb,
  last_inbound_at  timestamptz,
  expires_at       timestamptz,
  updated_at       timestamptz not null default now()
);

create table messages (
  id          bigint generated always as identity primary key,
  user_id     uuid references users(id) on delete cascade,
  direction   msg_direction not null,
  wamid       text,
  msg_type    text not null,
  summary     text,
  status      text,
  created_at  timestamptz not null default now()
);
create index messages_user on messages (user_id, created_at desc);

create table outbound_messages (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references users(id) on delete cascade,
  idempotency_key  text not null unique,
  kind             text not null check (kind in ('free', 'template')),
  payload          jsonb not null,
  status           text not null default 'queued' check (status in ('queued', 'sent', 'delivered', 'read', 'failed', 'dropped')),
  wamid            text unique,
  attempts         int not null default 0,
  last_error       text,
  pricing_category text,
  created_at       timestamptz not null default now(),
  sent_at          timestamptz
);

create table webhook_events (
  provider     text not null,
  external_id  text not null,
  payload      jsonb not null,
  received_at  timestamptz not null default now(),
  primary key (provider, external_id)
);

create table support_tickets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id),
  subject     text not null,
  status      ticket_status not null default 'open',
  assigned_to uuid references auth.users(id),
  created_at  timestamptz not null default now(),
  closed_at   timestamptz
);

-- ---------------------------------------------------------------------------
-- Observability
-- ---------------------------------------------------------------------------
create table ai_usage (
  id                 bigint generated always as identity primary key,
  user_id            uuid references users(id) on delete set null,
  period_id          uuid references periods(id) on delete set null,
  purpose            text not null,
  prompt_version     text not null,
  model              text not null,
  input_tokens       int not null,
  cache_read_tokens  int not null default 0,
  cache_write_tokens int not null default 0,
  output_tokens      int not null,
  cost_usd_micros    bigint not null,
  created_at         timestamptz not null default now()
);

create table events (
  id          bigint generated always as identity primary key,
  actor       text not null,
  action      text not null,
  subject     text,
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create or replace function forbid_mutation() returns trigger language plpgsql as $$
begin
  raise exception 'events is append-only';
end $$;
create trigger events_append_only before update or delete on events for each row execute function forbid_mutation();

create table job_failures (
  id          bigint generated always as identity primary key,
  queue       text not null,
  msg_id      bigint,
  payload     jsonb not null,
  error       text not null,
  attempts    int not null,
  retried_at  timestamptz,
  created_at  timestamptz not null default now()
);
