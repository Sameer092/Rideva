-- =============================================================================
-- Rideva — Functions, Triggers & Stored Procedures
-- =============================================================================
-- Business logic that must live close to the data:
--   * updated_at maintenance
--   * profile auto-provisioning from auth signup
--   * rating aggregation
--   * fare calculation (pure SQL, mirrors the edge-function math)
--   * nearest-driver matching (PostGIS KNN)
--   * atomic offer acceptance (prevents double-booking under concurrency)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- generic: touch updated_at
-- -----------------------------------------------------------------------------
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end$$;

create trigger profiles_set_updated_at  before update on public.profiles
  for each row execute function public.tg_set_updated_at();
create trigger drivers_set_updated_at   before update on public.drivers
  for each row execute function public.tg_set_updated_at();
create trigger rides_set_updated_at     before update on public.rides
  for each row execute function public.tg_set_updated_at();
create trigger payments_set_updated_at  before update on public.payments
  for each row execute function public.tg_set_updated_at();

-- -----------------------------------------------------------------------------
-- auth → profiles provisioning
-- When a new auth.users row is created, mirror it into public.profiles.
-- Role + name are read from the signup metadata (raw_user_meta_data).
-- -----------------------------------------------------------------------------
create or replace function public.tg_handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_role user_role;
begin
  v_role := coalesce((new.raw_user_meta_data->>'role')::user_role, 'passenger');

  insert into public.profiles (id, role, full_name, email, phone)
  values (
    new.id,
    v_role,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'phone'
  )
  on conflict (id) do nothing;

  -- bootstrap a drivers row so the driver can immediately go online (pending verify)
  if v_role = 'driver' then
    insert into public.drivers (id) values (new.id) on conflict (id) do nothing;
  end if;

  return new;
end$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.tg_handle_new_user();

-- -----------------------------------------------------------------------------
-- ratings → recompute ratee aggregate
-- -----------------------------------------------------------------------------
create or replace function public.tg_recompute_rating()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_avg numeric(3,2);
  v_cnt integer;
begin
  select round(avg(score)::numeric, 2), count(*)
    into v_avg, v_cnt
    from public.ratings where ratee_id = new.ratee_id;

  update public.profiles
     set rating_avg = coalesce(v_avg, 5.00), rating_count = v_cnt
   where id = new.ratee_id;

  return new;
end$$;

create trigger ratings_recompute
  after insert on public.ratings
  for each row execute function public.tg_recompute_rating();

-- -----------------------------------------------------------------------------
-- helper: current user's role (used by RLS predicates)
-- -----------------------------------------------------------------------------
create or replace function public.app_role()
returns user_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- -----------------------------------------------------------------------------
-- fare calculation (pure, deterministic). Returns the breakdown as a row.
-- distance_m / duration_s are the planned route metrics; surge defaults to 1.
-- -----------------------------------------------------------------------------
create or replace function public.calculate_fare(
  p_class      vehicle_class,
  p_distance_m integer,
  p_duration_s integer,
  p_surge      numeric default 1.00
)
returns table (
  base_fare     integer,
  distance_fare integer,
  time_fare     integer,
  surge_amount  integer,
  booking_fee   integer,
  total_amount  integer,
  currency      char(3)
)
language plpgsql stable as $$
declare
  c public.pricing_config%rowtype;
  subtotal integer;
  surged   integer;
begin
  select * into c from public.pricing_config where vehicle_class = p_class;
  if not found then
    raise exception 'No pricing config for class %', p_class;
  end if;

  base_fare     := c.base_fare;
  distance_fare := ceil((p_distance_m::numeric / 1000.0) * c.per_km)::integer;
  time_fare     := ceil((p_duration_s::numeric / 60.0) * c.per_min)::integer;
  booking_fee   := c.booking_fee;

  subtotal := base_fare + distance_fare + time_fare;
  surged   := ceil(subtotal * greatest(p_surge, 1.0))::integer;
  surge_amount := surged - subtotal;

  total_amount := greatest(surged + booking_fee, c.min_fare);
  currency := c.currency;
  return next;
end$$;

-- -----------------------------------------------------------------------------
-- nearest-driver matching (KNN with PostGIS <-> operator).
-- Returns online, verified drivers of the requested class, sorted by distance,
-- excluding those who already rejected/expired an offer for this ride and
-- those currently holding a pending offer or on a trip.
-- -----------------------------------------------------------------------------
create or replace function public.find_nearby_drivers(
  p_ride_id   uuid,
  p_pickup    geography,
  p_class     vehicle_class,
  p_radius_m  integer default 5000,
  p_limit     integer default 10
)
returns table (
  driver_id  uuid,
  distance_m integer,
  eta_s      integer
)
language sql stable security definer set search_path = public as $$
  select d.id as driver_id,
         st_distance(d.current_location, p_pickup)::integer as distance_m,
         -- crude ETA: distance / 8.33 m/s (~30km/h urban average)
         (st_distance(d.current_location, p_pickup) / 8.33)::integer as eta_s
  from public.drivers d
  where d.status = 'online'
    and d.is_verified = true
    and d.vehicle_class = p_class
    and d.current_location is not null
    and d.location_updated_at > now() - interval '60 seconds'
    and st_dwithin(d.current_location, p_pickup, p_radius_m)
    -- not already offered this ride (and rejected/expired)
    and not exists (
      select 1 from public.ride_offers o
      where o.ride_id = p_ride_id and o.driver_id = d.id
    )
    -- no other pending offer outstanding
    and not exists (
      select 1 from public.ride_offers o
      where o.driver_id = d.id and o.status = 'pending'
    )
  order by d.current_location <-> p_pickup     -- KNN index scan
  limit p_limit;
