-- Schema and seed sanity checks.
create or replace function pg_temp.assert(ok boolean, msg text) returns void language plpgsql as $$
begin
  if not ok then raise exception 'ASSERTION FAILED: %', msg; end if;
end $$;

select pg_temp.assert(
  not exists (select 1 from pg_tables t where schemaname = 'public' and not rowsecurity),
  'every public table has RLS enabled');
select pg_temp.assert(
  (select sum(amount) from payment_schedule where contract_id = '00000000-0000-4000-8000-000000000202') = 39688000,
  'EBS schedule adds up to the contract value');
select pg_temp.assert(
  (select sum(i.amount) from payment_schedule_items i join payment_schedule s on s.id = i.schedule_id
   where s.contract_id = '00000000-0000-4000-8000-000000000202' and i.counts_for_ibc) = 3360000 + 4 * 8400000,
  'only fees count for IBC');
select pg_temp.assert((select count(*) from reminder_rules) = 4, 'seed is idempotent');
select pg_temp.assert((select count(*) from support_types where entity_id = '00000000-0000-4000-8000-000000000001' and max_age_days = 30) = 7,
  'background checks and affiliations are valid 30 days');

do $$ begin
  begin
    insert into templates (entity_id, kind, name, version, file_path, unknown_tags, status)
    values ('00000000-0000-4000-8000-000000000001', 'activity_report', 'x', 1, 'x', array['foo'], 'active');
    raise exception 'template with unknown tags must not be active';
  exception when check_violation then null;
  end;
  begin
    insert into users (phone_e164) values ('3001234567');
    raise exception 'phone must be E.164';
  exception when check_violation then null;
  end;
end $$;
