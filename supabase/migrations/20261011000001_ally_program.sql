-- Programa de Aliados (owner, 2026-10-11; ADR-032). The first contractor of a new institution becomes
-- its Aliado and gets a referral code. Each calendar month the Aliado climbs one level when the
-- contractors they referred reach 10 × (level + 1) paid reports that month (one per contractor). Each
-- level grants one free report; level 10 makes them Aliado Premium with a $500.000 bonus paid by
-- bank transfer ("bonificación por referidos").

create table allies (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null unique references users(id),
  institution_request_id  uuid references institution_requests(id),
  entity_id               uuid references entities(id),
  code                    text not null unique check (code ~ '^ALI-[A-Z0-9]{4}$'),
  level                   int not null default 0 check (level between 0 and 10),
  premium_at              timestamptz,
  bonus_status            text not null default 'none' check (bonus_status in ('none', 'pending', 'paid')),
  bonus_paid_at           timestamptz,
  bonus_reference         text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
create trigger allies_updated before update on allies for each row execute function set_updated_at();

create table ally_levels (
  id            uuid primary key default gen_random_uuid(),
  ally_id       uuid not null references allies(id) on delete cascade,
  level         int not null check (level between 1 and 10),
  month         date not null,                   -- first day of the evaluated month
  paid_reports  int not null,
  granted_at    timestamptz not null default now(),
  notified_at   timestamptz,
  unique (ally_id, level),
  unique (ally_id, month)
);

alter table users add column referred_by_ally uuid references allies(id);
alter table users add column referred_at timestamptz;

-- How each delivered report was charged; only 'paid' counts for the program (pilot and free reports do not).
alter table periods add column charge text check (charge in ('paid', 'free', 'pilot'));

insert into system_settings (key, value) values
  ('ally_program', '{"step": 10, "max_level": 10, "premium_bonus": 500000}'::jsonb)
on conflict (key) do nothing;

-- Paid reports per Aliado in a month: distinct referred contractors (not the Aliado themself, nor
-- anyone with the Aliado's ID number) with a paid report delivered that month.
create or replace function ally_paid_reports(p_month date)
returns table (ally_id uuid, paid_reports bigint)
language sql stable security definer set search_path = public, pg_temp as $$
  select a.id, count(distinct u.id)
  from allies a
  join users au on au.id = a.user_id
  join users u on u.referred_by_ally = a.id and u.id <> a.user_id
    and (u.doc_number_bidx is null or au.doc_number_bidx is null or u.doc_number_bidx <> au.doc_number_bidx)
  join contracts c on c.user_id = u.id
  join periods p on p.contract_id = c.id
  where p.charge = 'paid'
    and p.delivered_at >= p_month
    and p.delivered_at < (p_month + interval '1 month')
  group by a.id;
$$;

-- Evaluates one month (idempotent): at most one level per Aliado per month.
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
      insert into ally_levels (ally_id, level, month, paid_reports) values (r.id, r.level + 1, month_start, r.paid);
      update allies set level = r.level + 1,
        premium_at = case when r.level + 1 = max_level then now() else premium_at end,
        bonus_status = case when r.level + 1 = max_level then 'pending' else bonus_status end
      where id = r.id;
      update users set free_reports = free_reports + 1 where id = r.user_id;
      granted := granted + 1;
    end if;
  end loop;
  return granted;
end $$;

revoke all on function ally_paid_reports(date) from public, anon, authenticated;
revoke all on function evaluate_allies(date) from public, anon, authenticated;
grant execute on function ally_paid_reports(date) to service_role;
grant execute on function evaluate_allies(date) to service_role;

alter table allies enable row level security;
alter table ally_levels enable row level security;
revoke all on allies, ally_levels from anon;
create policy superadmin_all on allies for all to authenticated using (is_superadmin()) with check (is_superadmin());
create policy staff_read on allies for select to authenticated using (is_staff());
create policy superadmin_all on ally_levels for all to authenticated using (is_superadmin()) with check (is_superadmin());
create policy staff_read on ally_levels for select to authenticated using (is_staff());
