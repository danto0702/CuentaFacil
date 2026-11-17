-- Contractor portal (ADR-061): cuenta.pascalia.lat, the web complement of the WhatsApp chat.
-- The contractor signs up with e-mail and password (Supabase Auth) and links the web account to their
-- WhatsApp by sending «VINCULAR <code>» to Pascal: users.auth_user_id then points to that account and the
-- own_* policies below give access to their rows only. Conversation actions (generate, resend, change the
-- bank account) and password recovery go to the worker through the inbound queue, like staff messages.

alter table webhook_inbox drop constraint webhook_inbox_provider_check;
alter table webhook_inbox add constraint webhook_inbox_provider_check
  check (provider in ('whatsapp', 'wompi', 'transfer', 'staff', 'portal'));

-- ---------------------------------------------------------------------------
-- Linking the web account to the WhatsApp user
-- ---------------------------------------------------------------------------
create table portal_link_codes (
  code          text primary key,
  auth_user_id  uuid not null references auth.users(id) on delete cascade,
  user_id       uuid references users(id),
  created_at    timestamptz not null default now(),
  expires_at    timestamptz not null default now() + interval '30 minutes',
  used_at       timestamptz
);
create index portal_link_codes_auth on portal_link_codes (auth_user_id);
alter table portal_link_codes enable row level security;
create policy superadmin_all on portal_link_codes for all to authenticated
  using (is_superadmin()) with check (is_superadmin());

-- The code for the signed-in web account: the same one while it has time left (the page refreshes until the
-- WhatsApp message arrives), else a fresh one (the previous unused ones stop working).
create or replace function portal_link_code() returns text
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  uid uuid := auth.uid();
  -- No 0/O, 1/I/L: the code is read on a screen and typed or sent from a phone.
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  raw bytea;
  c text;
begin
  if uid is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  if exists (select 1 from users where auth_user_id = uid and deleted_at is null) then
    raise exception 'already linked';
  end if;
  select code into c from portal_link_codes
  where auth_user_id = uid and used_at is null and expires_at > now() + interval '10 minutes'
  order by created_at desc limit 1;
  if c is not null then
    return c;
  end if;
  delete from portal_link_codes where auth_user_id = uid and used_at is null;
  loop
    raw := uuid_send(gen_random_uuid());
    c := '';
    for i in 0..5 loop
      c := c || substr(alphabet, 1 + get_byte(raw, i) % length(alphabet), 1);
    end loop;
    begin
      insert into portal_link_codes (code, auth_user_id) values (c, uid);
      exit;
    exception when unique_violation then
      -- Taken: draw another one.
    end;
  end loop;
  return c;
end $$;

-- Called by the worker when «VINCULAR <code>» arrives from the contractor's WhatsApp. The WhatsApp owner
-- decides: a web account linked before to this person is replaced.
create or replace function portal_link(p_user uuid, p_code text)
returns table (status text, email text)
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  r portal_link_codes;
begin
  select * into r from portal_link_codes where code = upper(btrim(coalesce(p_code, ''))) for update;
  if not found or r.used_at is not null then
    return query select 'invalid'::text, null::text;
    return;
  end if;
  if r.expires_at < now() then
    return query select 'expired'::text, null::text;
    return;
  end if;
  if exists (select 1 from users where auth_user_id = r.auth_user_id and id <> p_user) then
    return query select 'taken'::text, null::text;
    return;
  end if;
  update users set auth_user_id = r.auth_user_id where id = p_user;
  update portal_link_codes set used_at = now(), user_id = p_user where code = r.code;
  return query select 'ok'::text, (select u.email::text from auth.users u where u.id = r.auth_user_id);
end $$;

-- ---------------------------------------------------------------------------
-- Requests to Pascal from the portal (answered in the WhatsApp chat)
-- ---------------------------------------------------------------------------
-- What the portal may ask: a few commands and the «resend a delivered report» reply.
create or replace function portal_request(p_text text default null, p_reply text default null) returns bigint
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  me uuid := current_contractor_id();
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
    'action', 'turn', 'user_id', me, 'text', p_text, 'reply', p_reply
  ))::text)
  returning id into inbox_id;
  perform queue_send('inbound', jsonb_build_object('inbox_id', inbox_id, 'provider', 'portal'));
  return inbox_id;
end $$;

-- «Olvidé mi contraseña»: the link goes by WhatsApp (no e-mail server needed). Answers nothing about
-- whether the e-mail exists; at most one link every 10 minutes per person.
create or replace function portal_recovery(p_email text) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  target uuid;
  inbox_id bigint;
begin
  select u.id into target
  from auth.users a join users u on u.auth_user_id = a.id and u.deleted_at is null
  where lower(a.email) = lower(btrim(coalesce(p_email, '')));
  if target is null then
    return;
  end if;
  if exists (
    select 1 from webhook_inbox
    where provider = 'portal' and received_at > now() - interval '10 minutes'
      and body::jsonb ->> 'action' = 'recovery' and body::jsonb ->> 'user_id' = target::text
  ) then
    return;
  end if;
  insert into webhook_inbox (provider, body)
  values ('portal', jsonb_build_object('action', 'recovery', 'user_id', target)::text)
  returning id into inbox_id;
  perform queue_send('inbound', jsonb_build_object('inbox_id', inbox_id, 'provider', 'portal'));
end $$;

-- Prices and the account that receives transfers, without the rest of system_settings.
create or replace function portal_billing() returns jsonb
language sql stable security definer set search_path = public, pg_temp as $$
  select case when current_contractor_id() is null then null else
    jsonb_build_object('prices', value -> 'prices', 'transfer', value -> 'transfer')
  end
  from system_settings where key = 'billing';
