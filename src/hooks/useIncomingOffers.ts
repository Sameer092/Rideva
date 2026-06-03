import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/services/supabase";
import { rideService } from "@/services/rides";
import { qk } from "@/lib/queryClient";
import { useAuthStore } from "@/store/authStore";

/**
 * Driver-side incoming ride offers. Fetches pending offers and listens for new
 * ones in realtime so the request card pops up the moment the dispatcher offers
 * the driver a ride.
 */
export function useIncomingOffers() {
  const driverId = useAuthStore((s) => s.session?.user.id);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: qk.offers,
    queryFn: () => rideService.getIncomingOffers(driverId!),
    enabled: !!driverId,
    refetchInterval: 10_000, // safety net behind realtime
  });

  useEffect(() => {
    if (!driverId) return;
    const channel = supabase
      .channel(`offers:${driverId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ride_offers", filter: `driver_id=eq.${driverId}` },
        () => {
          void queryClient.invalidateQueries({ queryKey: qk.offers });
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [driverId, queryClient]);

  return query;
}
