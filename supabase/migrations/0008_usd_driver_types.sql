-- =============================================================================
-- Rideva — Back to USD + per-vehicle-type driver matching + nearby-drivers map
-- =============================================================================
-- 1. USD tariffs (cents) for all six vehicle classes.
-- 2. Drivers choose their vehicle type at signup (read from auth metadata);
--    drivers are auto-verified for demo convenience.
-- 3. Re-enable vehicle-class matching in the request feed (bike→bike, car→car…).
-- 4. nearby_drivers(): drivers of a class near a point, for the passenger map.
-- =============================================================================

-- ---- 1. USD tariffs ---------------------------------------------------------
delete from public.pricing_config;
insert into public.pricing_config (vehicle_class, currency, base_fare, per_km, per_min, booking_fee, min_fare) values
  ('motorcycle','USD', 150,  70, 10,   0, 300),
  ('rickshaw',  'USD', 200,  90, 15,   0, 350),
  ('economy',   'USD', 250, 120, 25, 100, 500),
  ('comfort',   'USD', 350, 160, 35, 150, 700),
  ('xl',        'USD', 450, 200, 45, 200, 900),
  ('premium',   'USD', 600, 280, 60, 250,1200);

-- keep new rides in USD
alter table public.rides alter column currency set default 'USD';

-- ---- 2. Driver vehicle type at signup (+ auto-verify for demo) --------------
create or replace function public.tg_handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_role  user_role;
  v_class vehicle_class;
begin
  v_role  := coalesce((new.raw_user_meta_data->>'role')::user_role, 'passenger');

  insert into public.profiles (id, role, full_name, email, phone)
  values (
    new.id, v_role,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email, new.raw_user_meta_data->>'phone'
  ) on conflict (id) do nothing;

  if v_role = 'driver' then
    -- vehicle_class from signup metadata (fallback economy); auto-verified.
    begin
      v_class := coalesce((new.raw_user_meta_data->>'vehicle_class')::vehicle_class, 'economy');
    exception when others then v_class := 'economy';
    end;
    insert into public.drivers (id, vehicle_class, is_verified, status)
    values (new.id, v_class, true, 'offline')
    on conflict (id) do update set vehicle_class = excluded.vehicle_class, is_verified = true;
  end if;

  return new;
end$$;

-- ---- 3. Re-enable per-class matching in the request feed --------------------
create or replace function public.nearby_open_rides(p_radius_m integer default 10000)
returns table (
  ride_id uuid, pickup_address text, dropoff_address text,
  offered_fare integer, currency char(3),
  trip_distance_m integer, trip_duration_s integer,
  pickup_distance_m integer, eta_s integer,
  vehicle_class vehicle_class, requested_at timestamptz
)
language sql stable security definer set search_path = public as $$
  select r.id, r.pickup_address, r.dropoff_address,
         r.offered_fare, r.currency, r.distance_m, r.duration_s,
         st_distance(d.current_location, r.pickup_point)::int,
         (st_distance(d.current_location, r.pickup_point) / 8.33)::int,
         r.vehicle_class, r.requested_at
  from public.rides r
  join public.drivers d on d.id = auth.uid()
  where r.status in ('requested','matching')
    and r.driver_id is null
    and r.vehicle_class = d.vehicle_class          -- bike→bike, car→car, …
    and d.current_location is not null
    and st_dwithin(d.current_location, r.pickup_point, p_radius_m)
    and not exists (
      select 1 from public.ride_offers o
      where o.ride_id = r.id and o.driver_id = auth.uid() and o.status in ('pending','accepted')
    )
  order by r.requested_at desc
  limit 25;
$$;

-- ---- 4. Nearby drivers of a class, for the passenger's map ------------------
create or replace function public.nearby_drivers(
  p_lng double precision, p_lat double precision, p_class vehicle_class, p_radius_m integer default 6000
)
returns table (driver_id uuid, lat double precision, lng double precision, vehicle_class vehicle_class, heading numeric)
language sql stable security definer set search_path = public as $$
  select d.id,
         st_y(d.current_location::geometry),
         st_x(d.current_location::geometry),
         d.vehicle_class, d.heading
  from public.drivers d
  where d.status in ('online','on_trip')
    and d.current_location is not null
    and d.vehicle_class = p_class
    and st_dwithin(d.current_location, st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography, p_radius_m)
  limit 40;
$$;

grant execute on function public.nearby_drivers(double precision, double precision, vehicle_class, integer) to authenticated;
