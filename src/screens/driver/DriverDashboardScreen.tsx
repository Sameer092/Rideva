import React, { useEffect, useState } from "react";
import { View, Text, Switch, Alert, ScrollView, Pressable, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { DriverStackParamList, DriverTabParamList } from "@/navigation/types";
import { RideMap } from "@/components/map/RideMap";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useNearbyRequests } from "@/hooks/useNearbyRequests";
import { useActiveRide } from "@/hooks/useActiveRide";
import { useDriverLocationBroadcast } from "@/hooks/useDriverLocationBroadcast";
import { rideService } from "@/services/rides";
import { formatDistance, formatMoney, formatEta } from "@/utils/format";
import { SHADOWS } from "@/theme";
import type { NearbyRequest } from "@/types";

type Props = CompositeScreenProps<
  BottomTabScreenProps<DriverTabParamList, "DashboardTab">,
  NativeStackScreenProps<DriverStackParamList>
>;

export function DriverDashboardScreen({ navigation }: Props) {
  const [online, setOnline] = useState(false);
  const { data: activeRide } = useActiveRide();
  const { data: requests } = useNearbyRequests(online && !activeRide);
  const queryClient = useQueryClient();
  const [counterFor, setCounterFor] = useState<string | null>(null);
  const [counterAmount, setCounterAmount] = useState("");

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
      Alert.alert("Error", (e as { message?: string })?.message ?? "Could not update status");
    }
  }

  async function bid(ride: NearbyRequest, amount: number) {
    try {
      await rideService.submitBid(ride.rideId, amount);
      setCounterFor(null);
      setCounterAmount("");
      Alert.alert("Offer sent", "We'll notify you if the passenger accepts.");
      void queryClient.invalidateQueries({ queryKey: ["nearby_requests"] });
    } catch (e) {
      Alert.alert("Error", (e as { message?: string })?.message ?? "Could not send offer");
    }
  }

  return (
    <View className="flex-1 bg-canvas-light dark:bg-canvas-dark">
      <RideMap />

      <SafeAreaView edges={["top"]} className="absolute inset-x-0 top-0 px-4">
        <Card className="flex-row items-center justify-between" elevation="lg">
          <View className="flex-row items-center gap-3">
            <View className={`h-3 w-3 rounded-full ${online ? "bg-success" : "bg-light-textMuted"}`} />
            <View>
              <Text className="text-lg font-black text-light-text dark:text-dark-text">
                {online ? "You're online" : "You're offline"}
              </Text>
              <Text className="text-xs text-light-textMuted dark:text-dark-textMuted">
                {online ? "Browse requests and send offers" : "Go online to see ride requests"}
              </Text>
            </View>
          </View>
          <Switch value={online} onValueChange={toggleOnline} trackColor={{ true: "#6D5EF6" }} thumbColor="#fff" />
        </Card>
      </SafeAreaView>

      {online && (
        <SafeAreaView edges={["bottom"]} className="absolute inset-x-0 bottom-0" style={{ maxHeight: "62%" }}>
          <View className="m-4 rounded-3xl bg-surface-light dark:bg-surface-dark p-4" style={SHADOWS.lg}>
            <Text className="mb-2 text-lg font-black text-light-text dark:text-dark-text">
              Nearby requests {requests?.length ? `(${requests.length})` : ""}
            </Text>
            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              {(requests ?? []).length === 0 ? (
                <View className="items-center gap-2 py-8">
                  <Text className="text-3xl">📡</Text>
                  <Text className="text-center text-light-textMuted dark:text-dark-textMuted">
                    Waiting for ride requests near you…
                  </Text>
                </View>
              ) : (
                (requests ?? []).map((r) => (
                  <View key={r.rideId} className="mb-3 rounded-2xl bg-light-border/40 dark:bg-elevated-dark p-3">
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1 pr-2">
                        <Text numberOfLines={1} className="font-semibold text-light-text dark:text-dark-text">📍 {r.pickupAddress}</Text>
                        <Text numberOfLines={1} className="text-light-textMuted dark:text-dark-textMuted">🏁 {r.dropoffAddress}</Text>
                        <Text className="mt-1 text-xs text-light-textMuted dark:text-dark-textMuted">
                          {formatDistance(r.pickupDistanceM)} away · trip {formatDistance(r.tripDistanceM)} · {formatEta(r.etaS)}
                        </Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-xs text-light-textMuted dark:text-dark-textMuted">Offer</Text>
                        <Text className="text-xl font-black text-brand">{formatMoney(r.offeredFare ?? 0, r.currency)}</Text>
                      </View>
                    </View>

                    {counterFor === r.rideId ? (
                      <View className="mt-3 flex-row items-center gap-2">
                        <View className="flex-1 flex-row items-center gap-1 rounded-xl bg-surface-light dark:bg-surface-dark px-3 h-11">
                          <Text className="font-bold text-light-text dark:text-dark-text">₨</Text>
                          <TextInput
                            value={counterAmount}
                            onChangeText={setCounterAmount}
                            keyboardType="number-pad"
                            placeholder={String(Math.round((r.offeredFare ?? 0) / 100))}
                            placeholderTextColor="#9AA0AD"
                            style={{ paddingVertical: 0, fontSize: 16 }}
                            className="flex-1 text-light-text dark:text-dark-text"
                          />
                        </View>
                        <Button
                          label="Send"
                          size="sm"
                          fullWidth={false}
                          onPress={() => {
                            const rupees = parseInt(counterAmount || "0", 10);
                            if (rupees > 0) void bid(r, rupees * 100);
                          }}
                        />
                      </View>
                    ) : (
                      <View className="mt-3 flex-row gap-2">
                        <View className="flex-1">
                          <Button label="Counter" variant="outline" size="sm" onPress={() => { setCounterFor(r.rideId); setCounterAmount(""); }} />
                        </View>
                        <View className="flex-[1.4]">
                          <Button label={`Accept ${formatMoney(r.offeredFare ?? 0, r.currency)}`} size="sm" onPress={() => void bid(r, r.offeredFare ?? 0)} />
                        </View>
                      </View>
                    )}
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </SafeAreaView>
      )}
    </View>
  );
}
