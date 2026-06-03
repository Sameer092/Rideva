-- =============================================================================
-- Rideva — Clean-slate reset  (⚠️ DESTRUCTIVE)
-- =============================================================================
-- The target project already contains unrelated tables from a previous app.
-- This migration runs FIRST and wipes the entire `public` schema so the Rideva
-- schema (0001→0003) applies onto a clean database.
--
-- It only touches `public` and one app-owned trigger on `auth.users`. The
-- Supabase-managed `auth`, `storage`, and `realtime` schemas are left intact.
--
-- This runs exactly once per environment (migration history is tracked), so it
-- will NOT nuke data on subsequent `supabase db push` deployments.
-- =============================================================================

-- Drop our auth → profile provisioning trigger if a prior version exists
-- (the function lives in public and would be removed by the cascade below, but
--  the trigger sits on auth.users so we drop it explicitly first).
drop trigger if exists on_auth_user_created on auth.users;

-- Nuke everything in public (tables, types, functions, views from the old app).
drop schema if exists public cascade;

-- Recreate an empty public schema with the standard Supabase grants so the
-- anon / authenticated / service roles work exactly as on a fresh project.
create schema public;

grant usage on schema public to anon, authenticated, service_role;
grant all  on schema public to postgres, service_role;

alter default privileges in schema public
  grant all on tables    to postgres, anon, authenticated, service_role;
alter default privileges in schema public
  grant all on functions to postgres, anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to postgres, anon, authenticated, service_role;

comment on schema public is 'standard public schema (reset for Rideva)';
