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

  /** Reverse-geocode a coordinate to a human address line. */
  async reverseGeocode(point: LatLng): Promise<string> {
    const [result] = await Location.reverseGeocodeAsync({
      latitude: point.latitude,
      longitude: point.longitude,
    });
    if (!result) return `${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)}`;
    return [result.name, result.street, result.city].filter(Boolean).join(", ");
  },

  /** Forward-geocode a search string to coordinates. */
  async geocode(query: string): Promise<LatLng | null> {
    const [result] = await Location.geocodeAsync(query);
    if (!result) return null;
    return { latitude: result.latitude, longitude: result.longitude };
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
