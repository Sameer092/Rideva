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
import { SHADOWS } from "@/theme";

type Props = CompositeScreenProps<
  BottomTabScreenProps<DriverTabParamList, "DashboardTab">,
  NativeStackScreenProps<DriverStackParamList>
>;

export function DriverDashboardScreen({ navigation }: Props) {
  const [online, setOnline] = useState(false);
  const { data: offers } = useIncomingOffers();
  const { data: activeRide } = useActiveRide();
  const queryClient = useQueryClient();

  useDriverLocationBroadcast(online || !!activeRide, activeRide?.id ?? null);

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
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Could not accept ride");
    }
  }

  const topOffer = offers?.[0];

  return (
    <View className="flex-1 bg-canvas-light dark:bg-canvas-dark">
      <RideMap showsUserLocation />

      {/* Online status banner */}
      <SafeAreaView edges={["top"]} className="absolute inset-x-0 top-0 px-4">
        <Card className="flex-row items-center justify-between" elevation="lg">
          <View className="flex-row items-center gap-3">
            <View className={`h-3 w-3 rounded-full ${online ? "bg-success" : "bg-light-textMuted"}`} />
            <View>
              <Text className="text-lg font-black text-light-text dark:text-dark-text">
                {online ? "You're online" : "You're offline"}
              </Text>
              <Text className="text-xs text-light-textMuted dark:text-dark-textMuted">
                {online ? "Listening for ride requests" : "Go online to start earning"}
              </Text>
            </View>
          </View>
          <Switch value={online} onValueChange={toggleOnline} trackColor={{ true: "#6D5EF6" }} thumbColor="#fff" />
        </Card>
      </SafeAreaView>

      {/* Idle hint */}
      {online && !topOffer && (
        <View className="absolute inset-x-0 bottom-10 items-center">
          <View className="flex-row items-center gap-2 rounded-full bg-surface-light dark:bg-surface-dark px-5 py-3" style={SHADOWS.md}>
            <Text className="text-base">📡</Text>
            <Text className="font-bold text-light-text dark:text-dark-text">Searching for ride requests…</Text>
          </View>
        </View>
      )}

      {/* Incoming offer */}
      {topOffer && (
        <SafeAreaView edges={["bottom"]} className="absolute inset-x-0 bottom-0 p-4">
          <Card elevation="lg">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-xl font-black text-light-text dark:text-dark-text">New ride request</Text>
              <Text className="text-2xl font-black text-brand">
                {formatMoney(topOffer.ride.fareEstimate ?? 0, topOffer.ride.currency)}
              </Text>
            </View>

            <View className="rounded-2xl bg-light-border/40 dark:bg-elevated-dark p-1">
              <View className="flex-row items-center gap-3 px-3 py-3">
                <View className="h-2.5 w-2.5 rounded-full bg-brand" />
                <Text numberOfLines={1} className="flex-1 font-semibold text-light-text dark:text-dark-text">{topOffer.ride.pickup.address}</Text>
              </View>
              <View className="ml-[18px] h-3 w-0.5 bg-light-border dark:bg-dark-border" />
              <View className="flex-row items-center gap-3 px-3 py-3">
                <View className="h-2.5 w-2.5 rounded-sm bg-light-text dark:bg-white" />
                <Text numberOfLines={1} className="flex-1 font-semibold text-light-text dark:text-dark-text">{topOffer.ride.dropoff.address}</Text>
              </View>
            </View>

            <Text className="mt-3 text-center text-sm text-light-textMuted dark:text-dark-textMuted">
              {formatDistance(topOffer.offer.distanceM)} away · {formatEta(topOffer.offer.etaS)}
            </Text>

            <View className="mt-4 flex-row gap-3">
              <View className="flex-1">
                <Button label="Decline" variant="outline" onPress={() => rideService.rejectOffer(topOffer.offer.id)} />
              </View>
              <View className="flex-[1.6]">
                <Button label="Accept ride" onPress={() => accept(topOffer.offer.id)} />
              </View>
            </View>
          </Card>
        </SafeAreaView>
      )}
    </View>
  );
}
