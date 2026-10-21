-- Messages the owner writes from the panel and Pascal delivers in the contractor's chat (ADR-057).
-- Same path as transfer reviews: the panel only enqueues; the worker sends, or holds the text and sends
-- the approved notice template when the 24-hour window is closed (ADR-043).
alter table webhook_inbox drop constraint webhook_inbox_provider_check;
alter table webhook_inbox add constraint webhook_inbox_provider_check
  check (provider in ('whatsapp', 'wompi', 'transfer', 'staff'));

create or replace function staff_message(p_user uuid, p_text text) returns bigint
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  inbox_id bigint;
  body text := btrim(coalesce(p_text, ''));
begin
  if not is_superadmin() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if body = '' or char_length(body) > 1500 then
    raise exception 'message must have between 1 and 1500 characters';
  end if;
  if not exists (select 1 from users where id = p_user and deleted_at is null) then
    raise exception 'user % not found', p_user;
  end if;
  insert into webhook_inbox (provider, body)
  values ('staff', jsonb_build_object('user_id', p_user, 'text', body, 'by', auth.uid())::text)
  returning id into inbox_id;
  perform queue_send('inbound', jsonb_build_object('inbox_id', inbox_id, 'provider', 'staff'));
  return inbox_id;
end $$;
revoke execute on function staff_message(uuid, text) from public, anon;
grant execute on function staff_message(uuid, text) to authenticated;
