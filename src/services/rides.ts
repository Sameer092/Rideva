import { supabase } from "./supabase";
import { mapRide, mapEarning } from "./mappers";
import { toEWKT } from "@/utils/geo";
import type {
  FareBreakdown,
  Place,
  PaymentMethod,
  Ride,
  RideStatus,
  VehicleClass,
  DriverBid,
  NearbyRequest,
  NearbyDriver,
  LatLng,
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

  /**
   * Create a ride request with the passenger's OFFERED fare (inDrive bidding).
   * Nearby drivers then bid; the passenger accepts one. Returns the new ride.
   */
  async createRide(args: {
    passengerId: string;
    pickup: Place;
    dropoff: Place;
    vehicleClass: VehicleClass;
    distanceM: number;
    durationS: number;
    offeredFare: number;
    paymentMethod: PaymentMethod;
    routePolyline?: string;
  }): Promise<Ride> {
    const { data, error } = await supabase
      .from("rides")
      .insert({
        passenger_id: args.passengerId,
        pickup_address: args.pickup.address,
        pickup_point: toEWKT(args.pickup.point),
        dropoff_address: args.dropoff.address,
        dropoff_point: toEWKT(args.dropoff.point),
        vehicle_class: args.vehicleClass,
        distance_m: args.distanceM,
        duration_s: args.durationS,
        fare_estimate: args.offeredFare,
        offered_fare: args.offeredFare,
        payment_method: args.paymentMethod,
        route_polyline: args.routePolyline ?? null,
        status: "requested",
      })
      .select("*")
      .single();
    if (error) throw error;
    return mapRide(data);
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

  // --- inDrive bidding: passenger side --------------------------------------

  /** Live list of driver bids on a ride (enriched with driver info). */
  async getRideBids(rideId: string): Promise<DriverBid[]> {
    const { data, error } = await supabase.rpc("ride_bids", { p_ride: rideId });
    if (error) throw error;
    /* eslint-disable @typescript-eslint/no-explicit-any */
    return (data ?? []).map((r: any) => ({
      offerId: r.offer_id,
      driverId: r.driver_id,
      bidAmount: r.bid_amount,
      distanceM: r.distance_m,
      etaS: r.eta_s,
      driverName: r.driver_name,
      rating: Number(r.rating),
      totalTrips: r.total_trips,
      vehicleMake: r.vehicle_make,
      vehicleModel: r.vehicle_model,
      vehicleColor: r.vehicle_color,
      licensePlate: r.license_plate,
    }));
  },

  /** Passenger accepts a specific driver's bid → that driver is assigned. */
  async acceptBid(offerId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc("accept_bid", { p_offer: offerId });
    if (error) throw error;
    return data === true;
  },

  // --- inDrive bidding: driver side -----------------------------------------

  /** Nearby open ride requests for the current driver (the bidding feed). */
  async nearbyRequests(): Promise<NearbyRequest[]> {
    const { data, error } = await supabase.rpc("nearby_open_rides", { p_radius_m: 12000 });
    if (error) throw error;
    /* eslint-disable @typescript-eslint/no-explicit-any */
    return (data ?? []).map((r: any) => ({
      rideId: r.ride_id,
      pickupAddress: r.pickup_address,
      dropoffAddress: r.dropoff_address,
      offeredFare: r.offered_fare,
      currency: r.currency,
      tripDistanceM: r.trip_distance_m,
      tripDurationS: r.trip_duration_s,
      pickupDistanceM: r.pickup_distance_m,
      etaS: r.eta_s,
      vehicleClass: r.vehicle_class,
      requestedAt: r.requested_at,
    }));
  },

  /** Driver submits (or updates) a bid: accept-at-offer or a counter price. */
  async submitBid(rideId: string, amount: number): Promise<void> {
    const { error } = await supabase.rpc("submit_bid", { p_ride: rideId, p_amount: amount });
    if (error) throw error;
  },

  /** Nearby online drivers of a class, for the passenger's map. */
  async nearbyDrivers(point: LatLng, vehicleClass: VehicleClass): Promise<NearbyDriver[]> {
    const { data, error } = await supabase.rpc("nearby_drivers", {
      p_lng: point.longitude,
      p_lat: point.latitude,
      p_class: vehicleClass,
      p_radius_m: 6000,
    });
    if (error) throw error;
    /* eslint-disable @typescript-eslint/no-explicit-any */
    return (data ?? []).map((r: any) => ({
      driverId: r.driver_id,
      lat: r.lat,
      lng: r.lng,
      vehicleClass: r.vehicle_class,
      heading: r.heading != null ? Number(r.heading) : null,
    }));
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
