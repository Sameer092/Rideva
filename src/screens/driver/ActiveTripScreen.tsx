import React, { useMemo } from "react";
import { View, Text, Linking, Platform, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { DriverStackParamList } from "@/navigation/types";
import { RideMap } from "@/components/map/RideMap";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { LoadingState } from "@/components/ui/States";
import { useActiveRide } from "@/hooks/useActiveRide";
import { useDriverLocationBroadcast } from "@/hooks/useDriverLocationBroadcast";
import { rideService } from "@/services/rides";
import { formatMoney } from "@/utils/format";
import type { RideStatus } from "@/types";

type Props = NativeStackScreenProps<DriverStackParamList, "ActiveTrip">;

const NEXT: Record<string, { label: string; status: RideStatus }> = {
  accepted: { label: "I've arrived", status: "arrived" },
  arriving: { label: "I've arrived", status: "arrived" },
  arrived: { label: "Start ride", status: "in_progress" },
};

export function ActiveTripScreen({ navigation }: Props) {
  const { data: ride } = useActiveRide();
  const [busy, setBusy] = React.useState(false);
  useDriverLocationBroadcast(!!ride, ride?.id ?? null);

  const target = useMemo(() => {
    if (!ride) return null;
    return ride.status === "in_progress" ? ride.dropoff.point : ride.pickup.point;
  }, [ride]);

  if (!ride) return <LoadingState />;

  const goingToDropoff = ride.status === "in_progress";

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
    if (busy) return;
    setBusy(true);
    try {
      const step = NEXT[ride!.status];
      if (step) {
        await rideService.updateRideStatus(ride!.id, step.status);
      } else if (ride!.status === "in_progress") {
        // Settle the fare + write earnings, confirm, then rate the passenger.
        await rideService.completeRide(ride!.id, ride!.distanceM ?? 0, ride!.durationS ?? 0);
        const fare = ride!.fareFinal ?? ride!.offeredFare ?? 0;
        Alert.alert(
          "Ride complete 🎉",
          `${formatMoney(fare, ride!.currency)} added to your earnings.`,
          [{ text: "Rate passenger", onPress: () => navigation.replace("Rate", { rideId: ride!.id, rateeId: ride!.passengerId }) }],
        );
      }
    } catch (e) {
      Alert.alert("Couldn't complete", (e as { message?: string })?.message ?? "Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const cta = NEXT[ride.status]?.label ?? (goingToDropoff ? "Complete ride" : "Waiting…");

  return (
    <View className="flex-1 bg-canvas-light dark:bg-canvas-dark">
      <RideMap pickup={ride.pickup.point} dropoff={ride.dropoff.point} showsUserLocation />

      <SafeAreaView edges={["bottom"]} className="absolute inset-x-0 bottom-0 gap-3 p-4">
        <Card elevation="lg">
          <View className="flex-row items-center gap-3">
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-700/25">
              <Icon name={goingToDropoff ? "flag" : "location"} size={22} color="#6D5EF6" />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-bold uppercase tracking-wide text-brand">
                {goingToDropoff ? "Drive to destination" : "Drive to pickup"}
              </Text>
              <Text className="text-base font-extrabold text-light-text dark:text-dark-text" numberOfLines={2}>
                {goingToDropoff ? ride.dropoff.address : ride.pickup.address}
              </Text>
            </View>
          </View>
        </Card>

        <Button label="Open navigation" variant="outline" leftIcon={<Icon name="navigate-outline" size={18} />} onPress={openExternalNav} />
        <Button label={cta} size="lg" loading={busy} onPress={advance} />
        {["accepted", "arriving"].includes(ride.status) && (
          <Button
            label="Cancel ride"
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
