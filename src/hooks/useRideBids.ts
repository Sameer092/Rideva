import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/services/supabase";
import { rideService } from "@/services/rides";
import type { DriverBid } from "@/types";

let channelSeq = 0;

/**
 * Passenger-side: live list of driver bids for a ride. Refetches on a short
 * interval and whenever a ride_offer for this ride changes (Realtime), so new
 * driver offers appear instantly while the passenger is choosing.
 */
export function useRideBids(rideId: string | null | undefined, active: boolean) {
  const queryClient = useQueryClient();

  const query = useQuery<DriverBid[]>({
    queryKey: ["ride_bids", rideId],
    queryFn: () => rideService.getRideBids(rideId!),
    enabled: !!rideId && active,
    refetchInterval: active ? 4000 : false,
  });

  useEffect(() => {
    if (!rideId || !active) return;
    const channel = supabase
      .channel(`bids:${rideId}:${channelSeq++}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ride_offers", filter: `ride_id=eq.${rideId}` },
        () => queryClient.invalidateQueries({ queryKey: ["ride_bids", rideId] }),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [rideId, active, queryClient]);

  return query;
}
