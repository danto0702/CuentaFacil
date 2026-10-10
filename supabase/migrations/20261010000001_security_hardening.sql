-- Security hardening after the Supabase database linter (2026-10-10).

-- 1. Fixed search_path on trigger functions.
alter function set_updated_at() set search_path = public, pg_temp;
alter function forbid_mutation() set search_path = public, pg_temp;

-- 2. RLS helper functions: only signed-in users (policies need EXECUTE); never anon.
revoke execute on function is_staff() from public, anon;
revoke execute on function is_superadmin() from public, anon;
revoke execute on function current_contractor_id() from public, anon;
grant execute on function is_staff() to authenticated;
grant execute on function is_superadmin() to authenticated;
grant execute on function current_contractor_id() to authenticated;

-- 3. Function that replaces the SECURITY DEFINER view subscriptions_operator (dropped in the next migration).
create or replace function operator_subscriptions()
returns table (id uuid, contract_id uuid, status subscription_status, paid_through date, grace_until date)
language sql stable security definer set search_path = public, pg_temp as $$
  select s.id, s.contract_id, s.status, s.paid_through, s.grace_until
  from subscriptions s
  where is_staff();
$$;
revoke execute on function operator_subscriptions() from public, anon;
grant execute on function operator_subscriptions() to authenticated;
