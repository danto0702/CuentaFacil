-- Portal (ADR-065): a gestor working for an authorized person, and the draft approved on the web.
create or replace function pg_temp.assert(ok boolean, msg text) returns void language plpgsql as $$
begin if not coalesce(ok, false) then raise exception 'FAILED: %', msg; end if; end $$;

insert into auth.users (id, email) values
  ('20000000-0000-4000-8000-000000000001', 'maria.web@example.invalid'),
  ('20000000-0000-4000-8000-000000000002', 'otra.web@example.invalid')
on conflict do nothing;
update users set auth_user_id = '20000000-0000-4000-8000-000000000001' where id = '00000000-0000-4000-8000-000000000101';
-- María manages Carlos's accounts.
insert into delegations (id, manager_id, person_id, person_name, person_phone, status) values
  ('30000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000101',
   '00000000-0000-4000-8000-000000000102', 'Carlos Ejemplo', '+573000000002', 'active');

create or replace function pg_temp.as_maria(acting text) returns void language sql as $$
  select set_config('request.jwt.claim.sub', '20000000-0000-4000-8000-000000000001', false),
         set_config('request.headers', coalesce(json_build_object('x-cf-acting', acting)::text, ''), false);
$$;

set role authenticated;
select pg_temp.as_maria(null);
select pg_temp.assert((select count(*) from portal_people()) = 2, 'María and the person she manages');
select pg_temp.assert((select count(*) from contracts) = 2, 'without the header: her own contracts');

select pg_temp.as_maria('00000000-0000-4000-8000-000000000102');
select pg_temp.assert(current_contractor_id() = '00000000-0000-4000-8000-000000000102', 'acting for Carlos');
select pg_temp.assert(portal_self_id() = '00000000-0000-4000-8000-000000000101', 'still María behind it');
select pg_temp.assert((select count(*) from contracts) = 1
  and (select id from contracts) = '00000000-0000-4000-8000-000000000203', 'sees Carlos''s contract only');
select pg_temp.assert((select count(*) from portal_people()) = 2, 'the picker does not change while acting');
insert into activity_notes (user_id, contract_id, activity_date, text)
values ('00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000203', '2026-10-10', 'Archivo de prueba');
select pg_temp.assert((select count(*) from activity_notes where text = 'Archivo de prueba') = 1, 'records for Carlos');
select pg_temp.assert(portal_request('generar', null, '00000000-0000-4000-8000-000000000203') > 0, 'asks Pascal for Carlos');
reset role;
select pg_temp.assert(
  (select body::jsonb ->> 'actor_id' = '00000000-0000-4000-8000-000000000101'
      and body::jsonb ->> 'user_id' = '00000000-0000-4000-8000-000000000102'
      and body::jsonb ->> 'contract_id' = '00000000-0000-4000-8000-000000000203'
   from webhook_inbox where provider = 'portal' order by id desc limit 1),
  'the answer goes to María''s WhatsApp, for Carlos''s contract');

-- Someone she does not manage, or a revoked authorization: back to her own rows.
set role authenticated;
select pg_temp.as_maria('00000000-0000-4000-8000-000000000999');
select pg_temp.assert(current_contractor_id() = '00000000-0000-4000-8000-000000000101', 'unknown person ignored');
select pg_temp.as_maria('not-a-uuid');
select pg_temp.assert(current_contractor_id() = '00000000-0000-4000-8000-000000000101', 'bad header ignored');
reset role;
update delegations set status = 'revoked' where id = '30000000-0000-4000-8000-000000000001';
set role authenticated;
select pg_temp.as_maria('00000000-0000-4000-8000-000000000102');
select pg_temp.assert(current_contractor_id() = '00000000-0000-4000-8000-000000000101', 'revoked: no access');
select pg_temp.assert((select count(*) from activity_notes where text = 'Archivo de prueba') = 0, 'revoked: nothing of Carlos');
select pg_temp.assert((select count(*) from portal_people()) = 1, 'revoked: only herself in the picker');
do $$ begin
  perform portal_request('estado', null, '00000000-0000-4000-8000-000000000203');
  raise exception 'FAILED: request for a contract that is not hers';
exception when raise_exception then
  if sqlerrm like 'FAILED%' then raise; end if;
end $$;
reset role;

