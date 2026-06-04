import * as Location from "expo-location";
import { supabase } from "./supabase";
import type { LatLng } from "@/types";

/**
 * Location service. Handles permission flow, one-shot fixes, and the driver's
 * high-frequency location stream. The stream is throttled by both time and
 * distance (see LOCATION constants) to balance freshness against battery and
 * write volume — updates funnel through the `update_driver_location` RPC which
 * writes both the denormalised live column and the time-series table in one
 * round-trip.
 */
export const locationService = {
  async requestForeground(): Promise<boolean> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === "granted";
  },

  async requestBackground(): Promise<boolean> {
    const { status } = await Location.requestBackgroundPermissionsAsync();
    return status === "granted";
  },

  async getCurrent(): Promise<LatLng> {
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
  },

  /**
   * Reverse-geocode a coordinate to a human address using Nominatim (free, no
   * API key). Falls back to the on-device geocoder, then to raw coordinates.
   */
  async reverseGeocode(point: LatLng): Promise<string> {
    try {
      // accept-language=en forces English (OSM defaults to the local language).
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${point.latitude}&lon=${point.longitude}&zoom=18&addressdetails=1&accept-language=en`;
      const res = await fetch(url, { headers: { "User-Agent": "Rideva/1.0 (demo app)", Accept: "application/json" } });
      if (res.ok) {
        const data = await res.json();
        const a = data.address ?? {};
        const line = [a.road ?? a.neighbourhood ?? a.suburb, a.city ?? a.town ?? a.village, a.country]
          .filter(Boolean)
          .join(", ");
        if (line) return line;
        if (data.display_name) return data.display_name as string;
      }
    } catch {
      /* fall through */
    }
    return `${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)}`;
  },

  /**
   * Forward-geocode a search string to coordinates + label using Nominatim.
   * Returns up to `limit` suggestions.
   */
  async search(query: string, limit = 5, near?: LatLng | null): Promise<Array<{ label: string; point: LatLng }>> {
    try {
      let url =
        `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}` +
        `&limit=${limit}&addressdetails=1&accept-language=en`;
      // Bias results toward the user's area so nearby places rank first.
      if (near) {
        const d = 0.6; // ~60km box around the user
        const vb = `${near.longitude - d},${near.latitude + d},${near.longitude + d},${near.latitude - d}`;
        url += `&viewbox=${vb}&bounded=0`;
      }
      const res = await fetch(url, { headers: { "User-Agent": "Rideva/1.0 (demo app)", Accept: "application/json" } });
      if (!res.ok) return [];
      const data = (await res.json()) as Array<{ display_name: string; lat: string; lon: string }>;
      return data.map((d) => ({
        label: d.display_name,
        point: { latitude: parseFloat(d.lat), longitude: parseFloat(d.lon) },
      }));
    } catch {
      return [];
    }
  },

  /** Convenience: first match for a query. */
  async geocode(query: string): Promise<LatLng | null> {
    const [first] = await this.search(query, 1);
    return first?.point ?? null;
  },

  /** Push a single driver location ping via the RPC. */
  async pushDriverLocation(point: LatLng, heading: number | null, speedKmh: number | null, rideId: string | null) {
    await supabase.rpc("update_driver_location", {
      p_lng: point.longitude,
      p_lat: point.latitude,
      p_heading: heading,
      p_speed_kmh: speedKmh,
      p_ride_id: rideId,
    });
  },

  /**
   * Start a throttled location watcher. Returns the subscription so callers can
   * `.remove()` it when the driver goes offline or the trip ends.
   */
  async watchDriver(
    onUpdate: (point: LatLng, heading: number | null, speedKmh: number | null) => void,
    intervalMs: number,
    distanceM: number,
  ): Promise<Location.LocationSubscription> {
    return Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: intervalMs,
        distanceInterval: distanceM,
      },
      (pos) => {
        onUpdate(
          { latitude: pos.coords.latitude, longitude: pos.coords.longitude },
          pos.coords.heading ?? null,
          pos.coords.speed != null ? pos.coords.speed * 3.6 : null,
        );
      },
    );
  },
};
