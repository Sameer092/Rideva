/**
 * Domain types shared across the app. These mirror the database schema but are
 * the *client-facing* shape (camelCase where convenient, geography decoded to
 * {lat,lng}). The raw generated row types live in `database.types.ts`.
 */

export type UserRole = "passenger" | "driver" | "admin";
export type AccountStatus = "active" | "suspended" | "banned" | "pending";
export type DriverStatus = "offline" | "online" | "on_trip";
export type VehicleClass = "motorcycle" | "rickshaw" | "economy" | "comfort" | "xl" | "premium";
export type PaymentMethod = "cash" | "card" | "wallet";
export type PaymentStatus = "pending" | "authorized" | "paid" | "failed" | "refunded";

export type RideStatus =
  | "requested"
  | "matching"
  | "accepted"
  | "arriving"
  | "arrived"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_drivers";

export type RideOfferStatus = "pending" | "accepted" | "rejected" | "expired" | "cancelled";

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface Place {
  address: string;
  point: LatLng;
}

export interface Profile {
  id: string;
  role: UserRole;
  status: AccountStatus;
  fullName: string;
  phone: string | null;
  email: string | null;
  avatarUrl: string | null;
  ratingAvg: number;
  ratingCount: number;
  pushToken: string | null;
}

export interface Driver {
  id: string;
  status: DriverStatus;
  vehicleClass: VehicleClass;
  vehicleMake: string | null;
  vehicleModel: string | null;
  vehicleColor: string | null;
  licensePlate: string | null;
  isVerified: boolean;
  currentLocation: LatLng | null;
  heading: number | null;
  totalTrips: number;
}

export interface FareBreakdown {
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  surgeAmount: number;
  bookingFee: number;
  totalAmount: number;
  currency: string;
}

export interface Ride {
  id: string;
  passengerId: string;
  driverId: string | null;
  status: RideStatus;
  vehicleClass: VehicleClass;
  pickup: Place;
  dropoff: Place;
  distanceM: number | null;
  durationS: number | null;
  routePolyline: string | null;
  currency: string;
  fareEstimate: number | null;
  offeredFare: number | null;
  fareFinal: number | null;
  surgeMultiplier: number;
  paymentMethod: PaymentMethod;
  requestedAt: string;
  acceptedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
}

export interface RideOffer {
  id: string;
  rideId: string;
  driverId: string;
  status: RideOfferStatus;
  distanceM: number | null;
  etaS: number | null;
  expiresAt: string;
}

export interface DriverLocationPing {
  driverId: string;
  rideId: string | null;
  point: LatLng;
  heading: number | null;
  speedKmh: number | null;
  recordedAt: string;
}

export interface SavedLocation {
  id: string;
  label: string;
  address: string;
  point: LatLng;
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
}

/** A driver's bid on a ride, enriched with driver info (passenger view). */
export interface DriverBid {
  offerId: string;
  driverId: string;
  bidAmount: number;
  distanceM: number | null;
  etaS: number | null;
  driverName: string;
  rating: number;
  totalTrips: number;
  vehicleMake: string | null;
  vehicleModel: string | null;
  vehicleColor: string | null;
  licensePlate: string | null;
}

/** A nearby online driver shown on the passenger's map. */
export interface NearbyDriver {
  driverId: string;
  lat: number;
  lng: number;
  vehicleClass: VehicleClass;
  heading: number | null;
}

/** An open ride request shown in the driver's feed. */
export interface NearbyRequest {
  rideId: string;
  pickupAddress: string;
  dropoffAddress: string;
  offeredFare: number | null;
  currency: string;
  tripDistanceM: number | null;
  tripDurationS: number | null;
  pickupDistanceM: number | null;
  etaS: number | null;
  vehicleClass: VehicleClass;
  requestedAt: string;
}

export interface Earning {
  id: string;
  rideId: string;
  grossAmount: number;
  platformFee: number;
  netAmount: number;
  currency: string;
  createdAt: string;
}
