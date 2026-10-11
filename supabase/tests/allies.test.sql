-- Programa de Aliados: one level per month when referred contractors reach 10 × (level + 1) paid reports.
begin;
create or replace function pg_temp.assert(ok boolean, msg text) returns void language plpgsql as $$
begin if not coalesce(ok, false) then raise exception 'FAILED: %', msg; end if; end $$;

insert into allies (id, user_id, code) values
  ('00000000-0000-4000-8000-0000000a1001', '00000000-0000-4000-8000-000000000101', 'ALI-TST1');

-- n referred contractors, each with one delivered report in September 2026 charged as `charge`.
create or replace function pg_temp.referred(n int, charge text, tag text) returns void language plpgsql as $$
declare i int; uid uuid; cid uuid;
begin
  for i in 1..n loop
    uid := gen_random_uuid(); cid := gen_random_uuid();
    insert into users (id, phone_e164, full_name, status, referred_by_ally)
      values (uid, '+5730' || tag || lpad(i::text, 6, '0'), 'Referido ' || i, 'active', '00000000-0000-4000-8000-0000000a1001');
    insert into contracts (id, user_id, entity_id, number, number_full, secop_code, object_text, process_area, contract_profile,
                           start_date, end_date, term_text, total_value, monthly_value, payments_count, report_number_fmt,
                           period_mode, supervisor_name, supervisor_title, status)
      select cid, uid, entity_id, tag || i, 'CPS-' || tag || i, 'X', object_text, process_area, contract_profile, start_date,
             end_date, term_text, total_value, monthly_value, payments_count, report_number_fmt, period_mode,
             supervisor_name, supervisor_title, status
      from contracts where id = '00000000-0000-4000-8000-000000000201';
    insert into periods (contract_id, report_number, payment_number, date_from, date_to, amount, amount_source, status, delivered_at, charge)
      values (cid, 1, 1, '2026-09-01', '2026-09-30', 4000000, 'schedule', 'delivered', '2026-09-28', charge);
  end loop;
end $$;

select pg_temp.referred(9, 'paid', '11');
select pg_temp.referred(5, 'pilot', '12');
set role service_role;
select pg_temp.assert(evaluate_allies('2026-09-01') = 0, '9 paid + 5 pilot reports: no level yet');
reset role;

select pg_temp.referred(1, 'paid', '13');
set role service_role;
select pg_temp.assert(evaluate_allies('2026-09-15') = 1, '10 paid reports: level 1');
select pg_temp.assert(evaluate_allies('2026-09-01') = 0, 'same month again: no second level');
reset role;
select pg_temp.assert((select level from allies where code = 'ALI-TST1') = 1, 'ally is level 1');
select pg_temp.assert(
  (select free_reports from users where id = '00000000-0000-4000-8000-000000000101') = 1, 'one free report granted');

set role authenticated;
do $$ begin
  perform evaluate_allies('2026-09-01');
  raise exception 'FAILED: authenticated must not evaluate allies';
exception when insufficient_privilege then null;
end $$;
reset role;
rollback;
