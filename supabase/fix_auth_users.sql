-- =============================================================================
-- Repair manually-seeded auth.users so they can log in.
-- Fixes the two things SQL-seeding misses (which cause
-- "Database error querying schema" / failed logins):
--   1. token columns left NULL (GoTrue scans them as text)
--   2. a missing email identity row (required by recent GoTrue for password auth)
-- Safe to run multiple times.
-- =============================================================================

-- 1. NULL token columns -> ''
update auth.users set
  confirmation_token         = coalesce(confirmation_token, ''),
  recovery_token             = coalesce(recovery_token, ''),
  email_change               = coalesce(email_change, ''),
  email_change_token_new     = coalesce(email_change_token_new, ''),
  email_change_token_current = coalesce(email_change_token_current, ''),
  reauthentication_token     = coalesce(reauthentication_token, ''),
  phone_change               = coalesce(phone_change, ''),
  phone_change_token         = coalesce(phone_change_token, '')
where email like '%@rideva.dev';

-- 2. Create a missing email identity for each seeded user
insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id,
       jsonb_build_object('sub', u.id::text, 'email', u.email),
       'email', u.id::text, now(), now(), now()
from auth.users u
where u.email like '%@rideva.dev'
  and not exists (select 1 from auth.identities i where i.user_id = u.id and i.provider = 'email');
