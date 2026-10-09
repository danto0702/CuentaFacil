-- Queues (pgmq), scheduled jobs (pg_cron) and private Storage buckets.
-- Guarded so the schema can also be tested on plain Postgres (supabase/tests/run.sh).

do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pgmq') then
    create extension if not exists pgmq;
    perform pgmq.create('inbound');
    perform pgmq.create('jobs');
    perform pgmq.create('outbound');
  else
    raise notice 'pgmq not available: queues skipped';
  end if;
end $$;

do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    -- Jobs are registered in Phase 1 (period opening, reminders, retention purge).
  else
    raise notice 'pg_cron not available: scheduled jobs skipped';
  end if;
end $$;

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'storage' and table_name = 'buckets') then
    insert into storage.buckets (id, name, public)
    values
      ('contracts', 'contracts', false),
      ('supports', 'supports', false),
      ('evidences', 'evidences', false),
      ('templates', 'templates', false),
      ('outputs', 'outputs', false)
    on conflict (id) do nothing;
  else
    raise notice 'storage schema not available: buckets skipped';
  end if;
end $$;
