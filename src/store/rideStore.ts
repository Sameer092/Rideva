import { create } from "zustand";
import type { LatLng, Place, VehicleClass, FareBreakdown } from "@/types";

/**
 * Booking-flow store (passenger side). Holds the *in-progress* booking the
 * passenger is assembling on the home screen before a ride row exists in the
 * database. Once the ride is created, the live ride is tracked via React Query
 * + Realtime (see useRide), not here.
 */
type BookingStep = "idle" | "set_pickup" | "set_dropoff" | "choose_class" | "confirming";

interface RideState {
  step: BookingStep;
  pickup: Place | null;
  dropoff: Place | null;
  vehicleClass: VehicleClass;
  fare: FareBreakdown | null;
  distanceM: number | null;
  durationS: number | null;
  /** The id of the ride created from this booking (drives the tracking sheet). */
  activeRideId: string | null;

  setStep: (step: BookingStep) => void;
  setPickup: (place: Place | null) => void;
  setDropoff: (place: Place | null) => void;
  setVehicleClass: (vc: VehicleClass) => void;
  setEstimate: (args: { fare: FareBreakdown; distanceM: number; durationS: number }) => void;
  setActiveRideId: (id: string | null) => void;
  resetBooking: () => void;
}

const initial = {
  step: "idle" as BookingStep,
  pickup: null,
  dropoff: null,
  vehicleClass: "economy" as VehicleClass,
  fare: null,
  distanceM: null,
  durationS: null,
  activeRideId: null,
};

export const useRideStore = create<RideState>((set) => ({
  ...initial,
  setStep: (step) => set({ step }),
  setPickup: (pickup) => set({ pickup }),
  setDropoff: (dropoff) => set({ dropoff }),
  setVehicleClass: (vehicleClass) => set({ vehicleClass }),
  setEstimate: ({ fare, distanceM, durationS }) => set({ fare, distanceM, durationS }),
  setActiveRideId: (activeRideId) => set({ activeRideId }),
  resetBooking: () => set({ ...initial }),
}));
