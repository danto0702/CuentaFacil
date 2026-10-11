-- Users with a WhatsApp username may reach us without their phone number: Meta sends a business-scoped
-- user id (BSUID, e.g. "CO.1234567890123456") instead. It becomes their identity, like the phone number.
alter table users drop constraint users_phone_e164_check;
alter table users add constraint users_phone_e164_check
  check (phone_e164 ~ '^\+[1-9][0-9]{7,14}$' or phone_e164 ~ '^[A-Z]{2}\.[A-Za-z0-9]{1,128}$');