$$;

-- -----------------------------------------------------------------------------
-- accept_ride_offer — atomic, race-safe acceptance.
-- The first driver to accept wins; everyone else's pending offer is voided and
-- the ride is locked to the winner. Returns true if this caller won.
-- -----------------------------------------------------------------------------
create or replace function public.accept_ride_offer(p_offer_id uuid)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_offer public.ride_offers%rowtype;
  v_ride  public.rides%rowtype;
begin
  -- lock the offer row
  select * into v_offer from public.ride_offers where id = p_offer_id for update;
  if not found then raise exception 'Offer not found'; end if;
  if v_offer.driver_id <> auth.uid() then raise exception 'Not your offer'; end if;
  if v_offer.status <> 'pending' then return false; end if;
  if v_offer.expires_at < now() then
    update public.ride_offers set status = 'expired', responded_at = now() where id = p_offer_id;
    return false;
  end if;

  -- lock the ride; only assignable if still unassigned
  select * into v_ride from public.rides where id = v_offer.ride_id for update;
  if v_ride.status not in ('requested','matching') or v_ride.driver_id is not null then
    update public.ride_offers set status = 'expired', responded_at = now() where id = p_offer_id;
    return false;   -- someone else already won
  end if;

  -- win: assign ride, accept this offer, expire siblings
  update public.rides
     set driver_id = v_offer.driver_id,
         status = 'accepted',
         accepted_at = now()
   where id = v_ride.id;

  update public.ride_offers set status = 'accepted', responded_at = now() where id = p_offer_id;
  update public.ride_offers
     set status = 'expired', responded_at = now()
   where ride_id = v_ride.id and id <> p_offer_id and status = 'pending';

  update public.drivers set status = 'on_trip' where id = v_offer.driver_id;
  return true;
end$$;

-- -----------------------------------------------------------------------------
-- complete_ride — settle fare, write payment + earnings, free the driver.
-- -----------------------------------------------------------------------------
create or replace function public.complete_ride(
  p_ride_id     uuid,
  p_distance_m  integer,
  p_duration_s  integer
)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_ride public.rides%rowtype;
  f      record;
  v_platform_bps integer;
  v_platform_fee integer;
  v_payment_id   uuid;
begin
  select * into v_ride from public.rides where id = p_ride_id for update;
  if not found then raise exception 'Ride not found'; end if;
  if v_ride.driver_id <> auth.uid() then raise exception 'Only the assigned driver can complete the ride'; end if;
  if v_ride.status <> 'in_progress' then raise exception 'Ride is not in progress'; end if;

  select * into f from public.calculate_fare(v_ride.vehicle_class, p_distance_m, p_duration_s, v_ride.surge_multiplier);
  select platform_fee_bps into v_platform_bps from public.pricing_config where vehicle_class = v_ride.vehicle_class;

  update public.rides
     set status = 'completed',
         completed_at = now(),
         distance_m = p_distance_m,
         duration_s = p_duration_s,
         fare_final = f.total_amount
   where id = p_ride_id;

  insert into public.payments (
    ride_id, payer_id, method, status, currency,
    base_fare, distance_fare, time_fare, surge_amount, booking_fee, total_amount
  ) values (
    p_ride_id, v_ride.passenger_id, v_ride.payment_method,
    case when v_ride.payment_method = 'cash' then 'paid' else 'pending' end,
    f.currency, f.base_fare, f.distance_fare, f.time_fare, f.surge_amount, f.booking_fee, f.total_amount
  ) returning id into v_payment_id;

  v_platform_fee := floor(f.total_amount * v_platform_bps / 10000.0)::integer;
  insert into public.earnings (driver_id, ride_id, payment_id, currency, gross_amount, platform_fee, net_amount)
  values (v_ride.driver_id, p_ride_id, v_payment_id, f.currency, f.total_amount, v_platform_fee, f.total_amount - v_platform_fee);

  update public.drivers
     set status = 'online', total_trips = total_trips + 1
   where id = v_ride.driver_id;
end$$;

-- -----------------------------------------------------------------------------
-- update_driver_location — single entry point for the location stream.
-- Updates the denormalised live column AND appends to the time-series table.
-- -----------------------------------------------------------------------------
create or replace function public.update_driver_location(
  p_lng       double precision,
  p_lat       double precision,
  p_heading   numeric default null,
  p_speed_kmh numeric default null,
  p_ride_id   uuid default null
)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_point geography := st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography;
begin
  update public.drivers
     set current_location = v_point,
         heading = p_heading,
         speed_kmh = p_speed_kmh,
         location_updated_at = now()
   where id = auth.uid();

  insert into public.driver_locations (driver_id, ride_id, point, heading, speed_kmh)
  values (auth.uid(), p_ride_id, v_point, p_heading, p_speed_kmh);
end$$;
