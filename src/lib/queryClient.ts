import { QueryClient } from "@tanstack/react-query";

/**
 * Shared React Query client. Defaults tuned for a mobile, realtime app:
 *  - data is considered fresh for 30s (cuts redundant refetches on remount)
 *  - retry network errors twice with backoff
 *  - refetch on reconnect (mobile networks flap constantly)
 * Live entities (active ride, driver location) bypass polling and are kept
 * fresh by Realtime subscriptions that call queryClient.setQueryData.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 2,
      refetchOnReconnect: true,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

/** Centralised query-key factory keeps cache keys consistent and typo-free. */
export const qk = {
  profile: (id: string) => ["profile", id] as const,
  ride: (id: string) => ["ride", id] as const,
  activeRide: ["ride", "active"] as const,
  rideHistory: (role: string) => ["rides", "history", role] as const,
  offers: ["ride_offers", "incoming"] as const,
  savedLocations: ["saved_locations"] as const,
  earnings: (range: string) => ["earnings", range] as const,
  notifications: ["notifications"] as const,
  driverLocation: (rideId: string) => ["driver_location", rideId] as const,
};
