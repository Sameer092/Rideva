import React, { forwardRef, useMemo } from "react";
import { View } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { DEFAULT_REGION, VEHICLE_CLASSES } from "@/constants";
import type { LatLng, NearbyDriver } from "@/types";
import { OSMMap, type OSMMapHandle, type MapMarker } from "./OSMMap";

export type RideMapHandle = OSMMapHandle;

const VEHICLE_ICON: Record<string, string> = Object.fromEntries(VEHICLE_CLASSES.map((v) => [v.key, v.icon]));

interface RideMapProps {
  region?: { latitude: number; longitude: number; latitudeDelta?: number; longitudeDelta?: number };
  pickup?: LatLng | null;
  dropoff?: LatLng | null;
  driver?: LatLng | null;
  driverHeading?: number | null;
  route?: LatLng[];
  /** Nearby online drivers to show as vehicle markers (passenger map). */
  vehicles?: NearbyDriver[];
  /** Reports map center on pan/zoom (used by the picker). */
  onRegionChangeComplete?: (center: LatLng) => void;
  showsUserLocation?: boolean;
}

/**
 * App-wide map. Now backed by the free OpenStreetMap component (OSMMap) instead
 * of Google Maps — no API key, no billing. Keeps the same props + imperative
 * handle (animateToRegion / fitToCoordinates) the screens already use.
 */
export const RideMap = forwardRef<RideMapHandle, RideMapProps>(function RideMap(
  { region, pickup, dropoff, driver, route, vehicles, onRegionChangeComplete },
  ref,
) {
  const { scheme } = useTheme();

  const markers = useMemo<MapMarker[]>(() => {
    const m: MapMarker[] = [];
    // Nearby driver vehicles first (so pickup/dropoff render on top).
    for (const v of vehicles ?? []) {
      m.push({ lat: v.lat, lng: v.lng, type: "driver", emoji: VEHICLE_ICON[v.vehicleClass] ?? "🚗" });
    }
    if (pickup) m.push({ lat: pickup.latitude, lng: pickup.longitude, type: "pickup" });
    if (dropoff) m.push({ lat: dropoff.latitude, lng: dropoff.longitude, type: "dropoff" });
    if (driver) m.push({ lat: driver.latitude, lng: driver.longitude, type: "driver", emoji: "🚗" });
    return m;
  }, [pickup, dropoff, driver, vehicles]);

  const center = region
    ? { latitude: region.latitude, longitude: region.longitude }
    : pickup ?? dropoff ?? { latitude: DEFAULT_REGION.latitude, longitude: DEFAULT_REGION.longitude };

  return (
    <View style={{ flex: 1 }}>
      <OSMMap
        ref={ref}
        center={center}
        markers={markers}
        polyline={route ?? []}
        dark={scheme === "dark"}
        onRegionChange={onRegionChangeComplete}
      />
    </View>
  );
});
