-- Portal (ADR-067): the person a gestor works for is kept in the database, not only sent as a header. The
-- «x-cf-acting» header (ADR-065) did not reach Postgres through the API gateway, so the portal showed the
-- gestor's own data under the other person's name. current_contractor_id() now reads this row, checked
-- against an active delegation every time.

create table portal_acting (
  auth_user_id uuid primary key references auth.users(id) on delete cascade,
  person_id    uuid not null references users(id) on delete cascade,
  updated_at   timestamptz not null default now()
);
alter table portal_acting enable row level security;
-- No policies: only the functions below read or write it.

create or replace function current_contractor_id() returns uuid
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  me uuid;
  wanted text;
  target uuid;
begin
  select id into me from users where auth_user_id = auth.uid() and deleted_at is null;
  if me is null then
    return null;
  end if;
  begin
    wanted := nullif(current_setting('request.headers', true), '')::json ->> 'x-cf-acting';
  exception when others then
    wanted := null;
  end;
  if wanted is null or wanted !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    select a.person_id::text into wanted from portal_acting a where a.auth_user_id = auth.uid();
  end if;
  if wanted is null or wanted = me::text then
    return me;
  end if;
  select d.person_id into target
  from delegations d join users u on u.id = d.person_id and u.deleted_at is null
  where d.manager_id = me and d.person_id = wanted::uuid and d.status = 'active'
  limit 1;
  -- An unknown or revoked person: the gestor's own rows, never someone else's.
  return coalesce(target, me);
end $$;

-- Whose accounts the portal shows right now (the same answer every policy uses).
create or replace function portal_current() returns uuid
language sql stable security definer set search_path = public, pg_temp as $$
  select current_contractor_id();
$$;

-- The person picker: null or oneself goes back to one's own accounts.
create or replace function portal_set_acting(p_person uuid) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  me uuid := portal_self_id();
begin
  if me is null then
    raise exception 'not a linked contractor' using errcode = '42501';
  end if;
  if p_person is null or p_person = me then
    delete from portal_acting where auth_user_id = auth.uid();
    return;
  end if;
  if not exists (
    select 1 from delegations where manager_id = me and person_id = p_person and status = 'active'
  ) then
    raise exception 'not authorized for that person' using errcode = '42501';
  end if;
  insert into portal_acting (auth_user_id, person_id) values (auth.uid(), p_person)
  on conflict (auth_user_id) do update set person_id = excluded.person_id, updated_at = now();
end $$;

revoke execute on function portal_current() from public, anon;
grant execute on function portal_current() to authenticated;
revoke execute on function portal_set_acting(uuid) from public, anon;
grant execute on function portal_set_acting(uuid) to authenticated;
