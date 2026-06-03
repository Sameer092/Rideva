import React, { useMemo } from "react";
import { View, Text, Linking, Platform, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { DriverStackParamList } from "@/navigation/types";
import { RideMap } from "@/components/map/RideMap";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/States";
import { useActiveRide } from "@/hooks/useActiveRide";
import { useDriverLocationBroadcast } from "@/hooks/useDriverLocationBroadcast";
import { rideService } from "@/services/rides";
import type { RideStatus } from "@/types";

type Props = NativeStackScreenProps<DriverStackParamList, "ActiveTrip">;

/**
 * Driver's active-trip cockpit. Drives the ride state machine forward and
 * broadcasts location throughout. The primary CTA changes label/action by
 * status: en-route → arrived → start trip → complete.
 */
const NEXT: Record<string, { label: string; status: RideStatus }> = {
  accepted: { label: "I've arrived", status: "arrived" },
  arriving: { label: "I've arrived", status: "arrived" },
  arrived: { label: "Start trip", status: "in_progress" },
};

export function ActiveTripScreen({ navigation, route }: Props) {
  const { data: ride } = useActiveRide();
  useDriverLocationBroadcast(!!ride, ride?.id ?? null);

  // Target the driver should navigate to (pickup before start, dropoff after).
  const target = useMemo(() => {
    if (!ride) return null;
    return ride.status === "in_progress" ? ride.dropoff.point : ride.pickup.point;
  }, [ride]);

  if (!ride) return <LoadingState />;

  function openExternalNav() {
    if (!target) return;
    const { latitude, longitude } = target;
    const url = Platform.select({
      ios: `maps://?daddr=${latitude},${longitude}`,
      android: `google.navigation:q=${latitude},${longitude}`,
    });
    if (url) void Linking.openURL(url);
  }

  async function advance() {
    const step = NEXT[ride!.status];
    if (step) {
      await rideService.updateRideStatus(ride!.id, step.status);
      return;
    }
    if (ride!.status === "in_progress") {
      // Complete: settle the fare using the planned route metrics (replace with
      // actual driven distance/time when integrating turn-by-turn tracking).
      await rideService.completeRide(ride!.id, ride!.distanceM ?? 0, ride!.durationS ?? 0);
      navigation.replace("Rate", { rideId: ride!.id, rateeId: ride!.passengerId });
    }
  }

  const cta = NEXT[ride.status]?.label ?? (ride.status === "in_progress" ? "Complete trip" : "Waiting…");

  return (
    <View className="flex-1 bg-canvas-light dark:bg-canvas-dark">
      <RideMap
        pickup={ride.pickup.point}
        dropoff={ride.dropoff.point}
        showsUserLocation
      />

      <SafeAreaView edges={["bottom"]} className="absolute inset-x-0 bottom-0 gap-3 p-4">
        <Card>
          <Text className="text-sm uppercase tracking-wide text-light-textMuted dark:text-dark-textMuted">
            {ride.status === "in_progress" ? "Drive to destination" : "Drive to pickup"}
          </Text>
          <Text className="text-lg font-bold text-light-text dark:text-dark-text" numberOfLines={2}>
            {ride.status === "in_progress" ? ride.dropoff.address : ride.pickup.address}
          </Text>
        </Card>

        <Button label="Open navigation" variant="outline" onPress={openExternalNav} />
        <Button label={cta} onPress={advance} />
        {["accepted", "arriving"].includes(ride.status) && (
          <Button
            label="Cancel"
            variant="ghost"
            onPress={() =>
              Alert.alert("Cancel trip?", "", [
                { text: "No" },
                { text: "Yes", style: "destructive", onPress: () => rideService.cancelRide(ride.id, "driver") },
              ])
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}
