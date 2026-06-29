import { supabase } from '@library/supabase';

export async function setStatus(userId, status) {
  const { error } = await supabase.from('drivers').update({ status }).eq('id', userId);
  if (error) throw error;
}

export async function nearbyRequests() {
  const { data, error } = await supabase.rpc('nearby_open_rides', { p_radius_m: 12000 });
  if (error) throw error;
  return data || [];
}

export async function submitBid(rideId, amount) {
  const { error } = await supabase.rpc('submit_bid', { p_ride: rideId, p_amount: amount });
  if (error) throw error;
}

export async function updateRideStatus(rideId, status) {
  const patch = { status };
  if (status === 'arrived') patch.arrived_at = new Date().toISOString();
  if (status === 'in_progress') patch.started_at = new Date().toISOString();
  const { error } = await supabase.from('rides').update(patch).eq('id', rideId);
  if (error) throw error;
}

export async function completeRide(rideId, distance, duration) {
  const { error } = await supabase.rpc('complete_ride', {
    p_ride_id: rideId,
    p_distance_m: distance,
    p_duration_s: duration,
  });
  if (error) throw error;
}

export async function getEarnings(userId) {
  const { data } = await supabase
    .from('earnings')
    .select('*')
    .eq('driver_id', userId)
    .order('created_at', { ascending: false })
    .limit(200);
  return data || [];
}

export async function pushLocation(point, heading, speed, rideId) {
  await supabase.rpc('update_driver_location', {
    p_lng: point.longitude,
    p_lat: point.latitude,
    p_heading: heading,
    p_speed_kmh: speed,
    p_ride_id: rideId,
  });
}
