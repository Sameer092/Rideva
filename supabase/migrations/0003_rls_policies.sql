-- =============================================================================
-- Rideva — Row Level Security
-- =============================================================================
-- Principle of least privilege. Every table is RLS-enabled and denies by
-- default; the policies below grant exactly the access each role needs.
-- Admins are granted broad access via the is_admin() helper.
-- Server-side functions that need to bypass RLS are SECURITY DEFINER.
-- =============================================================================

alter table public.profiles         enable row level security;
alter table public.drivers          enable row level security;
alter table public.saved_locations  enable row level security;
alter table public.rides            enable row level security;
alter table public.ride_offers      enable row level security;
alter table public.driver_locations enable row level security;
alter table public.payments         enable row level security;
alter table public.earnings         enable row level security;
alter table public.ratings          enable row level security;
alter table public.ride_reports     enable row level security;
alter table public.notifications    enable row level security;
alter table public.pricing_config   enable row level security;

-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------
create policy "profiles: read own or admin"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

-- Drivers' public-facing fields are visible to the passenger of their active
-- ride and vice-versa. Implemented via a permissive read for counterparties.
create policy "profiles: read ride counterparty"
  on public.profiles for select
  using (
    exists (
      select 1 from public.rides r
      where (r.passenger_id = auth.uid() and r.driver_id = profiles.id)
         or (r.driver_id = auth.uid() and r.passenger_id = profiles.id)
    )
  );

create policy "profiles: update own"
  on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

create policy "profiles: admin update"
  on public.profiles for update using (public.is_admin());

-- -----------------------------------------------------------------------------
-- drivers
-- -----------------------------------------------------------------------------
create policy "drivers: read own or admin"
  on public.drivers for select
  using (id = auth.uid() or public.is_admin());

-- A passenger can read the driver record of their active ride.
create policy "drivers: passenger of ride can read"
  on public.drivers for select
  using (exists (
    select 1 from public.rides r
    where r.driver_id = drivers.id and r.passenger_id = auth.uid()
  ));

create policy "drivers: update own"
  on public.drivers for update
  using (id = auth.uid()) with check (id = auth.uid());

create policy "drivers: admin all"
  on public.drivers for all using (public.is_admin()) with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- saved_locations  (fully owner-scoped)
-- -----------------------------------------------------------------------------
create policy "saved_locations: owner all"
  on public.saved_locations for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- rides
-- -----------------------------------------------------------------------------
create policy "rides: participant read"
  on public.rides for select
  using (passenger_id = auth.uid() or driver_id = auth.uid() or public.is_admin());

-- Online drivers can read rides they've been offered (so the request screen works).
create policy "rides: offered driver read"
  on public.rides for select
  using (exists (
    select 1 from public.ride_offers o
    where o.ride_id = rides.id and o.driver_id = auth.uid()
  ));

create policy "rides: passenger create"
  on public.rides for insert
  with check (passenger_id = auth.uid() and public.app_role() = 'passenger');

-- Participants may update (state transitions are further guarded by RPCs).
create policy "rides: participant update"
  on public.rides for update
  using (passenger_id = auth.uid() or driver_id = auth.uid())
  with check (passenger_id = auth.uid() or driver_id = auth.uid());

create policy "rides: admin all"
  on public.rides for all using (public.is_admin()) with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- ride_offers
-- -----------------------------------------------------------------------------
create policy "ride_offers: driver read own"
  on public.ride_offers for select
  using (driver_id = auth.uid() or public.is_admin()
         or exists (select 1 from public.rides r where r.id = ride_offers.ride_id and r.passenger_id = auth.uid()));

create policy "ride_offers: driver respond"
  on public.ride_offers for update
  using (driver_id = auth.uid()) with check (driver_id = auth.uid());

-- -----------------------------------------------------------------------------
-- driver_locations
-- -----------------------------------------------------------------------------
create policy "driver_locations: driver insert own"
  on public.driver_locations for insert
  with check (driver_id = auth.uid());

-- The passenger of the associated ride can read the driver's location stream.
create policy "driver_locations: ride participant read"
  on public.driver_locations for select
  using (
    driver_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.rides r
      where r.id = driver_locations.ride_id and r.passenger_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- payments
-- -----------------------------------------------------------------------------
create policy "payments: participant read"
  on public.payments for select
  using (
    payer_id = auth.uid()
    or public.is_admin()
    or exists (select 1 from public.rides r where r.id = payments.ride_id and r.driver_id = auth.uid())
  );

create policy "payments: admin write"
  on public.payments for all using (public.is_admin()) with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- earnings
-- -----------------------------------------------------------------------------
create policy "earnings: driver read own"
  on public.earnings for select
  using (driver_id = auth.uid() or public.is_admin());

-- -----------------------------------------------------------------------------
-- ratings
-- -----------------------------------------------------------------------------
create policy "ratings: read related"
  on public.ratings for select
  using (rater_id = auth.uid() or ratee_id = auth.uid() or public.is_admin());

create policy "ratings: rater create"
  on public.ratings for insert
  with check (
    rater_id = auth.uid()
    and exists (
      select 1 from public.rides r
      where r.id = ratings.ride_id
        and r.status = 'completed'
        and (r.passenger_id = auth.uid() or r.driver_id = auth.uid())
    )
  );

-- -----------------------------------------------------------------------------
-- ride_reports
-- -----------------------------------------------------------------------------
create policy "ride_reports: reporter create"
  on public.ride_reports for insert
  with check (reporter_id = auth.uid());

create policy "ride_reports: read own or admin"
  on public.ride_reports for select
  using (reporter_id = auth.uid() or public.is_admin());

create policy "ride_reports: admin resolve"
  on public.ride_reports for update using (public.is_admin());

-- -----------------------------------------------------------------------------
-- notifications
-- -----------------------------------------------------------------------------
create policy "notifications: owner read"
  on public.notifications for select using (user_id = auth.uid());

create policy "notifications: owner update"   -- mark as read
  on public.notifications for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- pricing_config  (public read, admin write)
-- -----------------------------------------------------------------------------
create policy "pricing_config: public read" on public.pricing_config for select using (true);
create policy "pricing_config: admin write" on public.pricing_config for all
  using (public.is_admin()) with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- Realtime publication — stream ride + offer + location changes to clients.
-- (Supabase listens on the `supabase_realtime` publication.)
-- -----------------------------------------------------------------------------
alter publication supabase_realtime add table public.rides;
alter publication supabase_realtime add table public.ride_offers;
alter publication supabase_realtime add table public.driver_locations;
alter publication supabase_realtime add table public.notifications;
