import React, { useEffect, useRef } from "react";
import { View, Text, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type MapView from "react-native-maps";

import type { PassengerStackParamList } from "@/navigation/types";
import { RideMap } from "@/components/map/RideMap";
import { DriverCard } from "@/components/ride/DriverCard";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/States";
import { useActiveRide } from "@/hooks/useActiveRide";
import { useDriverTracking } from "@/hooks/useDriverTracking";
import { rideService } from "@/services/rides";
import { supabase } from "@/services/supabase";
import { mapDriver, mapProfile } from "@/services/mappers";
import { RIDE, RIDE_STATUS_COPY } from "@/constants";
import { useRideStore } from "@/store/rideStore";

type Props = NativeStackScreenProps<PassengerStackParamList, "RideTracking">;

/**
 * Live ride tracking. Shows the driver moving toward pickup/destination in
 * real time. The ride row is kept live via Realtime (useActiveRide), and the
 * driver's GPS via useDriverTracking. While still matching, we poll the
 * dispatcher to widen the search / reassign on rejection.
 */
export function RideTrackingScreen({ navigation, route }: Props) {
  const mapRef = useRef<MapView>(null);
  const { data: ride } = useActiveRide();
  const { location: driverLoc, heading } = useDriverTracking(ride?.id);
  const resetBooking = useRideStore((s) => s.resetBooking);

  // Driver profile + vehicle (only once assigned).
  const { data: driverBundle } = useQuery({
    queryKey: ["driver-bundle", ride?.driverId],
    enabled: !!ride?.driverId,
    queryFn: async () => {
      const [{ data: d }, { data: p }] = await Promise.all([
        supabase.from("drivers").select("*").eq("id", ride!.driverId!).single(),
        supabase.from("profiles").select("*").eq("id", ride!.driverId!).single(),
      ]);
      return { driver: mapDriver(d), profile: mapProfile(p) };
    },
  });

  // While matching, nudge the dispatcher to run the next wave.
  useEffect(() => {
    if (!ride || !["requested", "matching"].includes(ride.status)) return;
    const t = setInterval(() => void rideService.pokeDispatch(ride.id), RIDE.dispatchPollMs);
    return () => clearInterval(t);
  }, [ride]);

  // Navigate to summary/rating on terminal states.
  useEffect(() => {
    if (!ride) return;
    if (ride.status === "completed") {
      resetBooking();
      navigation.replace("RideSummary", { rideId: ride.id });
    } else if (ride.status === "cancelled" || ride.status === "no_drivers") {
      resetBooking();
      Alert.alert(RIDE_STATUS_COPY[ride.status]?.title ?? "Ride ended", RIDE_STATUS_COPY[ride.status]?.subtitle);
      navigation.goBack();
    }
  }, [ride, navigation, resetBooking]);

  if (!ride) return <LoadingState message="Loading your ride…" />;

  const copy = RIDE_STATUS_COPY[ride.status] ?? { title: ride.status, subtitle: "" };
  const matching = ["requested", "matching"].includes(ride.status);

  async function handleCancel() {
    Alert.alert("Cancel ride?", "Are you sure you want to cancel?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, cancel",
        style: "destructive",
        onPress: async () => {
          await rideService.cancelRide(ride!.id, "passenger");
        },
      },
    ]);
  }

  return (
    <View className="flex-1 bg-canvas-light dark:bg-canvas-dark">
      <RideMap
        ref={mapRef}
        pickup={ride.pickup.point}
        dropoff={ride.dropoff.point}
        driver={driverLoc}
        driverHeading={heading}
      />

      <SafeAreaView edges={["bottom"]} className="absolute inset-x-0 bottom-0 gap-3 p-4">
        <Card>
          <Text className="text-xl font-extrabold text-light-text dark:text-dark-text">{copy.title}</Text>
          <Text className="text-light-textMuted dark:text-dark-textMuted">{copy.subtitle}</Text>
        </Card>

        {driverBundle && !matching && (
          <DriverCard
            driver={driverBundle.driver}
            profile={driverBundle.profile}
            etaLabel={ride.status === "accepted" || ride.status === "arriving" ? "Driver is on the way" : undefined}
          />
        )}

        {(matching || ride.status === "accepted" || ride.status === "arriving") && (
          <Button label="Cancel ride" variant="danger" onPress={handleCancel} />
        )}
      </SafeAreaView>
    </View>
  );
}
