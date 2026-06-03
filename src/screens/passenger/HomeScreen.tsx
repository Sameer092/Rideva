import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import type MapView from "react-native-maps";

import type { PassengerStackParamList, PassengerTabParamList } from "@/navigation/types";
import { RideMap } from "@/components/map/RideMap";
import { Button } from "@/components/ui/Button";
import { VehicleClassSelector } from "@/components/ride/VehicleClassSelector";
import { useRideStore } from "@/store/rideStore";
import { useBooking } from "@/hooks/useBooking";
import { useActiveRide } from "@/hooks/useActiveRide";
import { locationService } from "@/services/location";
import { regionForPoints } from "@/utils/geo";
import { formatMoney } from "@/utils/format";

type Props = CompositeScreenProps<
  BottomTabScreenProps<PassengerTabParamList, "HomeTab">,
  NativeStackScreenProps<PassengerStackParamList>
>;

/**
 * Passenger home — the map-first booking surface (Uber/Bolt style).
 * A persistent bottom sheet hosts the booking flow:
 *   set pickup → set destination → choose vehicle → confirm & book.
 * If the passenger already has a live ride, we route straight to tracking.
 */
export function HomeScreen({ navigation }: Props) {
  const mapRef = useRef<MapView>(null);
  const sheetRef = useRef<BottomSheet>(null);
  const { pickup, dropoff, vehicleClass, setPickup, setDropoff, setVehicleClass, fare } = useRideStore();
  const { fares, estimating, estimateAll, book } = useBooking();
  const { data: activeRide } = useActiveRide();
  const [locating, setLocating] = useState(true);

  // Resume into tracking if a live ride exists.
  useFocusEffect(
    React.useCallback(() => {
      if (activeRide && !["completed", "cancelled", "no_drivers"].includes(activeRide.status)) {
        navigation.navigate("RideTracking", { rideId: activeRide.id });
      }
    }, [activeRide, navigation]),
  );

  // On mount: get current location and seed the pickup.
  useEffect(() => {
    (async () => {
      const granted = await locationService.requestForeground();
      if (!granted) {
        setLocating(false);
        return;
      }
      try {
        const point = await locationService.getCurrent();
        const address = await locationService.reverseGeocode(point);
        setPickup({ address, point });
      } catch {
        /* keep default region */
      } finally {
        setLocating(false);
      }
    })();
  }, [setPickup]);

  // Recompute fares + frame the route whenever both endpoints are set.
  useEffect(() => {
    if (pickup && dropoff) {
      void estimateAll();
      mapRef.current?.fitToCoordinates([pickup.point, dropoff.point], {
        edgePadding: { top: 80, right: 60, bottom: 360, left: 60 },
        animated: true,
      });
    }
  }, [pickup, dropoff, estimateAll]);

  async function handleConfirm() {
    try {
      const ride = await book.mutateAsync("cash");
      navigation.navigate("RideTracking", { rideId: ride.id });
    } catch (e) {
      Alert.alert("Couldn't book ride", e instanceof Error ? e.message : "Please try again.");
    }
  }

  const region = pickup && dropoff ? regionForPoints(pickup.point, dropoff.point) : undefined;

  return (
    <View className="flex-1 bg-canvas-light dark:bg-canvas-dark">
      <RideMap
        ref={mapRef}
        region={region}
        pickup={pickup?.point}
        dropoff={dropoff?.point}
      />

      <BottomSheet ref={sheetRef} index={1} snapPoints={["28%", "55%"]} enableDynamicSizing={false}>
        <BottomSheetView style={{ padding: 20, gap: 14 }}>
          <Text className="text-xl font-extrabold text-light-text dark:text-dark-text">
            {dropoff ? "Confirm your ride" : "Where to?"}
          </Text>

          {/* Location inputs (tappable rows; a place-search modal would open here). */}
          <View className="gap-2">
            <Pressable
              className="flex-row items-center gap-3 rounded-2xl bg-canvas-light dark:bg-canvas-dark p-3"
              onPress={() => {/* open pickup search */}}
            >
              <View className="h-3 w-3 rounded-full bg-brand" />
              <Text numberOfLines={1} className="flex-1 text-light-text dark:text-dark-text">
                {locating ? "Locating…" : pickup?.address ?? "Set pickup location"}
              </Text>
            </Pressable>
            <Pressable
              className="flex-row items-center gap-3 rounded-2xl bg-canvas-light dark:bg-canvas-dark p-3"
              onPress={async () => {
                // Demo: drop a destination ~2km north of pickup. Replace with place search.
                if (!pickup) return;
                const point = { latitude: pickup.point.latitude + 0.018, longitude: pickup.point.longitude + 0.012 };
                setDropoff({ address: await locationService.reverseGeocode(point), point });
              }}
            >
              <View className="h-3 w-3 rounded-sm bg-light-text dark:bg-white" />
              <Text numberOfLines={1} className="flex-1 text-light-text dark:text-dark-text">
                {dropoff?.address ?? "Set destination"}
              </Text>
            </Pressable>
          </View>

          {dropoff && (
            <>
              <VehicleClassSelector selected={vehicleClass} onSelect={setVehicleClass} fares={fares} />
              <View className="flex-row items-center justify-between">
                <Text className="text-light-textMuted dark:text-dark-textMuted">Estimated fare</Text>
                <Text className="text-lg font-bold text-light-text dark:text-dark-text">
                  {fare ? formatMoney(fare.totalAmount, fare.currency) : estimating ? "…" : "—"}
                </Text>
              </View>
              <Button
                label="Book ride · Cash"
                loading={book.isPending}
                disabled={!pickup || !dropoff}
                onPress={handleConfirm}
              />
            </>
          )}
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}
