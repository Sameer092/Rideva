import { supabase } from '@library/supabase';
import { toEWKT } from '@library/location';

const LIVE = ['requested', 'matching', 'accepted', 'arriving', 'arrived', 'in_progress'];

export async function estimateFare(vehicle_class, distance_m, duration_s) {
  const { data, error } = await supabase
    .rpc('calculate_fare', { p_class: vehicle_class, p_distance_m: distance_m, p_duration_s: duration_s, p_surge: 1 })
    .single();
  if (error) throw error;
  return data;
}

export async function createRide(payload) {
  const { data, error } = await supabase
    .from('rides')
    .insert({
      passenger_id: payload.passenger_id,
      pickup_address: payload.pickup.address,
      pickup_point: toEWKT(payload.pickup.point),
      dropoff_address: payload.dropoff.address,
      dropoff_point: toEWKT(payload.dropoff.point),
      vehicle_class: payload.vehicle_class,
      distance_m: payload.distance_m,
      duration_s: payload.duration_s,
      fare_estimate: payload.offered_fare,
      offered_fare: payload.offered_fare,
      payment_method: 'cash',
      status: 'requested',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getActiveRide(userId) {
  const { data } = await supabase
    .from('rides')
    .select('*')
    .or(`passenger_id.eq.${userId},driver_id.eq.${userId}`)
    .in('status', LIVE)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data || null;
}

export async function cancelRide(rideId, by) {
  const { error } = await supabase
    .from('rides')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString(), cancelled_by: by })
    .eq('id', rideId);
  if (error) throw error;
}

export async function getRideBids(rideId) {
  const { data, error } = await supabase.rpc('ride_bids', { p_ride: rideId });
  if (error) throw error;
  return data || [];
}

export async function acceptBid(offerId) {
  const { data, error } = await supabase.rpc('accept_bid', { p_offer: offerId });
  if (error) throw error;
  return data === true;
}

export async function nearbyDrivers(point, vehicle_class) {
  const { data, error } = await supabase.rpc('nearby_drivers', {
    p_lng: point.longitude,
    p_lat: point.latitude,
    p_class: vehicle_class,
    p_radius_m: 6000,
  });
  if (error) throw error;
  return data || [];
}

export async function getRide(rideId) {
  const { data, error } = await supabase.from('rides').select('*').eq('id', rideId).single();
  if (error) throw error;
  return data;
}

export async function getDriverInfo(driverId) {
  const [{ data: profile }, { data: driver }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', driverId).maybeSingle(),
    supabase.from('drivers').select('*').eq('id', driverId).maybeSingle(),
  ]);
  return { profile, driver };
}

export async function getDriverLocation(rideId) {
  const { data } = await supabase
    .from('driver_locations')
    .select('point, heading')
    .eq('ride_id', rideId)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data || null;
}

export async function history(userId, role) {
  const column = role === 'driver' ? 'driver_id' : 'passenger_id';
  const { data } = await supabase
    .from('rides')
    .select('*')
    .eq(column, userId)
    .in('status', ['completed', 'cancelled'])
    .order('created_at', { ascending: false })
    .limit(50);
  return data || [];
}

export async function rate(rideId, raterId, rateeId, score, comment) {
  const { error } = await supabase
    .from('ratings')
    .insert({ ride_id: rideId, rater_id: raterId, ratee_id: rateeId, score, comment: comment || null });
  if (error) throw error;
}

export async function savedLocations() {
  const { data } = await supabase.from('saved_locations').select('*').order('created_at');
  return data || [];
}
