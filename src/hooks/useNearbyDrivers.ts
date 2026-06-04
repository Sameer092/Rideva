import { useQuery } from "@tanstack/react-query";
import { rideService } from "@/services/rides";
import type { LatLng, NearbyDriver, VehicleClass } from "@/types";

/**
 * Passenger-side: online drivers of the selected vehicle class near the pickup,
 * shown as live markers on the map (refreshed every few seconds). Gives the
 * map that "cars/bikes around you" feel like inDrive.
 */
export function useNearbyDrivers(point: LatLng | null | undefined, vehicleClass: VehicleClass) {
  return useQuery<NearbyDriver[]>({
    queryKey: ["nearby_drivers", point?.latitude, point?.longitude, vehicleClass],
    queryFn: () => rideService.nearbyDrivers(point!, vehicleClass),
    enabled: !!point,
    refetchInterval: 8000,
  });
}