-- Carlos himself cannot act for María (the delegation goes one way).
update delegations set status = 'active' where id = '30000000-0000-4000-8000-000000000001';
update users set auth_user_id = '20000000-0000-4000-8000-000000000002' where id = '00000000-0000-4000-8000-000000000102';
set role authenticated;
select set_config('request.jwt.claim.sub', '20000000-0000-4000-8000-000000000002', false);
select set_config('request.headers', json_build_object('x-cf-acting', '00000000-0000-4000-8000-000000000101')::text, false);
select pg_temp.assert(current_contractor_id() = '00000000-0000-4000-8000-000000000102', 'the person cannot act for the gestor');
reset role;
update users set auth_user_id = null where id = '00000000-0000-4000-8000-000000000102';

-- The draft on the web (María's report 3, collecting).
create temp table p3 as
select p.id, (select id from obligations where contract_id = p.contract_id and kind = 'specific' and number = 1) as o1
from periods p where p.contract_id = '00000000-0000-4000-8000-000000000201' and p.report_number = 3;
grant select on p3 to authenticated;
set role authenticated;
select pg_temp.as_maria(null);
do $$ begin
  perform portal_approve_draft((select id from p3));
  raise exception 'FAILED: approved without drafts';
exception when raise_exception then
  if sqlerrm like 'FAILED%' then raise; end if;
end $$;
select portal_save_draft((select id from p3), (select o1 from p3), E'Realicé el seguimiento semanal.\r\n\r\n\r\nAcompañé la notificación.');
reset role;
select pg_temp.assert(
  (select final_text = E'Realicé el seguimiento semanal.\n\nAcompañé la notificación.' and status = 'approved'
   from drafts where period_id = (select id from p3) and obligation_id = (select o1 from p3)),
  'her text, in paragraphs, counts as approved');
select pg_temp.assert((select status from periods where id = (select id from p3)) = 'draft_review', 'period in review');
-- The other obligations drafted by Pascal; one left out.
insert into drafts (period_id, obligation_id, version, final_text, status)
select (select id from p3), o.id, 1, 'Texto de Pascal.', case when o.number = 2 and o.kind = 'specific' then 'not_applicable' else 'proposed' end
from obligations o where o.contract_id = '00000000-0000-4000-8000-000000000201' and o.id <> (select o1 from p3);
update drafts set status = 'needs_input', final_text = '' where period_id = (select id from p3)
  and obligation_id = (select id from obligations where contract_id = '00000000-0000-4000-8000-000000000201' and kind = 'specific' and number = 3);
set role authenticated;
select pg_temp.as_maria(null);
do $$ begin
  perform portal_approve_draft((select id from p3));
  raise exception 'FAILED: approved with an obligation without text';
exception when raise_exception then
  if sqlerrm like 'FAILED%' then raise; end if;
end $$;
select portal_save_draft((select id from p3),
  (select id from obligations where contract_id = '00000000-0000-4000-8000-000000000201' and kind = 'specific' and number = 3),
  'Asistí a la reunión municipal de salud pública.');
select portal_approve_draft((select id from p3));
reset role;
select pg_temp.assert((select status from periods where id = (select id from p3)) = 'approved', 'period approved');
select pg_temp.assert((select count(*) from drafts where period_id = (select id from p3) and status = 'approved') > 0
  and (select count(*) from drafts where period_id = (select id from p3) and status not in ('approved', 'not_applicable')) = 0,
  'every draft approved, the omitted one stays out');

-- A delivered report cannot change; nor can someone else's.
set role authenticated;
select pg_temp.as_maria(null);
do $$ begin
  perform portal_save_draft(
    (select id from periods where contract_id = '00000000-0000-4000-8000-000000000201' and report_number = 1),
    (select o1 from p3), 'Cambio después de entregado.');
  raise exception 'FAILED: edited a delivered report';
exception when raise_exception then
  if sqlerrm like 'FAILED%' then raise; end if;
end $$;
do $$ begin
  perform portal_approve_draft((select id from periods where contract_id = '00000000-0000-4000-8000-000000000203'));
  raise exception 'FAILED: approved a report of someone not selected';
exception when insufficient_privilege then null;
end $$;
reset role;

-- Leave everything as the other tests expect.
delete from drafts where period_id = (select id from p3);
update periods set status = 'collecting' where id = (select id from p3);
delete from activity_notes where text = 'Archivo de prueba';
delete from delegations where id = '30000000-0000-4000-8000-000000000001';
update users set auth_user_id = null where id = '00000000-0000-4000-8000-000000000101';
select set_config('request.headers', '', false);
do $$ begin
  if to_regclass('pgmq.stub_messages') is not null then
    delete from pgmq.stub_messages where message ->> 'provider' = 'portal';
  end if;
end $$;
delete from webhook_inbox where provider = 'portal';
