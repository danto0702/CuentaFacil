-- Webhook inbox + queue wrappers (runs against the pgmq stub on plain Postgres).
create or replace function pg_temp.assert(ok boolean, msg text) returns void language plpgsql as $$
begin if not coalesce(ok, false) then raise exception 'FAILED: %', msg; end if; end $$;

set role service_role;
select pg_temp.assert(webhook_receive('whatsapp', 'sha256=abc', '{"x":1}') > 0, 'webhook_receive stores and enqueues');
select pg_temp.assert((select count(*) from queue_read('inbound', 30, 10)) = 1, 'queue_read returns the enqueued message');
select pg_temp.assert((select count(*) from queue_read('inbound', 30, 10)) = 0, 'message invisible during visibility timeout');
reset role;

select pg_temp.assert((select count(*) from webhook_inbox where status = 'pending') = 1, 'inbox row is pending');

set role anon;
do $$ begin
  perform webhook_receive('whatsapp', null, '{}');
  raise exception 'FAILED: anon must not call webhook_receive';
exception when insufficient_privilege then null;
end $$;
reset role;

set role authenticated;
do $$ begin
  perform queue_read('inbound', 1, 1);
  raise exception 'FAILED: authenticated must not read queues';
exception when insufficient_privilege then null;
end $$;
reset role;