$$;

-- Names of the contractor's entities (their settings, with coordinators' data, stay private).
create or replace function portal_entities() returns table (id uuid, name text, short_name text)
language sql stable security definer set search_path = public, pg_temp as $$
  select e.id, e.name, e.short_name from entities e
  where exists (select 1 from contracts c where c.entity_id = e.id and c.user_id = current_contractor_id());
$$;

-- Transfer receipt uploaded in the portal (ADR-055): the same mark the chat leaves, for the owner to confirm.
create or replace function portal_transfer_sent(p_charge uuid, p_support uuid) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  me uuid := current_contractor_id();
begin
  if me is null then
    raise exception 'not a linked contractor' using errcode = '42501';
  end if;
  if not exists (select 1 from supports where id = p_support and user_id = me) then
    raise exception 'unknown receipt';
  end if;
  update charges
  set raw = coalesce(raw, '{}'::jsonb)
    || jsonb_build_object('transfer', jsonb_build_object('support_id', p_support, 'sent_at', now()))
  where id = p_charge and user_id = me and status = 'pending';
  if not found then
    raise exception 'no pending charge';
  end if;
  if not exists (
    select 1 from support_tickets where user_id = me and subject = 'Transferencia por confirmar' and status = 'open'
  ) then
    insert into support_tickets (user_id, subject) values (me, 'Transferencia por confirmar');
  end if;
end $$;

do $$
declare
  f text;
begin
  foreach f in array array[
    'portal_link_code()', 'portal_request(text, text)', 'portal_billing()', 'portal_transfer_sent(uuid, uuid)',
    'portal_entities()'
  ] loop
    execute format('revoke execute on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
  execute 'revoke execute on function portal_link(uuid, text) from public, anon, authenticated';
  execute 'grant execute on function portal_link(uuid, text) to service_role';
  execute 'revoke execute on function portal_recovery(text) from public';
  execute 'grant execute on function portal_recovery(text) to anon, authenticated';
end $$;

-- ---------------------------------------------------------------------------
-- Own rows (the read policies for users, contracts, obligations, periods and supports exist since the schema)
-- ---------------------------------------------------------------------------
create policy own_read on support_types for select to authenticated
  using (exists (select 1 from contracts c where c.entity_id = support_types.entity_id and c.user_id = current_contractor_id()));
create policy own_read on drafts for select to authenticated
  using (exists (
    select 1 from periods p join contracts c on c.id = p.contract_id
    where p.id = drafts.period_id and c.user_id = current_contractor_id()
  ));
create policy own_read on charges for select to authenticated using (user_id = current_contractor_id());

create policy own_all on activity_notes for all to authenticated
  using (user_id = current_contractor_id())
  with check (
    user_id = current_contractor_id()
    and exists (select 1 from contracts c where c.id = activity_notes.contract_id and c.user_id = current_contractor_id())
  );
create policy own_all on evidences for all to authenticated
  using (user_id = current_contractor_id()) with check (user_id = current_contractor_id());
create policy own_insert on supports for insert to authenticated with check (user_id = current_contractor_id());
create policy own_delete on supports for delete to authenticated using (user_id = current_contractor_id());

-- Files: each contractor's folder (<user_id>/...) in the supports and evidences buckets.
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'storage' and table_name = 'objects') then
    execute $p$create policy portal_own_read on storage.objects for select to authenticated
      using (bucket_id in ('supports', 'evidences')
        and (storage.foldername(name))[1] = public.current_contractor_id()::text)$p$;
    execute $p$create policy portal_own_insert on storage.objects for insert to authenticated
      with check (bucket_id in ('supports', 'evidences')
        and (storage.foldername(name))[1] = public.current_contractor_id()::text)$p$;
    execute $p$create policy portal_own_delete on storage.objects for delete to authenticated
      using (bucket_id in ('supports', 'evidences')
        and (storage.foldername(name))[1] = public.current_contractor_id()::text)$p$;
    -- Delivered packages (outputs/packages/<user_id>-<uuid>/<file>.zip), kept 30 days by the retention job.
    execute $p$create policy portal_own_packages on storage.objects for select to authenticated
      using (bucket_id = 'outputs' and name like 'packages/' || public.current_contractor_id()::text || '-%')$p$;
  else
    raise notice 'storage schema not available: storage policies skipped';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- An activity edited in the portal makes Pascal draft that obligation again
-- ---------------------------------------------------------------------------
-- Only changes made by a contractor in the portal: the worker (service_role) edits notes inside its own
-- flows and keeps the drafts consistent itself. Delivered reports keep their drafts.
create or replace function portal_forget_drafts(n activity_notes) returns void
language sql security definer set search_path = public, pg_temp as $$
  delete from drafts d
  using periods p
  where d.period_id = p.id
    and p.contract_id = n.contract_id
    and n.activity_date between p.date_from and p.date_to
    and p.status <> 'delivered'
    and d.obligation_id = any (array_append(n.extra_obligation_ids, n.confirmed_obligation_id));
$$;

create or replace function portal_note_changed() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if current_contractor_id() is null then
    return null;
  end if;
  if tg_op in ('UPDATE', 'DELETE') then
    perform portal_forget_drafts(old);
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    perform portal_forget_drafts(new);
  end if;
  return null;
end $$;
revoke execute on function portal_forget_drafts(activity_notes) from public, anon, authenticated;

create trigger activity_notes_portal after insert or update or delete on activity_notes
  for each row execute function portal_note_changed();
