-- =============================================================================
-- Rideva — Fix complete_ride payment_status cast
-- =============================================================================
-- complete_ride failed with 42804: the CASE that picks 'paid'/'pending' yields
-- `text`, but payments.status is the `payment_status` enum, so the INSERT was
-- rejected and the ride could never complete. Cast the CASE to payment_status.
-- Run this once in the SQL Editor.
-- =============================================================================

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
  v_total := coalesce(v_ride.fare_final, f.total_amount);
  select platform_fee_bps into v_platform_bps from public.pricing_config where vehicle_class = v_ride.vehicle_class;

  update public.rides
     set status = 'completed', completed_at = now(),
         distance_m = p_distance_m, duration_s = p_duration_s, fare_final = v_total
   where id = p_ride_id;

  insert into public.payments (ride_id, payer_id, method, status, currency,
    base_fare, distance_fare, time_fare, surge_amount, booking_fee, total_amount)
  values (p_ride_id, v_ride.passenger_id, v_ride.payment_method,
    (case when v_ride.payment_method = 'cash' then 'paid' else 'pending' end)::payment_status,
    f.currency, f.base_fare, f.distance_fare, f.time_fare, f.surge_amount, f.booking_fee, v_total)
  on conflict (ride_id) do nothing
  returning id into v_payment_id;

  v_platform_fee := floor(v_total * v_platform_bps / 10000.0)::integer;
  insert into public.earnings (driver_id, ride_id, payment_id, currency, gross_amount, platform_fee, net_amount)
  values (v_ride.driver_id, p_ride_id, v_payment_id, f.currency, v_total, v_platform_fee, v_total - v_platform_fee)
  on conflict (ride_id) do nothing;

  update public.drivers set status = 'online', total_trips = total_trips + 1 where id = v_ride.driver_id;
end$$;
