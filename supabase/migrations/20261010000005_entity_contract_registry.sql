-- Entity contract registry (ADR-029): public SECOP II contract data uploaded monthly per entity, used to
-- prefill contract setup (start date from the "acta de inicio"). The contractor's document is stored only
-- as a blind index and the name encrypted, both computed by the worker (it holds the keys).

create table entity_contract_registry (
  id                   uuid primary key default gen_random_uuid(),
  entity_id            uuid not null references entities(id) on delete cascade,
  -- Contract code without leading zeros ("0330" -> "330") so "CPS-0330-2026" and "330" match.
  contract_code        text not null,
  contractor_doc_bidx  text not null,
  contractor_name_enc  text,
  initial_value        numeric(14, 2),
  term_days            int,
  registered_on        date,
  start_date           date,
  import_id            bigint,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (entity_id, contract_code, contractor_doc_bidx)
);

-- Each upload of the registry file. The panel (or an operator) inserts the parsed rows here; the worker
-- turns them into registry entries and then clears `rows`, so plain documents and names do not stay.
create table registry_imports (
  id            bigint generated always as identity primary key,
  entity_id     uuid not null references entities(id) on delete cascade,
  filename      text not null,
  rows          jsonb,
  row_count     int not null default 0,
  status        text not null default 'pending' check (status in ('pending', 'processed', 'failed')),
  inserted      int,
  updated       int,
  error         text,
  created_by    uuid references auth.users(id),
  created_at    timestamptz not null default now(),
  processed_at  timestamptz
);

alter table entity_contract_registry
  add constraint entity_contract_registry_import_fk foreign key (import_id) references registry_imports(id) on delete set null;

create trigger entity_contract_registry_updated before update on entity_contract_registry
  for each row execute function set_updated_at();

alter table entity_contract_registry enable row level security;
alter table registry_imports enable row level security;
revoke all on entity_contract_registry, registry_imports from anon;
create policy superadmin_all on entity_contract_registry for all to authenticated
  using (is_superadmin()) with check (is_superadmin());
create policy staff_read on entity_contract_registry for select to authenticated using (is_staff());
create policy superadmin_all on registry_imports for all to authenticated
  using (is_superadmin()) with check (is_superadmin());
create policy staff_read on registry_imports for select to authenticated using (is_staff());
