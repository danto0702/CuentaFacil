-- Contractor portal (ADR-061): linking by WhatsApp code, own rows only, requests to Pascal.
create or replace function pg_temp.assert(ok boolean, msg text) returns void language plpgsql as $$
begin if not coalesce(ok, false) then raise exception 'FAILED: %', msg; end if; end $$;

insert into auth.users (id, email) values
  ('20000000-0000-4000-8000-000000000001', 'maria.web@example.invalid'),
  ('20000000-0000-4000-8000-000000000002', 'otra.web@example.invalid')
on conflict do nothing;
update users set auth_user_id = null where id = '00000000-0000-4000-8000-000000000101';

-- Before linking: no data, but a code.
set role authenticated;
select set_config('request.jwt.claim.sub', '20000000-0000-4000-8000-000000000001', false);
select pg_temp.assert((select count(*) from contracts) = 0, 'an unlinked web account sees nothing');
select pg_temp.assert(portal_link_code() ~ '^[A-HJ-NP-Z2-9]{6}$', 'link code: 6 readable characters');
create temp table code_a as select portal_link_code() as code;
reset role;
select pg_temp.assert((select count(*) from portal_link_codes where auth_user_id = '20000000-0000-4000-8000-000000000001') = 1,
  'the same code while it has time left');
update portal_link_codes set expires_at = now() + interval '5 minutes'
where auth_user_id = '20000000-0000-4000-8000-000000000001';
set role authenticated;
select set_config('request.jwt.claim.sub', '20000000-0000-4000-8000-000000000001', false);
drop table code_a;
create temp table code_a as select portal_link_code() as code;  -- about to expire: a new one replaces it
reset role;
select pg_temp.assert((select count(*) from portal_link_codes where auth_user_id = '20000000-0000-4000-8000-000000000001') = 1,
  'only the newest code stays');
select pg_temp.assert((select expires_at > now() + interval '20 minutes' from portal_link_codes
  where auth_user_id = '20000000-0000-4000-8000-000000000001'), 'the new code has 30 minutes');

-- The worker links it from María's WhatsApp.
select pg_temp.assert(
  (select status from portal_link('00000000-0000-4000-8000-000000000101', 'nope99')) = 'invalid', 'unknown code');
select pg_temp.assert(
  (select status || ' ' || email from portal_link('00000000-0000-4000-8000-000000000101', lower((select code from code_a))))
    = 'ok maria.web@example.invalid', 'links and returns the web e-mail');
select pg_temp.assert(
  (select status from portal_link('00000000-0000-4000-8000-000000000101', (select code from code_a))) = 'invalid',
  'a code works once');
set role authenticated;
select set_config('request.jwt.claim.sub', '20000000-0000-4000-8000-000000000002', false);
create temp table code_b as select portal_link_code() as code;
reset role;
select pg_temp.assert(
  (select status from portal_link('00000000-0000-4000-8000-000000000102', (select code from code_b))) = 'ok',
  'another person links another web account');

-- Linked: own rows only.
set role authenticated;
select set_config('request.jwt.claim.sub', '20000000-0000-4000-8000-000000000001', false);
select pg_temp.assert((select count(*) from contracts) = 2, 'sees own contracts');
select pg_temp.assert((select count(*) from entities) = 0, 'entity settings stay private');
select pg_temp.assert((select count(*) from portal_entities()) = 1, 'but the entity name is available');
select pg_temp.assert((portal_billing() -> 'prices') is not null, 'prices for the payments page');
do $$ begin
  perform portal_link_code();
  raise exception 'FAILED: a linked account asked for another code';
exception when raise_exception then
  if sqlerrm like 'FAILED%' then raise; end if;
end $$;
insert into activity_notes (user_id, contract_id, activity_date, text)
values ('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000201', '2026-09-10', 'Visita de prueba');
select pg_temp.assert((select count(*) from activity_notes where text = 'Visita de prueba') = 1, 'adds own activity');
do $$ begin
  insert into activity_notes (user_id, contract_id, activity_date, text)
  values ('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000203', '2026-09-10', 'Ajeno');
  raise exception 'FAILED: activity in another person''s contract';
exception when insufficient_privilege then null;
end $$;
select pg_temp.assert(portal_request('generar', null) > 0, 'asks Pascal to generate');
do $$ begin
  perform portal_request('generar', null);
  raise exception 'FAILED: a double click ran two turns';
exception when raise_exception then
  if sqlerrm like 'FAILED%' then raise; end if;
end $$;
do $$ begin
  perform portal_request('borra todo', null);
  raise exception 'FAILED: free text sent to Pascal';
exception when raise_exception then
  if sqlerrm like 'FAILED%' then raise; end if;
end $$;
reset role;

select pg_temp.assert(
  (select body::jsonb ->> 'text' from webhook_inbox where provider = 'portal' order by id desc limit 1) = 'generar',
  'the request reaches the inbound queue');

-- The other person does not see María's activity.
set role authenticated;
select set_config('request.jwt.claim.sub', '20000000-0000-4000-8000-000000000002', false);
select pg_temp.assert((select count(*) from activity_notes where text = 'Visita de prueba') = 0, 'others see nothing');
reset role;

-- Recovery by WhatsApp: only for linked e-mails, never says which exist.
set role anon;
select portal_recovery('MARIA.WEB@example.invalid');
select portal_recovery('nadie@example.invalid');
reset role;
select pg_temp.assert(
  (select count(*) from webhook_inbox where provider = 'portal' and body::jsonb ->> 'action' = 'recovery') = 1,
  'one recovery link for the linked e-mail only');

-- Leave María as the other tests expect.
delete from activity_notes where text = 'Visita de prueba';
update users set auth_user_id = null where id in ('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000102');
do $$ begin
  if to_regclass('pgmq.stub_messages') is not null then
    delete from pgmq.stub_messages where message ->> 'provider' = 'portal';
  end if;
end $$;
delete from webhook_inbox where provider = 'portal';
