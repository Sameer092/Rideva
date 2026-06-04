import { useEffect, useState } from "react";
import { supabase } from "@/services/supabase";
import { toLatLng } from "@/utils/geo";
import type { LatLng } from "@/types";

// Unique channel topics per subscription (see useActiveRide for why).
let channelSeq = 0;

/**
 * Passenger-side live driver tracking. Subscribes to inserts on
 * `driver_locations` scoped to the active ride and exposes the latest point +
 * heading for the moving car marker. RLS guarantees the passenger only ever
 * receives location pings for *their* ride.
 */
export function useDriverTracking(rideId: string | null | undefined) {
  const [location, setLocation] = useState<LatLng | null>(null);
  const [heading, setHeading] = useState<number | null>(null);

  useEffect(() => {
    if (!rideId) return;

    // Prime with the latest known ping (in case we subscribed mid-trip).
    supabase
      .from("driver_locations")
      .select("point, heading")
      .eq("ride_id", rideId)
      .order("recorded_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setLocation(toLatLng(data.point));
          setHeading(data.heading != null ? Number(data.heading) : null);
        }
      });

    const channel = supabase
      .channel(`track:${rideId}:${channelSeq++}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "driver_locations", filter: `ride_id=eq.${rideId}` },
        (payload) => {
          const point = toLatLng(payload.new.point);
          if (point) setLocation(point);
          if (payload.new.heading != null) setHeading(Number(payload.new.heading));
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [rideId]);

  return { location, heading };
}
