-- Row Level Security. Every table has RLS enabled; anon gets nothing.
-- Worker and Edge Functions use the service_role key (bypasses RLS) server-side only.

create or replace function is_staff() returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from staff_members where auth_user_id = auth.uid());
$$;

create or replace function is_superadmin() returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from staff_members where auth_user_id = auth.uid() and role = 'superadmin');
$$;

create or replace function current_contractor_id() returns uuid
language sql stable security definer set search_path = public, pg_temp as $$
  select id from users where auth_user_id = auth.uid() and deleted_at is null;
$$;

revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

do $$
declare
  t text;
  -- Operational tables: every staff member (superadmin and operator) can read them.
  staff_readable text[] := array[
    'staff_members', 'system_settings', 'organizations', 'entities', 'entity_variables', 'entity_variable_values',
    'templates', 'support_types', 'policy_versions', 'users', 'consents', 'data_requests', 'contracts',
    'contract_amendments', 'contract_templates', 'reminder_rules', 'payment_schedule', 'payment_schedule_items',
    'obligation_groups', 'obligation_goals', 'obligations', 'contractor_duties', 'periods', 'period_payments',
    'goal_progress', 'supports', 'social_security_payments', 'period_social_security', 'activity_notes',
    'evidences', 'drafts', 'generated_documents', 'conversations', 'messages', 'outbound_messages',
    'support_tickets', 'ai_usage', 'events', 'job_failures', 'plans'
  ];
  -- Operators may correct these (no deletes); superadmin can do everything everywhere.
  operator_editable text[] := array[
    'users', 'contracts', 'contract_amendments', 'obligations', 'contractor_duties', 'periods', 'period_payments',
    'payment_schedule', 'payment_schedule_items', 'supports', 'social_security_payments', 'period_social_security',
    'activity_notes', 'evidences', 'drafts', 'support_tickets', 'data_requests', 'job_failures'
  ];
  all_tables text[];
begin
  select array_agg(tablename::text) into all_tables from pg_tables where schemaname = 'public';
  foreach t in array all_tables loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy superadmin_all on %I for all to authenticated using (is_superadmin()) with check (is_superadmin())', t);
  end loop;
  foreach t in array staff_readable loop
    execute format('create policy staff_read on %I for select to authenticated using (is_staff())', t);
  end loop;
  foreach t in array operator_editable loop
    execute format('create policy staff_update on %I for update to authenticated using (is_staff()) with check (is_staff())', t);
    execute format('create policy staff_insert on %I for insert to authenticated with check (is_staff())', t);
  end loop;
end $$;

-- Billing tables (subscriptions, payments) and raw inbound payloads (wa_inbound, webhook_events) are
-- superadmin-only. Operators see subscription status through this view, without amounts or references.
create view subscriptions_operator with (security_invoker = false) as
  select s.id, s.contract_id, s.status, s.paid_through, s.grace_until
  from subscriptions s
  where is_staff();
revoke all on subscriptions_operator from anon;
grant select on subscriptions_operator to authenticated;

-- Events are append-only for everyone, including staff.
create policy staff_insert on events for insert to authenticated with check (is_staff());

-- Contractor read-only portal (Phase 4): own rows only.
create policy own_read on users for select to authenticated using (id = current_contractor_id());
create policy own_read on contracts for select to authenticated using (user_id = current_contractor_id());
create policy own_read on obligations for select to authenticated
  using (exists (select 1 from contracts c where c.id = obligations.contract_id and c.user_id = current_contractor_id()));
create policy own_read on periods for select to authenticated
  using (exists (select 1 from contracts c where c.id = periods.contract_id and c.user_id = current_contractor_id()));
create policy own_read on generated_documents for select to authenticated
  using (exists (
    select 1 from periods p join contracts c on c.id = p.contract_id
    where p.id = generated_documents.period_id and c.user_id = current_contractor_id()
  ));
create policy own_read on supports for select to authenticated using (user_id = current_contractor_id());
