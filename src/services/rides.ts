import { supabase } from "./supabase";
import { mapRide, mapOffer, mapEarning } from "./mappers";
import { toGeoJSON } from "@/utils/geo";
import type {
  FareBreakdown,
  Place,
  PaymentMethod,
  Ride,
  RideStatus,
  VehicleClass,
} from "@/types";

/**
 * Ride service — all read/write paths for the trip lifecycle. State-changing
 * operations that must be atomic (accept, complete) go through SECURITY DEFINER
 * RPCs rather than raw table writes, so the database enforces the rules.
 */
export const rideService = {
  /** Server-side fare estimate (mirrors completion math; single source of truth). */
  async estimateFare(
    vehicleClass: VehicleClass,
    distanceM: number,
    durationS: number,
    surge = 1,
  ): Promise<FareBreakdown> {
    const { data, error } = await supabase
      .rpc("calculate_fare", {
        p_class: vehicleClass,
        p_distance_m: distanceM,
        p_duration_s: durationS,
        p_surge: surge,
      })
      .single();
    if (error) throw error;
    const r = data as Record<string, number | string>;
    return {
      baseFare: Number(r.base_fare),
      distanceFare: Number(r.distance_fare),
      timeFare: Number(r.time_fare),
      surgeAmount: Number(r.surge_amount),
      bookingFee: Number(r.booking_fee),
      totalAmount: Number(r.total_amount),
      currency: String(r.currency),
    };
  },

  /** Create a ride request, then kick off dispatch. Returns the new ride. */
  async createRide(args: {
    passengerId: string;
    pickup: Place;
    dropoff: Place;
    vehicleClass: VehicleClass;
    distanceM: number;
    durationS: number;
    fareEstimate: number;
    paymentMethod: PaymentMethod;
    routePolyline?: string;
  }): Promise<Ride> {
    const { data, error } = await supabase
      .from("rides")
      .insert({
        passenger_id: args.passengerId,
        pickup_address: args.pickup.address,
        pickup_point: toGeoJSON(args.pickup.point),
        dropoff_address: args.dropoff.address,
        dropoff_point: toGeoJSON(args.dropoff.point),
        vehicle_class: args.vehicleClass,
        distance_m: args.distanceM,
        duration_s: args.durationS,
        fare_estimate: args.fareEstimate,
        payment_method: args.paymentMethod,
        route_polyline: args.routePolyline ?? null,
        status: "requested",
      })
      .select("*")
      .single();
    if (error) throw error;

    // Kick off matching via the client-callable RPC (no edge function needed).
    // .then(noop, noop) keeps it non-blocking without an unhandled rejection.
    supabase.rpc("request_dispatch", { p_ride_id: data.id }).then(
      () => {},
      () => {},
    );
    return mapRide(data);
  },

  /** Re-trigger a dispatch wave (auto-reassign / radius expansion). */
  async pokeDispatch(rideId: string) {
    await supabase.rpc("request_dispatch", { p_ride_id: rideId });
  },

  async getRide(rideId: string): Promise<Ride> {
    const { data, error } = await supabase.from("rides").select("*").eq("id", rideId).single();
    if (error) throw error;
    return mapRide(data);
  },

  /** The caller's currently-live ride (passenger or driver), if any. */
  async getActiveRide(userId: string): Promise<Ride | null> {
    const live: RideStatus[] = ["requested", "matching", "accepted", "arriving", "arrived", "in_progress"];
    const { data, error } = await supabase
      .from("rides")
      .select("*")
      .or(`passenger_id.eq.${userId},driver_id.eq.${userId}`)
      .in("status", live)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data ? mapRide(data) : null;
  },

  async history(userId: string, role: "passenger" | "driver"): Promise<Ride[]> {
    const column = role === "driver" ? "driver_id" : "passenger_id";
    const { data, error } = await supabase
      .from("rides")
      .select("*")
      .eq(column, userId)
      .in("status", ["completed", "cancelled"])
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return (data ?? []).map(mapRide);
  },

  async cancelRide(rideId: string, by: "passenger" | "driver", reason?: string) {
    const { error } = await supabase
      .from("rides")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        cancelled_by: by,
        cancellation_reason: reason ?? null,
      })
      .eq("id", rideId);
    if (error) throw error;
  },

  // --- Driver-side -----------------------------------------------------------

  /** Incoming offers for the current driver (pending, not expired). */
  async getIncomingOffers(driverId: string) {
    const { data, error } = await supabase
      .from("ride_offers")
      .select("*, rides(*)")
      .eq("driver_id", driverId)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .order("offered_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row) => ({ offer: mapOffer(row), ride: mapRide(row.rides) }));
  },

  /** Atomic accept — returns true if this driver won the ride. */
  async acceptOffer(offerId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc("accept_ride_offer", { p_offer_id: offerId });
    if (error) throw error;
    return data === true;
  },

  async rejectOffer(offerId: string) {
    const { error } = await supabase
      .from("ride_offers")
      .update({ status: "rejected", responded_at: new Date().toISOString() })
      .eq("id", offerId);
    if (error) throw error;
  },

  /** Driver advances the trip state machine (arriving/arrived/in_progress). */
  async updateRideStatus(rideId: string, status: RideStatus) {
    const patch: Record<string, unknown> = { status };
    if (status === "arrived") patch.arrived_at = new Date().toISOString();
    if (status === "in_progress") patch.started_at = new Date().toISOString();
    const { error } = await supabase.from("rides").update(patch).eq("id", rideId);
    if (error) throw error;
  },

  /** Settle the trip: fare, payment + earnings written by the RPC. */
  async completeRide(rideId: string, distanceM: number, durationS: number) {
    const { error } = await supabase.rpc("complete_ride", {
      p_ride_id: rideId,
      p_distance_m: distanceM,
      p_duration_s: durationS,
    });
    if (error) throw error;
  },

  async setDriverStatus(status: "online" | "offline") {
    const { error } = await supabase.from("drivers").update({ status }).eq("id", (await supabase.auth.getUser()).data.user?.id ?? "");
    if (error) throw error;
  },

  async earnings(driverId: string) {
    const { data, error } = await supabase
      .from("earnings")
      .select("*")
      .eq("driver_id", driverId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return (data ?? []).map(mapEarning);
  },

  async rate(rideId: string, raterId: string, rateeId: string, score: number, comment?: string) {
    const { error } = await supabase.from("ratings").insert({
      ride_id: rideId,
      rater_id: raterId,
      ratee_id: rateeId,
      score,
      comment: comment ?? null,
    });
    if (error) throw error;
  },
};
