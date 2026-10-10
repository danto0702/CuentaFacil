-- Webhook inbox and queue access for the worker (Phase 1a).
-- The wa-webhook Edge Function stores each raw POST (body + X-Hub-Signature-256) and enqueues it; the worker
-- verifies the signature with WA_APP_SECRET (kept only in Railway) before trusting the payload.

create table webhook_inbox (
  id            bigint generated always as identity primary key,
  provider      text not null check (provider in ('whatsapp', 'wompi')),
  signature     text,
  body          text not null,
  status        text not null default 'pending' check (status in ('pending', 'processed', 'rejected', 'failed')),
  error         text,
  received_at   timestamptz not null default now(),
  processed_at  timestamptz
);
create index webhook_inbox_pending on webhook_inbox (status, received_at) where status = 'pending';

alter table webhook_inbox enable row level security;
create policy superadmin_all on webhook_inbox for all to authenticated using (is_superadmin()) with check (is_superadmin());

-- Queue wrappers: pgmq lives in its own schema (not exposed by PostgREST); these are callable only by service_role.
create or replace function queue_send(queue text, message jsonb, delay_seconds int default 0) returns bigint
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  id bigint;
begin
  select * into id from pgmq.send(queue, message, delay_seconds);
  return id;
end $$;

create or replace function queue_read(queue text, visibility_seconds int, qty int)
returns table (msg_id bigint, read_ct int, enqueued_at timestamptz, message jsonb)
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  return query select r.msg_id, r.read_ct, r.enqueued_at, r.message from pgmq.read(queue, visibility_seconds, qty) r;
end $$;

create or replace function queue_delete(queue text, msg_id bigint) returns boolean
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  return pgmq.delete(queue, msg_id);
end $$;

create or replace function queue_archive(queue text, msg_id bigint) returns boolean
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  return pgmq.archive(queue, msg_id);
end $$;

-- One call from the Edge Function: store the raw request and enqueue its id.
create or replace function webhook_receive(p_provider text, p_signature text, p_body text) returns bigint
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  inbox_id bigint;
begin
  insert into webhook_inbox (provider, signature, body) values (p_provider, p_signature, p_body)
  returning id into inbox_id;
  perform queue_send('inbound', jsonb_build_object('inbox_id', inbox_id, 'provider', p_provider));
  return inbox_id;
end $$;

do $$
declare
  f text;
begin
  foreach f in array array[
    'queue_send(text, jsonb, int)', 'queue_read(text, int, int)', 'queue_delete(text, bigint)',
    'queue_archive(text, bigint)', 'webhook_receive(text, text, text)'
  ] loop
    execute format('revoke execute on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $$;
