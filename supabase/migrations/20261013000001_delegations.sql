-- Gestor (ADR-042): one WhatsApp number preparing the accounts of other people. Each person authorizes
-- it from their own WhatsApp (the answer also records their consent to the data policy and terms).
create table delegations (
  id            uuid primary key default gen_random_uuid(),
  manager_id    uuid not null references users(id) on delete cascade,
  -- Null until the person accepts (they may not be registered yet).
  person_id     uuid references users(id) on delete cascade,
  person_name   text not null,
  person_phone  text not null,
  status        text not null default 'pending' check (status in ('pending', 'active', 'declined', 'revoked')),
  answer_wamid  text,
  created_at    timestamptz not null default now(),
  answered_at   timestamptz
);
-- One live request per gestor and number.
create unique index delegations_live on delegations (manager_id, person_phone) where status in ('pending', 'active');
create index delegations_person on delegations (person_id) where status = 'active';
create index delegations_phone on delegations (person_phone) where status = 'pending';

alter table delegations enable row level security;
revoke all on delegations from anon;
create policy superadmin_all on delegations for all to authenticated using (is_superadmin()) with check (is_superadmin());
create policy staff_read on delegations for select to authenticated using (is_staff());
