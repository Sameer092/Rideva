import { useCallback, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRideStore } from "@/store/rideStore";
import { useAuthStore } from "@/store/authStore";
import { rideService } from "@/services/rides";
import { haversineMeters } from "@/utils/geo";
import { VEHICLE_CLASSES } from "@/constants";
import type { FareBreakdown, PaymentMethod, VehicleClass } from "@/types";

/**
 * Encapsulates the passenger booking flow logic so the HomeScreen stays
 * presentational. Computes per-class fare estimates from the route, and creates
 * the ride request (which triggers server-side dispatch).
 *
 * NOTE: distance/duration here use a straight-line estimate as a fallback. In
 * production wire `services/routing` to the Directions API for road distance +
 * an encoded polyline; the fare math and create payload already accept both.
 */
export function useBooking() {
  const { pickup, dropoff, vehicleClass, setEstimate, setActiveRideId } = useRideStore();
  const passengerId = useAuthStore((s) => s.session?.user.id);
  const [fares, setFares] = useState<Partial<Record<VehicleClass, FareBreakdown>>>({});
  const [estimating, setEstimating] = useState(false);

  /** Estimate fares for every vehicle class given the current pickup/dropoff. */
  const estimateAll = useCallback(async () => {
    if (!pickup || !dropoff) return;
    setEstimating(true);
    try {
      const distanceM = Math.round(haversineMeters(pickup.point, dropoff.point) * 1.3); // road factor
      const durationS = Math.round((distanceM / 8.33)); // ~30km/h urban average

      const entries = await Promise.all(
        VEHICLE_CLASSES.map(async (vc) => {
          const fare = await rideService.estimateFare(vc.key, distanceM, durationS);
          return [vc.key, fare] as const;
        }),
      );
      const next = Object.fromEntries(entries) as Record<VehicleClass, FareBreakdown>;
      setFares(next);

      const selected = next[vehicleClass];
      if (selected) setEstimate({ fare: selected, distanceM, durationS });
      return { distanceM, durationS, fares: next };
    } finally {
      setEstimating(false);
    }
  }, [pickup, dropoff, vehicleClass, setEstimate]);

  const book = useMutation({
    mutationFn: async (paymentMethod: PaymentMethod) => {
      if (!passengerId || !pickup || !dropoff) throw new Error("Missing booking details");
      const distanceM = Math.round(haversineMeters(pickup.point, dropoff.point) * 1.3);
      const durationS = Math.round(distanceM / 8.33);
      const fare = fares[vehicleClass] ?? (await rideService.estimateFare(vehicleClass, distanceM, durationS));

      const ride = await rideService.createRide({
        passengerId,
        pickup,
        dropoff,
        vehicleClass,
        distanceM,
        durationS,
        fareEstimate: fare.totalAmount,
        paymentMethod,
      });
      setActiveRideId(ride.id);
      return ride;
    },
  });

  return { fares, estimating, estimateAll, book };
}
