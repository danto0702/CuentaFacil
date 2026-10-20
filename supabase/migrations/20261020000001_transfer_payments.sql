-- Bank transfers (ADR-055): the contractor sends the receipt to Pascal; the owner confirms or rejects it in
-- the panel, and the worker settles the charge and delivers, as with a Wompi event.

alter table charges drop constraint charges_method_check;
alter table charges add constraint charges_method_check
  check (method in ('wompi', 'cash_code', 'free_grant', 'pilot', 'transfer'));

alter table webhook_inbox drop constraint webhook_inbox_provider_check;
alter table webhook_inbox add constraint webhook_inbox_provider_check
  check (provider in ('whatsapp', 'wompi', 'transfer'));

-- Called from the panel by a superadmin: queues the decision for the worker. The charge must be pending and
-- have a receipt (charges.raw.transfer).
create or replace function transfer_review(p_charge uuid, p_action text) returns bigint
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  inbox_id bigint;
begin
  if not is_superadmin() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if p_action not in ('confirm', 'reject') then
    raise exception 'unknown action %', p_action;
  end if;
  if not exists (
    select 1 from charges where id = p_charge and status = 'pending' and raw ? 'transfer'
  ) then
    raise exception 'charge % has no pending transfer', p_charge;
  end if;
  insert into webhook_inbox (provider, body)
  values ('transfer', jsonb_build_object('charge_id', p_charge, 'action', p_action, 'by', auth.uid())::text)
  returning id into inbox_id;
  perform queue_send('inbound', jsonb_build_object('inbox_id', inbox_id, 'provider', 'transfer'));
  return inbox_id;
end $$;

revoke execute on function transfer_review(uuid, text) from public, anon;
grant execute on function transfer_review(uuid, text) to authenticated;
