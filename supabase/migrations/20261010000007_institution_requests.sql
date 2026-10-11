-- Contractors whose institution is not configured yet ("Otra" in WhatsApp) leave a request with a model
-- cuenta de cobro and their contract; the owner creates the entity from the panel. The first contractor
-- of a new institution gets their first report free (free_report_grants, consumed by billing; expire after 12 months).

create table institution_requests (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references users(id),
  institution_name       text not null,
  institution_key        text not null,              -- normalized name, to detect the first request
  model_support_id       uuid references supports(id),
  contract_support_id    uuid references supports(id),
  first_for_institution  boolean not null default false,
  status                 text not null default 'pending' check (status in ('pending', 'in_progress', 'done', 'rejected')),
  entity_id              uuid references entities(id),
  notes                  text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
create index institution_requests_key on institution_requests (institution_key);
create trigger institution_requests_updated before update on institution_requests
  for each row execute function set_updated_at();

alter table users add column free_reports int not null default 0 check (free_reports >= 0);

alter table institution_requests enable row level security;
revoke all on institution_requests from anon;
create policy superadmin_all on institution_requests for all to authenticated
  using (is_superadmin()) with check (is_superadmin());
create policy staff_read on institution_requests for select to authenticated using (is_staff());
create policy staff_update on institution_requests for update to authenticated
  using (is_staff()) with check (is_staff());

-- Panel access to Storage: staff read the request documents (supports) and the superadmin uploads
-- registry files. Contractor files are otherwise only touched by the worker (service_role).
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'storage' and table_name = 'objects') then
    execute $p$create policy panel_staff_read on storage.objects for select to authenticated
      using (bucket_id in ('supports', 'registry') and public.is_staff())$p$;
    execute $p$create policy panel_registry_write on storage.objects for insert to authenticated
      with check (bucket_id = 'registry' and public.is_superadmin())$p$;
    execute $p$create policy panel_registry_delete on storage.objects for delete to authenticated
      using (bucket_id = 'registry' and public.is_superadmin())$p$;
  else
    raise notice 'storage schema not available: storage policies skipped';
  end if;
end $$;
