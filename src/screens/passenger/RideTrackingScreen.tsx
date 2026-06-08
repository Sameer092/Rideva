import React, { useEffect, useRef } from "react";
import { View, Text, Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { PassengerStackParamList } from "@/navigation/types";
import type { RideMapHandle } from "@/components/map/RideMap";
import { RideMap } from "@/components/map/RideMap";
import { DriverCard } from "@/components/ride/DriverCard";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { LoadingState } from "@/components/ui/States";
import { useActiveRide } from "@/hooks/useActiveRide";
import { useDriverTracking } from "@/hooks/useDriverTracking";
import { useRideBids } from "@/hooks/useRideBids";
import { rideService } from "@/services/rides";
import { supabase } from "@/services/supabase";
import { mapDriver, mapProfile } from "@/services/mappers";
import { RIDE_STATUS_COPY } from "@/constants";
import { useRideStore } from "@/store/rideStore";
import { formatMoney, formatDistance, formatEta } from "@/utils/format";

type Props = NativeStackScreenProps<PassengerStackParamList, "RideTracking">;

export function RideTrackingScreen({ navigation }: Props) {
  const mapRef = useRef<RideMapHandle>(null);
  const { data: ride } = useActiveRide();
  const { location: driverLoc, heading } = useDriverTracking(ride?.id);
  const resetBooking = useRideStore((s) => s.resetBooking);

  const matching = !!ride && ["requested", "matching"].includes(ride.status);
  const { data: bids } = useRideBids(ride?.id, matching);
  const [accepting, setAccepting] = React.useState<string | null>(null);

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

  async function accept(offerId: string) {
    setAccepting(offerId);
    try {
      const won = await rideService.acceptBid(offerId);
      if (!won) Alert.alert("Unavailable", "That offer is no longer available.");
    } catch (e) {
      Alert.alert("Error", (e as { message?: string })?.message ?? "Could not accept offer");
    } finally {
      setAccepting(null);
    }
  }

  function handleCancel() {
    Alert.alert("Cancel ride?", "Are you sure you want to cancel?", [
      { text: "Keep ride", style: "cancel" },
      { text: "Yes, cancel", style: "destructive", onPress: () => rideService.cancelRide(ride!.id, "passenger") },
    ]);
  }

  return (
    <View className="flex-1 bg-canvas-light dark:bg-canvas-dark">
      <RideMap ref={mapRef} pickup={ride.pickup.point} dropoff={ride.dropoff.point} driver={driverLoc} driverHeading={heading} />

      <SafeAreaView edges={["bottom"]} className="absolute inset-x-0 bottom-0 gap-3 p-4" style={{ maxHeight: "70%" }}>
        {matching ? (
          <Card>
            <View className="mb-2 flex-row items-center justify-between">
              <View>
                <Text className="text-xl font-black text-light-text dark:text-dark-text">Choosing your driver</Text>
                <Text className="text-light-textMuted dark:text-dark-textMuted">
                  {bids && bids.length > 0 ? `${bids.length} offer${bids.length > 1 ? "s" : ""} — pick one` : "Waiting for driver offers…"}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-xs text-light-textMuted dark:text-dark-textMuted">Your offer</Text>
                <Text className="text-lg font-black text-brand">{formatMoney(ride.offeredFare ?? ride.fareEstimate ?? 0, ride.currency)}</Text>
              </View>
            </View>

            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              {(bids ?? []).length === 0 ? (
                <View className="items-center gap-2 py-6">
                  <Icon name="search" size={28} muted />
                  <Text className="text-center text-light-textMuted dark:text-dark-textMuted">
                    Drivers nearby are reviewing your request…
                  </Text>
                </View>
              ) : (
                (bids ?? []).map((b) => (
                  <View key={b.offerId} className="mb-2 flex-row items-center gap-3 rounded-2xl bg-light-border/40 dark:bg-elevated-dark p-3">
                    <Avatar name={b.driverName} size={44} />
                    <View className="flex-1">
                      <Text className="font-extrabold text-light-text dark:text-dark-text">{b.driverName}</Text>
                      <Text className="text-xs text-light-textMuted dark:text-dark-textMuted">
                        {b.rating > 0 ? `★ ${b.rating.toFixed(1)}` : "New"} · {formatDistance(b.distanceM)} · {formatEta(b.etaS)}
                      </Text>
                      <View className="mt-0.5 flex-row items-center gap-2">
                        <Text className="text-xs text-light-textMuted dark:text-dark-textMuted" numberOfLines={1}>
                          {[b.vehicleColor, b.vehicleMake, b.vehicleModel].filter(Boolean).join(" ") || "Vehicle"}
                        </Text>
                        {b.licensePlate && (
                          <View className="rounded-md border border-light-border dark:border-dark-border px-1.5 py-0.5">
                            <Text className="text-[11px] font-black tracking-widest text-light-text dark:text-dark-text">
                              {b.licensePlate}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <View className="items-end gap-1">
                      <Text className="text-lg font-black text-light-text dark:text-dark-text">{formatMoney(b.bidAmount, ride.currency)}</Text>
                      <Button label="Accept" size="sm" fullWidth={false} loading={accepting === b.offerId} onPress={() => accept(b.offerId)} />
                    </View>
                  </View>
                ))
              )}
            </ScrollView>

            <View className="mt-1">
              <Button label="Cancel request" variant="ghost" onPress={handleCancel} />
            </View>
          </Card>
        ) : (
          <>
            <Card>
              <Text className="text-xl font-black text-light-text dark:text-dark-text">{copy.title}</Text>
              <Text className="text-light-textMuted dark:text-dark-textMuted">{copy.subtitle}</Text>
              {ride.fareFinal != null && (
                <Text className="mt-1 font-bold text-brand">Agreed fare {formatMoney(ride.fareFinal, ride.currency)}</Text>
              )}
            </Card>

            {driverBundle && (
              <DriverCard
                driver={driverBundle.driver}
                profile={driverBundle.profile}
                etaLabel={["accepted", "arriving"].includes(ride.status) ? "Your driver is on the way" : undefined}
              />
            )}

            {["accepted", "arriving"].includes(ride.status) && (
              <Button label="Cancel ride" variant="danger" onPress={handleCancel} />
            )}
          </>
        )}
      </SafeAreaView>
    </View>
  );
}
