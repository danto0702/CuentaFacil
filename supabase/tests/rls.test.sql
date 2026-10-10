-- RLS tests. Each block impersonates a role through request.jwt.claim.sub, like PostgREST does.
insert into auth.users (id, email) values
  ('10000000-0000-4000-8000-000000000001', 'admin@example.invalid'),
  ('10000000-0000-4000-8000-000000000002', 'operador@example.invalid'),
  ('10000000-0000-4000-8000-000000000003', 'contratista@example.invalid'),
  ('10000000-0000-4000-8000-000000000004', 'nadie@example.invalid')
on conflict do nothing;
insert into staff_members (auth_user_id, role, full_name) values
  ('10000000-0000-4000-8000-000000000001', 'superadmin', 'Admin'),
  ('10000000-0000-4000-8000-000000000002', 'operator', 'Operador')
on conflict do nothing;
update users set auth_user_id = '10000000-0000-4000-8000-000000000003' where id = '00000000-0000-4000-8000-000000000101';
insert into plans (id, name, monthly_price) values ('00000000-0000-4000-8000-000000000401', 'Mensual', 30000) on conflict do nothing;
insert into subscriptions (id, contract_id, plan_id, status) values
  ('00000000-0000-4000-8000-000000000501', '00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000401', 'active')
on conflict do nothing;
insert into payments (subscription_id, amount, status, wompi_reference) values
  ('00000000-0000-4000-8000-000000000501', 30000, 'APPROVED', 'ref-test-1')
on conflict do nothing;

create or replace function pg_temp.assert(ok boolean, msg text) returns void language plpgsql as $$
begin
  if not ok then raise exception 'ASSERTION FAILED: %', msg; end if;
end $$;

-- anon: nothing at all
set role anon;
do $$ begin
  begin
    perform count(*) from contracts;
    raise exception 'anon should not read contracts';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

-- superadmin: everything
set role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', false);
select pg_temp.assert((select count(*) from contracts) = 3, 'superadmin sees all contracts');
select pg_temp.assert((select count(*) from payments) = 1, 'superadmin sees payments');
select pg_temp.assert((select count(*) from wa_inbound) = 0, 'superadmin can query wa_inbound');
reset role;

-- operator: reads operational data, no billing, no deletes
set role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', false);
select pg_temp.assert((select count(*) from contracts) = 3, 'operator sees all contracts');
select pg_temp.assert((select count(*) from payments) = 0, 'operator cannot see payments');
select pg_temp.assert((select count(*) from subscriptions) = 0, 'operator cannot see subscriptions');
select pg_temp.assert((select count(*) from operator_subscriptions()) = 1, 'operator sees subscription status view');
update contracts set supervisor_title = 'SUBGERENTE' where id = '00000000-0000-4000-8000-000000000201';
do $$ declare n int; begin
  delete from obligations where contract_id = '00000000-0000-4000-8000-000000000203';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'operator must not delete'; end if;
end $$;
do $$ begin
  begin
    update entities set name = 'X';
    if found then raise exception 'operator must not edit entities'; end if;
  end;
end $$;
do $$ begin
  begin
    update events set action = 'x';
  exception when others then null;
  end;
end $$;
reset role;

-- contractor (future portal): own rows only
set role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000003', false);
select pg_temp.assert((select count(*) from contracts) = 2, 'contractor sees only own contracts');
select pg_temp.assert((select count(*) from users) = 1, 'contractor sees only own user');
select pg_temp.assert((select count(*) from periods) = 5, 'contractor sees only own periods');
select pg_temp.assert((select count(*) from payments) = 0, 'contractor cannot see payments');
select pg_temp.assert((select count(*) from entities) = 0, 'contractor cannot see entity config');
do $$ declare n int; begin
  update contracts set total_value = 1;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'contractor must not update contracts'; end if;
end $$;
reset role;

-- authenticated user without role: nothing
set role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000004', false);
select pg_temp.assert((select count(*) from contracts) = 0, 'unknown user sees nothing');
select pg_temp.assert((select count(*) from staff_members) = 0, 'unknown user cannot list staff');
reset role;

-- events are append-only even for the owner
do $$ begin
  insert into events (actor, action) values ('system', 'test');
  begin
    delete from events;
    raise exception 'events delete should fail';
  exception when raise_exception then
    if sqlerrm <> 'events is append-only' then raise; end if;
  end;
end $$;
