import { useEffect, useRef } from "react";
import type { LocationSubscription } from "expo-location";
import { locationService } from "@/services/location";
import { LOCATION } from "@/constants";

/**
 * Driver-side location broadcaster. While the driver is online (and especially
 * during an active trip), this streams throttled GPS pings to the backend via
 * the update_driver_location RPC. Throttling by time AND distance keeps write
 * volume and battery use sane on long shifts.
 *
 * @param active   whether to broadcast (driver online / on trip)
 * @param rideId   the active ride id, so pings are associated for tracking
 */
export function useDriverLocationBroadcast(active: boolean, rideId: string | null) {
  const subRef = useRef<LocationSubscription | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      const granted = await locationService.requestForeground();
      if (!granted || cancelled) return;

      subRef.current = await locationService.watchDriver(
        (point, heading, speed) => {
          void locationService.pushDriverLocation(point, heading, speed, rideId);
        },
        LOCATION.driverUpdateIntervalMs,
        LOCATION.driverUpdateDistanceM,
      );
    }

    if (active) {
      void start();
    }

    return () => {
      cancelled = true;
      subRef.current?.remove();
      subRef.current = null;
    };
  }, [active, rideId]);
}
