-- Minimal stand-ins for what Supabase provides, so migrations and RLS can be tested on plain Postgres.
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
end $$;

create schema if not exists auth;
create table if not exists auth.users (id uuid primary key, email text);
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;
grant usage on schema auth to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated;
grant usage on schema public to anon, authenticated, service_role;

-- Minimal pgmq stand-in for plain Postgres (the real extension exists on Supabase).
do $$
begin
  if not exists (select 1 from pg_available_extensions where name = 'pgmq') then
    create schema if not exists pgmq;
    create table if not exists pgmq.stub_messages (
      queue text not null, msg_id bigint generated always as identity primary key, read_ct int not null default 0,
      enqueued_at timestamptz not null default now(), vt timestamptz not null default now(), message jsonb not null,
      archived boolean not null default false
    );
    create or replace function pgmq.send(queue_name text, msg jsonb, delay int default 0) returns setof bigint
    language sql as $f$
      insert into pgmq.stub_messages (queue, message, vt) values (queue_name, msg, now() + make_interval(secs => delay))
      returning msg_id;
    $f$;
    create or replace function pgmq.read(queue_name text, vt int, qty int)
    returns table (msg_id bigint, read_ct int, enqueued_at timestamptz, vt timestamptz, message jsonb)
    language sql as $f$
      update pgmq.stub_messages m set read_ct = m.read_ct + 1, vt = now() + make_interval(secs => read.vt)
      where m.msg_id in (
        select s.msg_id from pgmq.stub_messages s
        where s.queue = queue_name and not s.archived and s.vt <= now() order by s.msg_id limit qty
      )
      returning m.msg_id, m.read_ct, m.enqueued_at, m.vt, m.message;
    $f$;
    create or replace function pgmq.delete(queue_name text, id bigint) returns boolean
    language sql as $f$
      with d as (delete from pgmq.stub_messages where queue = queue_name and msg_id = id returning 1)
      select exists (select 1 from d);
    $f$;
    create or replace function pgmq.archive(queue_name text, id bigint) returns boolean
    language sql as $f$
      with a as (update pgmq.stub_messages set archived = true where queue = queue_name and msg_id = id returning 1)
      select exists (select 1 from a);
    $f$;
  end if;
end $$;
