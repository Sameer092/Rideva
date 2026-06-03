import React, { forwardRef, useMemo } from "react";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, type Region } from "react-native-maps";
import { View } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { DEFAULT_REGION } from "@/constants";
import type { LatLng } from "@/types";
import { darkMapStyle } from "./mapStyle";

interface RideMapProps {
  region?: Region;
  pickup?: LatLng | null;
  dropoff?: LatLng | null;
  driver?: LatLng | null;
  driverHeading?: number | null;
  route?: LatLng[];
  onRegionChangeComplete?: (region: Region) => void;
  /** Show the user's blue dot. */
  showsUserLocation?: boolean;
}

/**
 * Thin, opinionated wrapper around react-native-maps. Centralises provider,
 * theming (custom dark map style), and the standard ride markers/route so
 * every screen renders the map identically. Forwarded ref lets callers animate
 * the camera (fitToCoordinates, animateToRegion).
 */
export const RideMap = forwardRef<MapView, RideMapProps>(function RideMap(
  { region, pickup, dropoff, driver, driverHeading, route, onRegionChangeComplete, showsUserLocation = true },
  ref,
) {
  const { scheme } = useTheme();
  const customMapStyle = useMemo(() => (scheme === "dark" ? darkMapStyle : []), [scheme]);

  return (
    <MapView
      ref={ref}
      provider={PROVIDER_GOOGLE}
      style={{ flex: 1 }}
      initialRegion={region ?? DEFAULT_REGION}
      customMapStyle={customMapStyle}
      showsUserLocation={showsUserLocation}
      showsMyLocationButton={false}
      showsCompass={false}
      onRegionChangeComplete={onRegionChangeComplete}
    >
      {route && route.length > 1 && (
        <Polyline coordinates={route} strokeWidth={4} strokeColor="#5B5BD6" />
      )}

      {pickup && (
        <Marker coordinate={pickup} title="Pickup" anchor={{ x: 0.5, y: 0.5 }}>
          <View className="h-4 w-4 rounded-full bg-brand border-2 border-white" />
        </Marker>
      )}

      {dropoff && (
        <Marker coordinate={dropoff} title="Destination" anchor={{ x: 0.5, y: 0.5 }}>
          <View className="h-4 w-4 rounded-sm bg-light-text dark:bg-white border-2 border-white" />
        </Marker>
      )}

      {driver && (
        <Marker
          coordinate={driver}
          rotation={driverHeading ?? 0}
          anchor={{ x: 0.5, y: 0.5 }}
          flat
          title="Driver"
        >
          <View className="h-8 w-8 items-center justify-center rounded-full bg-white shadow">
            {/* car glyph; swap for an SVG asset in production */}
            <View className="h-5 w-5 rounded bg-brand" />
          </View>
        </Marker>
      )}
    </MapView>
  );
});
