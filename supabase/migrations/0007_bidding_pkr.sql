-- =============================================================================
-- Rideva — inDrive-style bidding + PKR pricing + moto/rickshaw tariffs
-- =============================================================================
-- The matching model changes from "algorithm assigns nearest driver" to
-- "passenger names a fare → nearby drivers accept or counter-bid → passenger
-- picks one". Amounts are integer paisa (1 PKR = 100 paisa).
-- Run AFTER 0006 (which adds the motorcycle/rickshaw enum values).
-- =============================================================================

-- ---- PKR tariffs (suggested fares; passenger can adjust their offer) --------
delete from public.pricing_config;
insert into public.pricing_config (vehicle_class, currency, base_fare, per_km, per_min, booking_fee, min_fare) values
  ('motorcycle','PKR',  5000, 2500, 200,    0,  8000),
  ('rickshaw',  'PKR',  7000, 3500, 300,    0, 10000),
  ('economy',   'PKR', 15000, 5500, 400, 2000, 20000),
  ('comfort',   'PKR', 20000, 7000, 500, 3000, 30000),
  ('xl',        'PKR', 30000, 9000, 600, 4000, 40000),
  ('premium',   'PKR', 40000,12000, 700, 5000, 50000);

-- ---- New columns ------------------------------------------------------------
alter table public.rides       add column if not exists offered_fare integer;  -- passenger's offer (paisa)
alter table public.ride_offers add column if not exists bid_amount  integer;   -- driver's price (paisa)

-- A driver may now hold MULTIPLE pending bids (offer on several requests), so
-- drop the single-pending constraint from the old auto-dispatch model.
drop index if exists public.ride_offers_one_pending_per_driver;

-- ---- Driver feed: nearby open requests for the current driver ---------------
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
         r.offered_fare, r.currency,
         r.distance_m, r.duration_s,
         st_distance(d.current_location, r.pickup_point)::int,
         (st_distance(d.current_location, r.pickup_point) / 8.33)::int,
         r.vehicle_class, r.requested_at
  from public.rides r
  join public.drivers d on d.id = auth.uid()
  where r.status in ('requested','matching')
    and r.driver_id is null
    -- (vehicle_class match intentionally relaxed so any online driver can see
    --  all nearby requests — simplifies testing with a single driver account)
    and d.current_location is not null
    and st_dwithin(d.current_location, r.pickup_point, p_radius_m)
    and not exists (
      select 1 from public.ride_offers o
      where o.ride_id = r.id and o.driver_id = auth.uid() and o.status in ('pending','accepted')
    )
  order by r.requested_at desc
  limit 25;
$$;

-- ---- Driver submits / updates a bid (accept-at-offer or counter) ------------
create or replace function public.submit_bid(p_ride uuid, p_amount integer)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_ride public.rides%rowtype;
  v_loc  geography;
  v_dist integer;
begin
  if p_amount is null or p_amount <= 0 then raise exception 'invalid amount'; end if;
  select * into v_ride from public.rides where id = p_ride;
  if not found then raise exception 'ride not found'; end if;
  if v_ride.driver_id is not null or v_ride.status not in ('requested','matching') then
    return jsonb_build_object('ok', false, 'reason', 'closed');
  end if;

  select current_location into v_loc from public.drivers where id = auth.uid();
  v_dist := coalesce(st_distance(v_loc, v_ride.pickup_point)::int, 0);

  insert into public.ride_offers (ride_id, driver_id, status, bid_amount, distance_m, eta_s, expires_at)
  values (p_ride, auth.uid(), 'pending', p_amount, v_dist, (v_dist / 8.33)::int, now() + interval '3 minutes')
  on conflict (ride_id, driver_id) do update
    set bid_amount = excluded.bid_amount, status = 'pending',
        distance_m = excluded.distance_m, eta_s = excluded.eta_s,
        expires_at = excluded.expires_at, offered_at = now();

  update public.rides set status = 'matching' where id = p_ride and status = 'requested';

  insert into public.notifications (user_id, type, title, body, data)
  values (v_ride.passenger_id, 'ride_requested', 'New driver offer',
          'A driver sent you an offer', jsonb_build_object('ride_id', p_ride));
  return jsonb_build_object('ok', true);
end$$;

