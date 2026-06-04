-- =============================================================================
-- Rideva — Client-callable dispatch (demo-friendly matching)
-- =============================================================================
-- The production matching path is the `dispatch-ride` edge function (invoked
-- with the service role). To let the app match drivers WITHOUT deploying edge
-- functions, this adds a SECURITY DEFINER RPC the passenger can call directly:
-- it finds the nearest eligible driver, creates a pending offer + notification,
-- and widens the search radius on each subsequent call (auto-reassign).
--
-- Run this once in the Supabase SQL Editor (it's additive — safe to re-run).
-- =============================================================================

-- Loosen the driver "freshness" window from 60s → 5 min so a seeded/online
-- driver still matches comfortably during manual testing.
create or replace function public.find_nearby_drivers(
  p_ride_id   uuid,
  p_pickup    geography,
  p_class     vehicle_class,
  p_radius_m  integer default 5000,
  p_limit     integer default 10
)
returns table (driver_id uuid, distance_m integer, eta_s integer)
language sql stable security definer set search_path = public as $$
  select d.id,
         st_distance(d.current_location, p_pickup)::integer,
         (st_distance(d.current_location, p_pickup) / 8.33)::integer
  from public.drivers d
  where d.status = 'online'
    and d.is_verified = true
    and d.vehicle_class = p_class
    and d.current_location is not null
    and d.location_updated_at > now() - interval '5 minutes'
    and st_dwithin(d.current_location, p_pickup, p_radius_m)
    and not exists (select 1 from public.ride_offers o where o.ride_id = p_ride_id and o.driver_id = d.id)
    and not exists (select 1 from public.ride_offers o where o.driver_id = d.id and o.status = 'pending')
  order by d.current_location <-> p_pickup
  limit p_limit;
$$;

-- Client-callable dispatcher. Returns a JSON status the app can inspect.
create or replace function public.request_dispatch(p_ride_id uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_ride    public.rides%rowtype;
  v_wave    integer;
  v_radius  integer;
  v_cand    record;
  v_expires timestamptz;
begin
  -- Expire any stale pending offers first (no background worker in this setup).
  update public.ride_offers set status = 'expired', responded_at = now()
   where status = 'pending' and expires_at < now();

  select * into v_ride from public.rides where id = p_ride_id;
  if not found then return jsonb_build_object('error', 'ride not found'); end if;

  -- Only the ride's passenger (or an admin) may trigger dispatch.
  if v_ride.passenger_id <> auth.uid() and not public.is_admin() then
    raise exception 'not allowed';
  end if;

  -- Already assigned or finished → nothing to do.
  if v_ride.driver_id is not null or v_ride.status not in ('requested', 'matching') then
    return jsonb_build_object('status', v_ride.status, 'assigned', v_ride.driver_id is not null);
  end if;

  select count(*) into v_wave from public.ride_offers where ride_id = p_ride_id;
  if v_wave >= 6 then
    update public.rides set status = 'no_drivers'
     where id = p_ride_id and status in ('requested', 'matching');
    return jsonb_build_object('status', 'no_drivers');
  end if;

  v_radius := 4000 + v_wave * 3000;   -- widen each wave

  select * into v_cand
    from public.find_nearby_drivers(p_ride_id, v_ride.pickup_point, v_ride.vehicle_class, v_radius, 1)
   limit 1;

  update public.rides set status = 'matching' where id = p_ride_id and status = 'requested';

  if v_cand.driver_id is null then
    return jsonb_build_object('status', 'matching', 'offered', 0, 'radius', v_radius);
  end if;

  v_expires := now() + interval '20 seconds';
  insert into public.ride_offers (ride_id, driver_id, status, distance_m, eta_s, expires_at)
  values (p_ride_id, v_cand.driver_id, 'pending', v_cand.distance_m, v_cand.eta_s, v_expires)
  on conflict (ride_id, driver_id) do nothing;

  insert into public.notifications (user_id, type, title, body, data)
  values (v_cand.driver_id, 'ride_requested', 'New ride request', v_ride.pickup_address,
          jsonb_build_object('ride_id', p_ride_id));

  return jsonb_build_object('status', 'matching', 'offered', 1, 'driver_id', v_cand.driver_id, 'radius', v_radius);
end$$;

grant execute on function public.request_dispatch(uuid) to authenticated;
grant execute on function public.find_nearby_drivers(uuid, geography, vehicle_class, integer, integer) to authenticated;
