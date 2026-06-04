import React from "react";
import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { PassengerStackParamList } from "@/navigation/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Chip";
import { LoadingState } from "@/components/ui/States";
import { rideService } from "@/services/rides";
import { qk } from "@/lib/queryClient";
import { formatMoney, formatDistance, formatDuration } from "@/utils/format";

type Props = NativeStackScreenProps<PassengerStackParamList, "RideSummary">;

export function RideSummaryScreen({ navigation, route }: Props) {
  const { rideId } = route.params;
  const { data: ride } = useQuery({ queryKey: qk.ride(rideId), queryFn: () => rideService.getRide(rideId) });

  if (!ride) return <LoadingState />;

  return (
    <SafeAreaView className="flex-1 bg-canvas-light dark:bg-canvas-dark">
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} showsVerticalScrollIndicator={false}>
        <View className="items-center gap-2 pt-4">
          <Text className="text-6xl">🎉</Text>
          <Text className="text-3xl font-black text-light-text dark:text-dark-text">Trip complete</Text>
          <Text className="text-light-textMuted dark:text-dark-textMuted">Thanks for riding with Rideva</Text>
        </View>

        <Card>
          <Text className="text-sm font-semibold text-light-textMuted dark:text-dark-textMuted">TOTAL</Text>
          <Text className="text-4xl font-black text-light-text dark:text-dark-text">
            {formatMoney(ride.fareFinal ?? ride.fareEstimate ?? 0, ride.currency)}
          </Text>
        </Card>

        <Card>
          <View className="rounded-2xl bg-light-border/40 dark:bg-elevated-dark p-1">
            <View className="flex-row items-center gap-3 px-3 py-3">
              <View className="h-2.5 w-2.5 rounded-full bg-brand" />
              <Text numberOfLines={1} className="flex-1 text-light-text dark:text-dark-text">{ride.pickup.address}</Text>
            </View>
            <View className="ml-[18px] h-3 w-0.5 bg-light-border dark:bg-dark-border" />
            <View className="flex-row items-center gap-3 px-3 py-3">
              <View className="h-2.5 w-2.5 rounded-sm bg-light-text dark:bg-white" />
              <Text numberOfLines={1} className="flex-1 text-light-text dark:text-dark-text">{ride.dropoff.address}</Text>
            </View>
          </View>
          <View className="mt-3 flex-row items-center justify-between">
            <Text className="text-light-textMuted dark:text-dark-textMuted">
              {formatDistance(ride.distanceM)} · {formatDuration(ride.durationS)}
            </Text>
            <View className="flex-row items-center gap-2">
              <Text className="font-bold capitalize text-light-text dark:text-dark-text">{ride.paymentMethod}</Text>
              <StatusBadge label="paid" tone="success" />
            </View>
          </View>
        </Card>

        <View className="gap-2">
          {ride.driverId && (
            <Button label="Rate your driver" size="lg" onPress={() => navigation.replace("Rate", { rideId, rateeId: ride.driverId! })} />
          )}
          <Button label="Done" variant="ghost" onPress={() => navigation.popToTop()} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
