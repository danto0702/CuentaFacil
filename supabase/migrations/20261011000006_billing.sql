-- Billing (ADR-034): configuration $15.000 and each report $50.000 (terms, sections 5 and 6), paid online
-- with Wompi or with a cash code; Aliados' free reports are used first. While system_settings.billing.mode
-- is 'pilot' nothing is charged and delivered reports are marked periods.charge = 'pilot'.

create table charges (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references users(id),
  product       text not null check (product in ('setup', 'report')),
  contract_id   uuid not null references contracts(id) on delete cascade,
  period_id     uuid references periods(id) on delete cascade,
  -- A report charge can also cover the contract's configuration when it is still unpaid.
  covers_setup  boolean not null default false,
  amount        bigint not null check (amount >= 0),
  status        text not null default 'pending' check (status in ('pending', 'paid', 'free', 'pilot', 'cancelled')),
  method        text check (method in ('wompi', 'cash_code', 'free_grant', 'pilot')),
  -- Our reference sent to Wompi (unique) and Wompi's transaction id once paid.
  reference     text not null unique,
  provider_tx   text unique,
  raw           jsonb,
  created_at    timestamptz not null default now(),
  settled_at    timestamptz,
  check ((product = 'report') = (period_id is not null))
);
-- One live charge per product, contract and period.
create unique index charges_one_open on charges (product, contract_id, coalesce(period_id, '00000000-0000-0000-0000-000000000000'::uuid))
  where status <> 'cancelled';
create index charges_user on charges (user_id, created_at desc);

-- Cash codes: the contractor pays in cash and gets a code tied to their account, for one service,
-- valid 30 days (terms, section 6).
create table cash_codes (
  id              uuid primary key default gen_random_uuid(),
  code            text not null unique,
  user_id         uuid not null references users(id),
  product         text not null check (product in ('setup', 'report')),
  amount          bigint not null check (amount > 0),
  created_by      uuid references auth.users(id),
  created_at      timestamptz not null default now(),
  expires_at      timestamptz not null default (now() + interval '30 days'),
  used_at         timestamptz,
  used_charge_id  uuid references charges(id)
);

alter table free_report_grants add column used_charge_id uuid references charges(id);

alter table charges enable row level security;
alter table cash_codes enable row level security;
revoke all on charges, cash_codes from anon;
create policy superadmin_all on charges for all to authenticated using (is_superadmin()) with check (is_superadmin());
create policy staff_read on charges for select to authenticated using (is_staff());
create policy superadmin_all on cash_codes for all to authenticated using (is_superadmin()) with check (is_superadmin());
create policy staff_read on cash_codes for select to authenticated using (is_staff());

insert into system_settings (key, value) values
  ('billing', '{"mode": "pilot", "prices": {"setup": 15000, "report": 50000}}')
on conflict (key) do nothing;
