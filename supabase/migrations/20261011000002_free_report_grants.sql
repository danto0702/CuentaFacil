-- Free reports expire 12 months after they are granted (owner, 2026-10-11). The counter
-- users.free_reports becomes one row per grant, so each one keeps its own expiry and use.

create table free_report_grants (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references users(id),
  reason          text not null check (reason in ('institution_first', 'ally_level')),
  source_id       uuid,                                   -- institution_requests.id or ally_levels.id
  granted_at      timestamptz not null default now(),
  expires_at      timestamptz not null default (now() + interval '12 months'),
  used_at         timestamptz,
  used_period_id  uuid references periods(id)
);
create index free_report_grants_available on free_report_grants (user_id, expires_at) where used_at is null;

insert into free_report_grants (user_id, reason)
select u.id, 'institution_first' from users u, generate_series(1, u.free_reports);

create or replace function evaluate_allies(p_month date)
returns int
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  cfg jsonb := coalesce((select value from system_settings where key = 'ally_program'),
                        '{"step": 10, "max_level": 10}'::jsonb);
  step int := (cfg->>'step')::int;
  max_level int := (cfg->>'max_level')::int;
  month_start date := date_trunc('month', p_month)::date;
  r record;
  level_id uuid;
  granted int := 0;
begin
  for r in
    select a.id, a.user_id, a.level, coalesce(x.paid_reports, 0) as paid
    from allies a
    left join ally_paid_reports(month_start) x on x.ally_id = a.id
    where a.level < max_level
      and not exists (select 1 from ally_levels l where l.ally_id = a.id and l.month = month_start)
  loop
    if r.paid >= step * (r.level + 1) then
      insert into ally_levels (ally_id, level, month, paid_reports)
        values (r.id, r.level + 1, month_start, r.paid) returning id into level_id;
      update allies set level = r.level + 1,
        premium_at = case when r.level + 1 = max_level then now() else premium_at end,
        bonus_status = case when r.level + 1 = max_level then 'pending' else bonus_status end
      where id = r.id;
      insert into free_report_grants (user_id, reason, source_id) values (r.user_id, 'ally_level', level_id);
      granted := granted + 1;
    end if;
  end loop;
  return granted;
end $$;

alter table free_report_grants enable row level security;
revoke all on free_report_grants from anon;
create policy superadmin_all on free_report_grants for all to authenticated
  using (is_superadmin()) with check (is_superadmin());
create policy staff_read on free_report_grants for select to authenticated using (is_staff());