-- ---- Passenger views enriched bids for their ride ---------------------------
create or replace function public.ride_bids(p_ride uuid)
returns table (
  offer_id uuid, driver_id uuid, bid_amount integer, distance_m integer, eta_s integer,
  driver_name text, rating numeric, total_trips integer,
  vehicle_make text, vehicle_model text, vehicle_color text, license_plate text
)
language sql stable security definer set search_path = public as $$
  select o.id, o.driver_id, o.bid_amount, o.distance_m, o.eta_s,
         p.full_name, p.rating_avg, coalesce(d.total_trips, 0),
         d.vehicle_make, d.vehicle_model, d.vehicle_color, d.license_plate
  from public.ride_offers o
  join public.rides r    on r.id = o.ride_id
  join public.profiles p on p.id = o.driver_id
  left join public.drivers d on d.id = o.driver_id
  where o.ride_id = p_ride and o.status = 'pending' and r.passenger_id = auth.uid()
  order by o.bid_amount asc, o.distance_m asc;
$$;

-- ---- Passenger accepts a specific bid ---------------------------------------
create or replace function public.accept_bid(p_offer uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  v_offer public.ride_offers%rowtype;
  v_ride  public.rides%rowtype;
begin
  select * into v_offer from public.ride_offers where id = p_offer for update;
  if not found then raise exception 'offer not found'; end if;
  select * into v_ride from public.rides where id = v_offer.ride_id for update;
  if v_ride.passenger_id <> auth.uid() then raise exception 'not your ride'; end if;
  if v_ride.driver_id is not null or v_ride.status not in ('requested','matching') then
    return false;
  end if;

  update public.rides
     set driver_id = v_offer.driver_id, status = 'accepted',
         accepted_at = now(), fare_final = v_offer.bid_amount
   where id = v_ride.id;

  update public.ride_offers set status = 'accepted', responded_at = now() where id = p_offer;
  update public.ride_offers set status = 'expired',  responded_at = now()
   where ride_id = v_ride.id and id <> p_offer and status = 'pending';
  -- free this driver's bids on other requests
  update public.ride_offers set status = 'expired', responded_at = now()
   where driver_id = v_offer.driver_id and ride_id <> v_ride.id and status = 'pending';

  update public.drivers set status = 'on_trip' where id = v_offer.driver_id;

  insert into public.notifications (user_id, type, title, body, data)
  values (v_offer.driver_id, 'ride_accepted', 'Offer accepted!',
          'Your offer was accepted — head to pickup.', jsonb_build_object('ride_id', v_ride.id));
  return true;
end$$;

-- ---- complete_ride: settle at the AGREED price (bid), not a recompute -------
create or replace function public.complete_ride(p_ride_id uuid, p_distance_m integer, p_duration_s integer)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_ride public.rides%rowtype;
  f record;
  v_total integer;
  v_platform_bps integer;
  v_platform_fee integer;
  v_payment_id uuid;
begin
  select * into v_ride from public.rides where id = p_ride_id for update;
  if not found then raise exception 'Ride not found'; end if;
  if v_ride.driver_id <> auth.uid() then raise exception 'Only the assigned driver can complete the ride'; end if;
  if v_ride.status <> 'in_progress' then raise exception 'Ride is not in progress'; end if;

  select * into f from public.calculate_fare(v_ride.vehicle_class, p_distance_m, p_duration_s, v_ride.surge_multiplier);
  -- Agreed (bid) price wins; fall back to the computed tariff if none.
  v_total := coalesce(v_ride.fare_final, f.total_amount);
  select platform_fee_bps into v_platform_bps from public.pricing_config where vehicle_class = v_ride.vehicle_class;

  update public.rides
     set status = 'completed', completed_at = now(),
         distance_m = p_distance_m, duration_s = p_duration_s, fare_final = v_total
   where id = p_ride_id;

  insert into public.payments (ride_id, payer_id, method, status, currency,
    base_fare, distance_fare, time_fare, surge_amount, booking_fee, total_amount)
  values (p_ride_id, v_ride.passenger_id, v_ride.payment_method,
    case when v_ride.payment_method = 'cash' then 'paid' else 'pending' end,
    f.currency, f.base_fare, f.distance_fare, f.time_fare, f.surge_amount, f.booking_fee, v_total)
  returning id into v_payment_id;

  v_platform_fee := floor(v_total * v_platform_bps / 10000.0)::integer;
  insert into public.earnings (driver_id, ride_id, payment_id, currency, gross_amount, platform_fee, net_amount)
  values (v_ride.driver_id, p_ride_id, v_payment_id, f.currency, v_total, v_platform_fee, v_total - v_platform_fee);

  update public.drivers set status = 'online', total_trips = total_trips + 1 where id = v_ride.driver_id;
end$$;

grant execute on function public.nearby_open_rides(integer) to authenticated;
grant execute on function public.submit_bid(uuid, integer) to authenticated;
grant execute on function public.ride_bids(uuid) to authenticated;
grant execute on function public.accept_bid(uuid) to authenticated;
