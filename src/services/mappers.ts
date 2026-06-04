import type { Driver, Profile, Ride, RideOffer, SavedLocation, AppNotification, Earning } from "@/types";
import { toLatLng } from "@/utils/geo";

/**
 * Pure functions translating snake_case DB rows (as returned by PostgREST,
 * with geography decoded to GeoJSON) into the camelCase domain shapes used by
 * the UI. Keeping mapping in one module means a schema rename touches exactly
 * one place.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export function mapProfile(row: any): Profile {
  return {
    id: row.id,
    role: row.role,
    status: row.status,
    fullName: row.full_name,
    phone: row.phone,
    email: row.email,
    avatarUrl: row.avatar_url,
    ratingAvg: Number(row.rating_avg),
    ratingCount: row.rating_count,
    pushToken: row.push_token ?? null,
  };
}

export function mapDriver(row: any): Driver {
  return {
    id: row.id,
    status: row.status,
    vehicleClass: row.vehicle_class,
    vehicleMake: row.vehicle_make,
    vehicleModel: row.vehicle_model,
    vehicleColor: row.vehicle_color,
    licensePlate: row.license_plate,
    isVerified: row.is_verified,
    currentLocation: toLatLng(row.current_location),
    heading: row.heading != null ? Number(row.heading) : null,
    totalTrips: row.total_trips ?? 0,
  };
}

export function mapRide(row: any): Ride {
  return {
    id: row.id,
    passengerId: row.passenger_id,
    driverId: row.driver_id,
    status: row.status,
    vehicleClass: row.vehicle_class,
    pickup: { address: row.pickup_address, point: toLatLng(row.pickup_point)! },
    dropoff: { address: row.dropoff_address, point: toLatLng(row.dropoff_point)! },
    distanceM: row.distance_m,
    durationS: row.duration_s,
    routePolyline: row.route_polyline,
    currency: row.currency,
    fareEstimate: row.fare_estimate,
    offeredFare: row.offered_fare ?? null,
    fareFinal: row.fare_final,
    surgeMultiplier: Number(row.surge_multiplier ?? 1),
    paymentMethod: row.payment_method,
    requestedAt: row.requested_at,
    acceptedAt: row.accepted_at,
    completedAt: row.completed_at,
    cancelledAt: row.cancelled_at,
  };
}

export function mapOffer(row: any): RideOffer {
  return {
    id: row.id,
    rideId: row.ride_id,
    driverId: row.driver_id,
    status: row.status,
    distanceM: row.distance_m,
    etaS: row.eta_s,
    expiresAt: row.expires_at,
  };
}

export function mapSavedLocation(row: any): SavedLocation {
  return {
    id: row.id,
    label: row.label,
    address: row.address,
    point: toLatLng(row.point)!,
  };
}

export function mapNotification(row: any): AppNotification {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    data: row.data ?? {},
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

export function mapEarning(row: any): Earning {
  return {
    id: row.id,
    rideId: row.ride_id,
    grossAmount: row.gross_amount,
    platformFee: row.platform_fee,
    netAmount: row.net_amount,
    currency: row.currency,
    createdAt: row.created_at,
  };
}
