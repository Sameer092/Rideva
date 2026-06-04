import { useQuery } from "@tanstack/react-query";
import { rideService } from "@/services/rides";
import type { NearbyRequest } from "@/types";

/**
 * Driver-side: the feed of nearby open ride requests to bid on. Polls every few
 * seconds while the driver is online (the feed depends on the driver's live
 * location, computed server-side in the nearby_open_rides RPC).
 */
export function useNearbyRequests(enabled: boolean) {
  return useQuery<NearbyRequest[]>({
    queryKey: ["nearby_requests"],
    queryFn: () => rideService.nearbyRequests(),
    enabled,
    refetchInterval: enabled ? 4000 : false,
  });
}
