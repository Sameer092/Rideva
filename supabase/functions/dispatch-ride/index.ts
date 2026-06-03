// =============================================================================
// Edge Function: dispatch-ride
// =============================================================================
// The driver-matching dispatcher. Invoked when a passenger creates a ride
// request. Implements sequential offer dispatch with time-based fallback:
//
//   1. Find the N nearest eligible drivers (find_nearby_drivers RPC).
//   2. Offer the ride to the closest driver, give them OFFER_TTL_S to accept.
//   3. If they reject / time out, the next dispatch cycle offers the next driver
//      (auto-reassign). Drivers self-accept via the accept_ride_offer RPC.
//   4. After MAX_WAVES with no acceptance, expand the radius; finally mark
//      the ride 'no_drivers'.
//
// This function is designed to be invoked repeatedly (once per wave) — either
// by the client on a timer, by a pg_cron job, or chained via the Realtime
// hook. It is idempotent per wave and never double-books a driver because
// `ride_offers_one_pending_per_driver` + `accept_ride_offer` enforce atomicity.
// =============================================================================

import { createClient } from "jsr:@supabase/supabase-js@2";

const OFFER_TTL_S = 15; // seconds a driver has to accept
const BASE_RADIUS_M = 4000;
const RADIUS_STEP_M = 3000;
const MAX_WAVES = 6;
const OFFERS_PER_WAVE = 1;

interface DispatchBody {
  ride_id: string;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  let body: DispatchBody;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  if (!body.ride_id) return json({ error: "ride_id required" }, 400);

  // Load ride
  const { data: ride, error: rideErr } = await admin
    .from("rides")
    .select("*")
    .eq("id", body.ride_id)
    .single();
  if (rideErr || !ride) return json({ error: "Ride not found" }, 404);

  // Terminal / already-assigned states: nothing to do.
  if (ride.driver_id || !["requested", "matching"].includes(ride.status)) {
    return json({ status: ride.status, assigned: !!ride.driver_id });
  }

  // Count how many offer-waves we've already dispatched.
  const { count: offersSoFar } = await admin
    .from("ride_offers")
    .select("*", { count: "exact", head: true })
    .eq("ride_id", body.ride_id);

  const wave = Math.floor((offersSoFar ?? 0) / OFFERS_PER_WAVE);
  if (wave >= MAX_WAVES) {
    await admin.from("rides")
      .update({ status: "no_drivers" })
      .eq("id", body.ride_id)
      .in("status", ["requested", "matching"]);
    await notify(admin, ride.passenger_id, {
      type: "ride_cancelled",
      title: "No drivers available",
      body: "We couldn't find a driver nearby. Please try again.",
      data: { ride_id: body.ride_id },
    });
    return json({ status: "no_drivers" });
  }

  // Expand the search radius each wave (time-based fallback widening).
  const radius = BASE_RADIUS_M + wave * RADIUS_STEP_M;

  const { data: candidates, error: candErr } = await admin.rpc("find_nearby_drivers", {
    p_ride_id: body.ride_id,
    p_pickup: ride.pickup_point,
    p_class: ride.vehicle_class,
    p_radius_m: radius,
    p_limit: OFFERS_PER_WAVE,
  });
  if (candErr) return json({ error: candErr.message }, 500);

  if (!candidates || candidates.length === 0) {
    // No new candidate this wave; flip to 'matching' so the client keeps polling.
    await admin.from("rides").update({ status: "matching" }).eq("id", body.ride_id)
      .eq("status", "requested");
    return json({ status: "matching", wave, radius, offered: 0 });
  }

  const expiresAt = new Date(Date.now() + OFFER_TTL_S * 1000).toISOString();
  const offers = candidates.map((c: { driver_id: string; distance_m: number; eta_s: number }) => ({
    ride_id: body.ride_id,
    driver_id: c.driver_id,
    distance_m: c.distance_m,
    eta_s: c.eta_s,
    status: "pending",
    expires_at: expiresAt,
  }));

  // Insert offers; the partial unique index quietly drops drivers who already
  // hold a pending offer (race with another ride's dispatcher).
  const { data: inserted } = await admin
    .from("ride_offers")
    .upsert(offers, { onConflict: "ride_id,driver_id", ignoreDuplicates: true })
    .select("driver_id");

  await admin.from("rides").update({ status: "matching" }).eq("id", body.ride_id)
    .eq("status", "requested");

  // Push-notify each offered driver.
  for (const o of inserted ?? []) {
    await notify(admin, o.driver_id, {
      type: "ride_requested",
      title: "New ride request",
      body: `Pickup: ${ride.pickup_address}`,
      data: { ride_id: body.ride_id },
    });
  }

  return json({ status: "matching", wave, radius, offered: inserted?.length ?? 0, expires_at: expiresAt });
});

// --- helpers ---------------------------------------------------------------

interface NotifyPayload {
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
}

async function notify(admin: ReturnType<typeof createClient>, userId: string, p: NotifyPayload) {
  // Persist to the in-app feed (Realtime delivers it instantly to the device).
  await admin.from("notifications").insert({
    user_id: userId,
    type: p.type,
    title: p.title,
    body: p.body,
    data: p.data,
  });
  // Fire-and-forget push via the send-push function (Expo).
  try {
    await admin.functions.invoke("send-push", {
      body: { user_id: userId, title: p.title, body: p.body, data: p.data },
    });
  } catch (_) { /* best-effort */ }
}

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
