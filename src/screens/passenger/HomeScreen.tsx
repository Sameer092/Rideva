import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import type { RideMapHandle } from "@/components/map/RideMap";

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
import { useNearbyDrivers } from "@/hooks/useNearbyDrivers";
import { useTheme } from "@/hooks/useTheme";
import { locationService } from "@/services/location";
import { regionForPoints } from "@/utils/geo";
import { formatMoney } from "@/utils/format";
import { CURRENCY } from "@/constants";
import { SHADOWS } from "@/theme";

type Props = CompositeScreenProps<
  BottomTabScreenProps<PassengerTabParamList, "HomeTab">,
  NativeStackScreenProps<PassengerStackParamList>
>;

/** Passenger home — map-first booking surface with a floating top bar and a
 *  modern booking bottom sheet. */
export function HomeScreen({ navigation }: Props) {
  const mapRef = useRef<RideMapHandle>(null);
  const sheetRef = useRef<BottomSheet>(null);
  const { colors } = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const { pickup, dropoff, vehicleClass, setPickup, setVehicleClass } = useRideStore();
  const { fares, estimating, estimateAll, book } = useBooking();
  const { data: activeRide } = useActiveRide();
  const { data: nearbyDrivers } = useNearbyDrivers(pickup?.point, vehicleClass);
  const [locating, setLocating] = useState(true);
  // The passenger's offered fare (inDrive "name your price"). Defaults to the
  // suggested tariff for the selected class; adjustable with − / +.
  const [offeredFare, setOfferedFare] = useState<number | null>(null);

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
        // Center the map on the user right away so it doesn't sit on the default city.
        mapRef.current?.animateToRegion({ ...point, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 600);
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

  // Seed the offer with the suggested tariff for the selected class.
  useEffect(() => {
    const suggested = fares[vehicleClass]?.totalAmount;
    if (suggested) setOfferedFare(suggested);
  }, [fares, vehicleClass]);

  const adjustFare = (deltaPct: number) =>
    setOfferedFare((prev) => {
      const base = prev ?? fares[vehicleClass]?.totalAmount ?? 0;
      const step = Math.max(1000, Math.round((base * deltaPct) / 100 / 1000) * 1000); // ≥ ₨10 steps
      return Math.max(1000, base + (deltaPct > 0 ? step : -step));
    });

  async function handleConfirm() {
    if (!offeredFare) return;
    try {
      const ride = await book.mutateAsync({ paymentMethod: "cash", offeredFare });
      navigation.navigate("RideTracking", { rideId: ride.id });
    } catch (e) {
      const msg = (e as { message?: string })?.message ?? "Please try again.";
      Alert.alert("Couldn't book ride", msg);
    }
  }

  const region = pickup && dropoff ? regionForPoints(pickup.point, dropoff.point) : undefined;

  return (
    <View className="flex-1 bg-canvas-light dark:bg-canvas-dark">
      <RideMap ref={mapRef} region={region} pickup={pickup?.point} dropoff={dropoff?.point} vehicles={nearbyDrivers ?? []} />

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
        snapPoints={["35%", "88%"]}
        handleComponent={SheetHandle}
        backgroundStyle={{ backgroundColor: colors.surface, borderRadius: 28 }}
      >
        <BottomSheetScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48, gap: 16 }} showsVerticalScrollIndicator={false}>
          <Text className="text-2xl font-black text-light-text dark:text-dark-text">
            {dropoff ? "Confirm your ride" : "Where to?"}
          </Text>

          {/* Location stepper card — tap a row to open the map picker */}
          <View className="rounded-2xl bg-light-border/40 dark:bg-elevated-dark p-1">
            <Pressable
              className="flex-row items-center gap-3 px-3 py-3.5"
              onPress={() => navigation.navigate("LocationPicker", { field: "pickup" })}
            >
              <View className="h-2.5 w-2.5 rounded-full bg-brand" />
              <Text numberOfLines={1} className="flex-1 font-semibold text-light-text dark:text-dark-text">
                {locating ? "Locating you…" : pickup?.address ?? "Set pickup location"}
              </Text>
              <Text className="text-base">✏️</Text>
            </Pressable>
            <View className="ml-[18px] h-4 w-0.5 bg-light-border dark:bg-dark-border" />
            <Pressable
              className="flex-row items-center gap-3 px-3 py-3.5"
              onPress={() => navigation.navigate("LocationPicker", { field: "dropoff" })}
            >
              <View className="h-2.5 w-2.5 rounded-sm bg-light-text dark:bg-white" />
              <Text numberOfLines={1} className="flex-1 font-semibold text-light-text dark:text-dark-text">
                {dropoff?.address ?? "Where are you going?"}
              </Text>
              <Text className="text-base">✏️</Text>
            </Pressable>
          </View>

          {!dropoff && (
            <View className="flex-row gap-2.5">
              <Chip label="Choose on map" icon={<Text>📍</Text>} onPress={() => navigation.navigate("LocationPicker", { field: "dropoff" })} />
              <Chip label="Saved" icon={<Text>⭐</Text>} onPress={() => navigation.navigate("SavedLocations")} />
            </View>
          )}

          {dropoff && (
            <>
              <VehicleClassSelector selected={vehicleClass} onSelect={setVehicleClass} fares={fares} />

              {/* Name your price (inDrive style) */}
              <View className="mt-4 rounded-2xl bg-light-border/40 dark:bg-elevated-dark p-4">
                <Text className="mb-1 text-center text-sm font-semibold text-light-textMuted dark:text-dark-textMuted">
                  Your offer
                </Text>
                <View className="flex-row items-center justify-between">
                  <Pressable onPress={() => adjustFare(-10)} className="h-12 w-12 items-center justify-center rounded-full bg-surface-light dark:bg-surface-dark">
                    <Text className="text-2xl font-black text-brand">−</Text>
                  </Pressable>
                  <Text className="text-3xl font-black text-light-text dark:text-dark-text">
                    {offeredFare ? formatMoney(offeredFare, CURRENCY) : estimating ? "…" : "—"}
                  </Text>
                  <Pressable onPress={() => adjustFare(10)} className="h-12 w-12 items-center justify-center rounded-full bg-surface-light dark:bg-surface-dark">
                    <Text className="text-2xl font-black text-brand">+</Text>
                  </Pressable>
                </View>
                <Text className="mt-1 text-center text-xs text-light-textMuted dark:text-dark-textMuted">
                  Suggested {fares[vehicleClass] ? formatMoney(fares[vehicleClass]!.totalAmount, CURRENCY) : "—"} · pay Cash
                </Text>
              </View>

              <View className="mt-4">
                <Button label="Find a driver" size="lg" loading={book.isPending} disabled={!pickup || !dropoff || !offeredFare} onPress={handleConfirm} />
              </View>
            </>
          )}
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
}
