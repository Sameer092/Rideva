import React, { useEffect, useState } from "react";
import { View, Text, Switch, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { DriverStackParamList, DriverTabParamList } from "@/navigation/types";
import { RideMap } from "@/components/map/RideMap";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useIncomingOffers } from "@/hooks/useIncomingOffers";
import { useActiveRide } from "@/hooks/useActiveRide";
import { useDriverLocationBroadcast } from "@/hooks/useDriverLocationBroadcast";
import { rideService } from "@/services/rides";
import { formatDistance, formatMoney, formatEta } from "@/utils/format";

type Props = CompositeScreenProps<
  BottomTabScreenProps<DriverTabParamList, "DashboardTab">,
  NativeStackScreenProps<DriverStackParamList>
>;

/**
 * Driver home. Toggle online/offline, broadcast location while online, and
 * surface incoming ride offers in realtime. Accepting an offer (atomic RPC)
 * routes to the active-trip screen.
 */
export function DriverDashboardScreen({ navigation }: Props) {
  const [online, setOnline] = useState(false);
  const { data: offers } = useIncomingOffers();
  const { data: activeRide } = useActiveRide();
  const queryClient = useQueryClient();

  // Stream location while online OR on a trip.
  useDriverLocationBroadcast(online || !!activeRide, activeRide?.id ?? null);

  // If we already have an active trip, jump into it.
  useEffect(() => {
    if (activeRide && ["accepted", "arriving", "arrived", "in_progress"].includes(activeRide.status)) {
      navigation.navigate("ActiveTrip", { rideId: activeRide.id });
    }
  }, [activeRide, navigation]);

  async function toggleOnline(next: boolean) {
    setOnline(next);
    try {
      await rideService.setDriverStatus(next ? "online" : "offline");
    } catch (e) {
      setOnline(!next);
      Alert.alert("Error", e instanceof Error ? e.message : "Could not update status");
    }
  }

  async function accept(offerId: string) {
    try {
      const won = await rideService.acceptOffer(offerId);
      if (!won) {
        Alert.alert("Too late", "That ride was taken by another driver.");
        void queryClient.invalidateQueries();
      }
      // On win, the active-ride realtime hook + effect above navigate us in.
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Could not accept ride");
    }
  }

  const topOffer = offers?.[0];

  return (
    <View className="flex-1 bg-canvas-light dark:bg-canvas-dark">
      <RideMap showsUserLocation />

      <SafeAreaView edges={["top"]} className="absolute inset-x-0 top-0 p-4">
        <Card className="flex-row items-center justify-between">
          <View>
            <Text className="font-bold text-light-text dark:text-dark-text">
              {online ? "You're online" : "You're offline"}
            </Text>
            <Text className="text-sm text-light-textMuted dark:text-dark-textMuted">
              {online ? "Receiving ride requests" : "Go online to start earning"}
            </Text>
          </View>
          <Switch value={online} onValueChange={toggleOnline} trackColor={{ true: "#5B5BD6" }} />
        </Card>
      </SafeAreaView>

      {topOffer && (
        <SafeAreaView edges={["bottom"]} className="absolute inset-x-0 bottom-0 gap-3 p-4">
          <Card>
            <Text className="text-lg font-extrabold text-light-text dark:text-dark-text">New ride request</Text>
            <Text className="mt-1 text-light-textMuted dark:text-dark-textMuted" numberOfLines={1}>
              📍 {topOffer.ride.pickup.address}
            </Text>
            <Text className="text-light-textMuted dark:text-dark-textMuted" numberOfLines={1}>
              🏁 {topOffer.ride.dropoff.address}
            </Text>
            <View className="mt-2 flex-row justify-between">
              <Text className="text-light-textMuted dark:text-dark-textMuted">
                {formatDistance(topOffer.offer.distanceM)} away · {formatEta(topOffer.offer.etaS)}
              </Text>
              <Text className="font-bold text-light-text dark:text-dark-text">
                {formatMoney(topOffer.ride.fareEstimate ?? 0, topOffer.ride.currency)}
              </Text>
            </View>
            <View className="mt-3 flex-row gap-3">
              <View className="flex-1">
                <Button label="Reject" variant="outline" onPress={() => rideService.rejectOffer(topOffer.offer.id)} />
              </View>
              <View className="flex-1">
                <Button label="Accept" onPress={() => accept(topOffer.offer.id)} />
              </View>
            </View>
          </Card>
        </SafeAreaView>
      )}
    </View>
  );
}
