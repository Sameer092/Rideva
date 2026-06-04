-- =============================================================================
-- Rideva — Fix RLS infinite recursion
-- =============================================================================
-- The original policies cross-referenced each other with EXISTS subqueries:
--   profiles  -> rides
--   rides     -> ride_offers
--   ride_offers -> rides     (← closes the loop -> "infinite recursion")
-- Evaluating any of them re-triggered the others' RLS, so Postgres aborted with
-- 42P17. The fix is the standard Supabase pattern: do the cross-table checks in
-- SECURITY DEFINER helper functions, which run with the definer's rights and
-- therefore DON'T re-invoke RLS. Policies then just call these functions.
--
-- Run this once in the SQL Editor (idempotent — safe to re-run).
-- =============================================================================

-- ---- Helper functions (bypass RLS) -----------------------------------------
create or replace function public.is_ride_participant(p_ride uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.rides r
    where r.id = p_ride and (r.passenger_id = auth.uid() or r.driver_id = auth.uid())
  );
$$;

create or replace function public.is_ride_passenger(p_ride uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.rides r where r.id = p_ride and r.passenger_id = auth.uid());
$$;

create or replace function public.is_offered_driver(p_ride uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.ride_offers o where o.ride_id = p_ride and o.driver_id = auth.uid());
$$;

create or replace function public.shares_ride_with(p_other uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.rides r
    where (r.passenger_id = auth.uid() and r.driver_id = p_other)
       or (r.driver_id = auth.uid() and r.passenger_id = p_other)
  );
$$;

create or replace function public.can_rate_ride(p_ride uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.rides r
    where r.id = p_ride and r.status = 'completed'
      and (r.passenger_id = auth.uid() or r.driver_id = auth.uid())
  );
$$;

-- ---- Recreate the recursive policies using the helpers ----------------------
drop policy if exists "profiles: read ride counterparty" on public.profiles;
create policy "profiles: read ride counterparty" on public.profiles for select
  using (public.shares_ride_with(id));

drop policy if exists "drivers: passenger of ride can read" on public.drivers;
create policy "drivers: passenger of ride can read" on public.drivers for select
  using (public.shares_ride_with(id));

drop policy if exists "rides: offered driver read" on public.rides;
create policy "rides: offered driver read" on public.rides for select
  using (public.is_offered_driver(id));

drop policy if exists "ride_offers: driver read own" on public.ride_offers;
create policy "ride_offers: driver read own" on public.ride_offers for select
  using (driver_id = auth.uid() or public.is_admin() or public.is_ride_passenger(ride_id));

drop policy if exists "driver_locations: ride participant read" on public.driver_locations;
create policy "driver_locations: ride participant read" on public.driver_locations for select
  using (driver_id = auth.uid() or public.is_admin() or public.is_ride_passenger(ride_id));

drop policy if exists "payments: participant read" on public.payments;
create policy "payments: participant read" on public.payments for select
  using (payer_id = auth.uid() or public.is_admin() or public.is_ride_participant(ride_id));

drop policy if exists "ratings: rater create" on public.ratings;
create policy "ratings: rater create" on public.ratings for insert
  with check (rater_id = auth.uid() and public.can_rate_ride(ride_id));
