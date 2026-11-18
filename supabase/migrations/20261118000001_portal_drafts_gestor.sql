-- Portal (ADR-065): the draft reviewed and approved on the web, and a gestor working the accounts of the people
-- who authorized them (ADR-042) from their own web account.
--
-- The gestor picks a person in the portal; the panel then sends the header «x-cf-acting: <person id>» on every
-- request. current_contractor_id() honours it only when that person has an active delegation to the signed-in
-- contractor, so every own_* policy and portal_* function already in place works for that person unchanged.

-- The contractor behind the signed-in web account, whoever they are working for.
create or replace function portal_self_id() returns uuid
language sql stable security definer set search_path = public, pg_temp as $$
  select id from users where auth_user_id = auth.uid() and deleted_at is null;
$$;

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
  if wanted is null or wanted !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' or wanted = me::text then
    return me;
  end if;
  select d.person_id into target
  from delegations d join users u on u.id = d.person_id and u.deleted_at is null
  where d.manager_id = me and d.person_id = wanted::uuid and d.status = 'active'
  limit 1;
  -- An unknown or revoked person: the gestor's own rows, never someone else's.
  return coalesce(target, me);
end $$;

-- The signed-in contractor and the people they may work for (the portal's person picker).
create or replace function portal_people() returns table (id uuid, full_name text, is_self boolean)
language sql stable security definer set search_path = public, pg_temp as $$
  select u.id, coalesce(nullif(u.full_name, ''), 'Mis cuentas'), true from users u where u.id = portal_self_id()
  union all
  select u.id, coalesce(nullif(u.full_name, ''), d.person_name), false
  from delegations d join users u on u.id = d.person_id and u.deleted_at is null
  where d.manager_id = portal_self_id() and d.status = 'active';
$$;

-- Folders the signed-in web account may use in Storage: their own and those of the people they manage. The
-- Storage API does not forward the portal header, so the folder decides.
create or replace function portal_actable_ids() returns setof uuid
language sql stable security definer set search_path = public, pg_temp as $$
  select id from portal_people();
$$;

-- ---------------------------------------------------------------------------
-- Requests to Pascal: now for one contract, and from the gestor's WhatsApp when they act for someone
-- ---------------------------------------------------------------------------
drop function if exists portal_request(text, text);
create or replace function portal_request(p_text text default null, p_reply text default null, p_contract uuid default null)
returns bigint
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  me uuid := current_contractor_id();
  self uuid := portal_self_id();
  inbox_id bigint;
begin
  if me is null then
    raise exception 'not a linked contractor' using errcode = '42501';
  end if;
  if (p_text is null) = (p_reply is null) then
    raise exception 'send a text or a reply';
  end if;
  if p_text is not null and p_text not in ('generar', 'cambiar mi cuenta bancaria', 'ver borrador', 'estado') then
    raise exception 'text not allowed';
  end if;
  if p_reply is not null and p_reply !~ '^redo:[0-9a-f-]{36}:[0-9]{1,3}$' then
    raise exception 'reply not allowed';
  end if;
  if p_contract is not null and not exists (select 1 from contracts where id = p_contract and user_id = me) then
    raise exception 'unknown contract';
  end if;
  -- One request every 20 seconds is enough for a person (a double click must not run a turn twice).
  if exists (
    select 1 from webhook_inbox
    where provider = 'portal' and received_at > now() - interval '20 seconds'
      and body::jsonb ->> 'user_id' = me::text
  ) then
    raise exception 'too many requests';
  end if;
  insert into webhook_inbox (provider, body)
  values ('portal', jsonb_strip_nulls(jsonb_build_object(
    'action', 'turn', 'user_id', me, 'text', p_text, 'reply', p_reply, 'contract_id', p_contract,
    -- The answer goes to whoever asked: the gestor's WhatsApp, working for this person.
    'actor_id', case when self <> me then self end
  ))::text)
  returning id into inbox_id;
  perform queue_send('inbound', jsonb_build_object('inbox_id', inbox_id, 'provider', 'portal'));
  return inbox_id;
end $$;

-- ---------------------------------------------------------------------------
-- The draft on the web: write an obligation's text, approve the whole report
-- ---------------------------------------------------------------------------
-- A period of the contractor's that can still change (not delivered or being generated).
create or replace function portal_open_period(p_period uuid) returns periods
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  p periods;
begin
  select pe.* into p from periods pe join contracts c on c.id = pe.contract_id
  where pe.id = p_period and c.user_id = current_contractor_id();
  if not found then
    raise exception 'unknown period' using errcode = '42501';
  end if;
  if p.status in ('delivered', 'generating') then
    raise exception 'period closed';
  end if;
  return p;
end $$;

-- The contractor's own words for one obligation. Their text is their approval of it, and it keeps the notes it
-- stands for: Pascal redrafts it only if those notes change (the chat's rule for approved drafts).
create or replace function portal_save_draft(p_period uuid, p_obligation uuid, p_text text) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  p periods := portal_open_period(p_period);
  body text := btrim(coalesce(p_text, ''));
  notes uuid[];
begin
  if not exists (select 1 from obligations where id = p_obligation and contract_id = p.contract_id) then
    raise exception 'unknown obligation';
  end if;
  if length(body) < 10 or length(body) > 6000 then
    raise exception 'text length';
  end if;
  -- Paragraphs are separated by a blank line, as the worker stores them.
  body := regexp_replace(replace(body, E'\r', ''), E'\n\\s*\n+', E'\n\n', 'g');
  select coalesce(array_agg(n.id order by n.activity_date, n.created_at), '{}') into notes
  from activity_notes n
  where n.contract_id = p.contract_id and n.activity_date between p.date_from and p.date_to
    and (n.confirmed_obligation_id = p_obligation or p_obligation = any (n.extra_obligation_ids));
  insert into drafts (period_id, obligation_id, version, user_text, final_text, status, source_note_ids, approved_at)
  values (p.id, p_obligation, 1, body, body, 'approved', notes, now())
  on conflict (period_id, obligation_id, version)
  do update set user_text = excluded.user_text, final_text = excluded.final_text, status = 'approved',
    source_note_ids = excluded.source_note_ids, approved_at = now();
  if p.status in ('scheduled', 'collecting', 'ready_to_draft', 'approved') then
    update periods set status = 'draft_review', updated_at = now() where id = p.id;
  end if;
end $$;

-- «Aprobar todo»: every obligation has its text (or was left out), as the chat requires before generating.
create or replace function portal_approve_draft(p_period uuid) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  p periods := portal_open_period(p_period);
  missing int;
begin
  select count(*) into missing
  from obligations o
  left join drafts d on d.period_id = p.id and d.obligation_id = o.id and d.version = 1
  where o.contract_id = p.contract_id
    and (d.id is null
      or d.status in ('pending', 'needs_input')
      or (d.status <> 'not_applicable' and btrim(coalesce(d.final_text, '')) = ''));
  if missing > 0 then
    raise exception 'draft incomplete: % obligations', missing;
  end if;
  update drafts set status = 'approved', approved_at = now()
  where period_id = p.id and status in ('proposed', 'default');
  update periods set status = 'approved', updated_at = now() where id = p.id;
end $$;

do $$
declare
  f text;
begin
  foreach f in array array[
    'portal_request(text, text, uuid)', 'portal_people()', 'portal_save_draft(uuid, uuid, text)',
    'portal_approve_draft(uuid)'
  ] loop
    execute format('revoke execute on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
  foreach f in array array['portal_self_id()', 'portal_actable_ids()', 'portal_open_period(uuid)'] loop
    execute format('revoke execute on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Files of the people the gestor manages
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'storage' and table_name = 'objects') then
    execute 'drop policy if exists portal_own_read on storage.objects';
    execute 'drop policy if exists portal_own_insert on storage.objects';
    execute 'drop policy if exists portal_own_delete on storage.objects';
    execute 'drop policy if exists portal_own_packages on storage.objects';
    execute $p$create policy portal_own_read on storage.objects for select to authenticated
      using (bucket_id in ('supports', 'evidences')
        and (storage.foldername(name))[1] in (select i::text from public.portal_actable_ids() i))$p$;
    execute $p$create policy portal_own_insert on storage.objects for insert to authenticated
      with check (bucket_id in ('supports', 'evidences')
        and (storage.foldername(name))[1] in (select i::text from public.portal_actable_ids() i))$p$;
    execute $p$create policy portal_own_delete on storage.objects for delete to authenticated
      using (bucket_id in ('supports', 'evidences')
        and (storage.foldername(name))[1] in (select i::text from public.portal_actable_ids() i))$p$;
    execute $p$create policy portal_own_packages on storage.objects for select to authenticated
      using (bucket_id = 'outputs'
        and exists (select 1 from public.portal_actable_ids() i where name like 'packages/' || i::text || '-%'))$p$;
  else
    raise notice 'storage schema not available: storage policies skipped';
  end if;
end $$;
