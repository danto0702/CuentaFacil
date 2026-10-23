-- staff_message (ADR-057): only the superadmin enqueues messages for a contractor.
create or replace function pg_temp.assert(ok boolean, msg text) returns void language plpgsql as $$
begin if not coalesce(ok, false) then raise exception 'FAILED: %', msg; end if; end $$;

set role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', false);
select pg_temp.assert(
  staff_message('00000000-0000-4000-8000-000000000101', '  Hola, te escribe el equipo  ') > 0,
  'superadmin enqueues a staff message');
do $$ begin
  perform staff_message('00000000-0000-4000-8000-000000000101', '   ');
  raise exception 'FAILED: empty message accepted';
exception when raise_exception then
  if sqlerrm like 'FAILED%' then raise; end if;
end $$;
do $$ begin
  perform staff_message('00000000-0000-4000-8000-000000000999', 'Hola');
  raise exception 'FAILED: unknown user accepted';
exception when raise_exception then
  if sqlerrm like 'FAILED%' then raise; end if;
end $$;
reset role;

select pg_temp.assert(
  (select body::jsonb ->> 'text' from webhook_inbox where provider = 'staff') = 'Hola, te escribe el equipo',
  'the text is stored trimmed');

set role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', false);
do $$ begin
  perform staff_message('00000000-0000-4000-8000-000000000101', 'Hola');
  raise exception 'FAILED: operator must not send staff messages';
exception when insufficient_privilege then null;
end $$;
reset role;

set role anon;
do $$ begin
  perform staff_message('00000000-0000-4000-8000-000000000101', 'Hola');
  raise exception 'FAILED: anon must not send staff messages';
exception when insufficient_privilege then null;
end $$;
reset role;
