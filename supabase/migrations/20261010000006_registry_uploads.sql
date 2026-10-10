-- Registry files are uploaded to the private bucket `registry`, folder = entity id; the worker parses them.
alter table registry_imports add column storage_path text unique;

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'storage' and table_name = 'buckets') then
    insert into storage.buckets (id, name, public) values ('registry', 'registry', false)
    on conflict (id) do nothing;
  else
    raise notice 'storage schema not available: bucket registry skipped';
  end if;
end $$;
