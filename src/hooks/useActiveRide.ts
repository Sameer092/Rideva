import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/services/supabase";
import { rideService } from "@/services/rides";
import { mapRide } from "@/services/mappers";
import { qk } from "@/lib/queryClient";
import { useAuthStore } from "@/store/authStore";
import type { Ride } from "@/types";

/**
 * Subscribes to the caller's active ride and keeps it live via Supabase
 * Realtime. The initial fetch comes from React Query; every Postgres change to
 * the row is pushed into the cache with setQueryData, so the UI updates the
 * instant the driver accepts / advances / completes — no polling.
 */
export function useActiveRide() {
  const userId = useAuthStore((s) => s.session?.user.id);
  const queryClient = useQueryClient();

  const query = useQuery<Ride | null>({
    queryKey: qk.activeRide,
    queryFn: () => rideService.getActiveRide(userId!),
    enabled: !!userId,
  });

  const rideId = query.data?.id;

  useEffect(() => {
    if (!rideId) return;
    const channel = supabase
      .channel(`ride:${rideId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rides", filter: `id=eq.${rideId}` },
        (payload) => {
          const updated = mapRide(payload.new);
          queryClient.setQueryData(qk.activeRide, updated);
          queryClient.setQueryData(qk.ride(updated.id), updated);
          // When the ride leaves the "live" set, drop it from the active slot.
          if (["completed", "cancelled", "no_drivers"].includes(updated.status)) {
            // keep it briefly so the UI can show the terminal screen; callers reset.
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [rideId, queryClient]);

  return query;
}
