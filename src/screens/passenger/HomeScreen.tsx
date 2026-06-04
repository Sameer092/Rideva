import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import type MapView from "react-native-maps";

import type { PassengerStackParamList, PassengerTabParamList } from "@/navigation/types";
import { RideMap } from "@/components/map/RideMap";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Chip } from "@/components/ui/Chip";
import { SheetHandle } from "@/components/ui/ScreenHeader";
import { VehicleClassSelector } from "@/components/ride/VehicleClassSelector";
import { useRideStore } from "@/store/rideStore";
import { useAuthStore } from "@/store/authStore";
import { useBooking } from "@/hooks/useBooking";
import { useActiveRide } from "@/hooks/useActiveRide";
import { useTheme } from "@/hooks/useTheme";
import { locationService } from "@/services/location";
import { regionForPoints } from "@/utils/geo";
import { formatMoney } from "@/utils/format";
import { SHADOWS } from "@/theme";

type Props = CompositeScreenProps<
  BottomTabScreenProps<PassengerTabParamList, "HomeTab">,
  NativeStackScreenProps<PassengerStackParamList>
>;

/** Passenger home — map-first booking surface with a floating top bar and a
 *  modern booking bottom sheet. */
export function HomeScreen({ navigation }: Props) {
  const mapRef = useRef<MapView>(null);
  const sheetRef = useRef<BottomSheet>(null);
  const { colors } = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const { pickup, dropoff, vehicleClass, setPickup, setDropoff, setVehicleClass, fare } = useRideStore();
  const { fares, estimating, estimateAll, book } = useBooking();
  const { data: activeRide } = useActiveRide();
  const [locating, setLocating] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      if (activeRide && !["completed", "cancelled", "no_drivers"].includes(activeRide.status)) {
        navigation.navigate("RideTracking", { rideId: activeRide.id });
      }
    }, [activeRide, navigation]),
  );

  useEffect(() => {
    (async () => {
      const granted = await locationService.requestForeground();
      if (!granted) return setLocating(false);
      try {
        const point = await locationService.getCurrent();
        const address = await locationService.reverseGeocode(point);
        setPickup({ address, point });
      } catch {
        /* keep default */
      } finally {
        setLocating(false);
      }
    })();
  }, [setPickup]);

  useEffect(() => {
    if (pickup && dropoff) {
      void estimateAll();
      mapRef.current?.fitToCoordinates([pickup.point, dropoff.point], {
        edgePadding: { top: 100, right: 60, bottom: 420, left: 60 },
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

  async function setDemoDropoff() {
    if (!pickup) return;
    const point = { latitude: pickup.point.latitude + 0.018, longitude: pickup.point.longitude + 0.012 };
    setDropoff({ address: await locationService.reverseGeocode(point), point });
  }

  /** Re-fetch the device location and recenter the map on the pickup pin. */
  async function recenterToCurrent() {
    try {
      const point = await locationService.getCurrent();
      const address = await locationService.reverseGeocode(point);
      setPickup({ address, point });
      mapRef.current?.animateToRegion({ ...point, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 400);
    } catch {
      /* ignore */
    }
  }

  const region = pickup && dropoff ? regionForPoints(pickup.point, dropoff.point) : undefined;

  return (
    <View className="flex-1 bg-canvas-light dark:bg-canvas-dark">
      <RideMap ref={mapRef} region={region} pickup={pickup?.point} dropoff={dropoff?.point} />

      {/* Floating top bar */}
      <SafeAreaView edges={["top"]} className="absolute inset-x-0 top-0">
        <View className="flex-row items-center justify-between px-5 pt-2">
          <View
            className="flex-row items-center gap-3 rounded-full bg-surface-light dark:bg-surface-dark px-3 py-2"
            style={SHADOWS.md}
          >
            <Avatar name={profile?.fullName} uri={profile?.avatarUrl} size={36} />
            <View className="pr-2">
              <Text className="text-xs text-light-textMuted dark:text-dark-textMuted">Welcome back</Text>
              <Text className="text-sm font-extrabold text-light-text dark:text-dark-text">
                {profile?.fullName?.split(" ")[0] ?? "Rider"}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={() => navigation.navigate("SavedLocations")}
            className="h-12 w-12 items-center justify-center rounded-full bg-surface-light dark:bg-surface-dark"
            style={SHADOWS.md}
          >
            <Text className="text-lg">⭐</Text>
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Booking bottom sheet */}
      <BottomSheet
        ref={sheetRef}
        index={1}
        snapPoints={["32%", "70%"]}
        handleComponent={SheetHandle}
        backgroundStyle={{ backgroundColor: colors.surface, borderRadius: 28 }}
      >
        <BottomSheetView style={{ paddingHorizontal: 20, paddingBottom: 28, gap: 16 }}>
          <Text className="text-2xl font-black text-light-text dark:text-dark-text">
            {dropoff ? "Confirm your ride" : "Where to?"}
          </Text>

          {/* Location stepper card */}
          <View className="rounded-2xl bg-light-border/40 dark:bg-elevated-dark p-1">
            <Pressable className="flex-row items-center gap-3 px-3 py-3.5" onPress={recenterToCurrent}>
              <View className="h-2.5 w-2.5 rounded-full bg-brand" />
              <Text numberOfLines={1} className="flex-1 font-semibold text-light-text dark:text-dark-text">
                {locating ? "Locating you…" : pickup?.address ?? "Set pickup location"}
              </Text>
              <Text className="text-base">🎯</Text>
            </Pressable>
            <View className="ml-[18px] h-4 w-0.5 bg-light-border dark:bg-dark-border" />
            <Pressable className="flex-row items-center gap-3 px-3 py-3.5" onPress={setDemoDropoff}>
              <View className="h-2.5 w-2.5 rounded-sm bg-light-text dark:bg-white" />
              <Text numberOfLines={1} className="flex-1 font-semibold text-light-text dark:text-dark-text">
                {dropoff?.address ?? "Where are you going?"}
              </Text>
            </Pressable>
          </View>

          {!dropoff && (
            <View className="flex-row gap-2.5">
              <Chip label="Home" icon={<Text>🏠</Text>} onPress={setDemoDropoff} />
              <Chip label="Work" icon={<Text>💼</Text>} onPress={setDemoDropoff} />
              <Chip label="Saved" icon={<Text>⭐</Text>} onPress={() => navigation.navigate("SavedLocations")} />
            </View>
          )}

          {dropoff && (
            <ScrollView showsVerticalScrollIndicator={false}>
              <VehicleClassSelector selected={vehicleClass} onSelect={setVehicleClass} fares={fares} />
              <View className="mt-4 flex-row items-center justify-between rounded-2xl bg-light-border/40 dark:bg-elevated-dark px-4 py-3">
                <View className="flex-row items-center gap-2">
                  <Text className="text-lg">💵</Text>
                  <Text className="font-bold text-light-text dark:text-dark-text">Cash</Text>
                </View>
                <Text className="text-xl font-black text-light-text dark:text-dark-text">
                  {fare ? formatMoney(fare.totalAmount, fare.currency) : estimating ? "…" : "—"}
                </Text>
              </View>
              <View className="mt-4">
                <Button label="Book ride" size="lg" loading={book.isPending} disabled={!pickup || !dropoff} onPress={handleConfirm} />
              </View>
            </ScrollView>
          )}
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}
