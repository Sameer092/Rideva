import React from "react";
import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { PassengerStackParamList } from "@/navigation/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/States";
import { rideService } from "@/services/rides";
import { qk } from "@/lib/queryClient";
import { formatMoney, formatDistance, formatDuration } from "@/utils/format";

type Props = NativeStackScreenProps<PassengerStackParamList, "RideSummary">;

/** Post-trip receipt: route summary, fare, payment status, prompt to rate. */
export function RideSummaryScreen({ navigation, route }: Props) {
  const { rideId } = route.params;
  const { data: ride } = useQuery({ queryKey: qk.ride(rideId), queryFn: () => rideService.getRide(rideId) });

  if (!ride) return <LoadingState />;

  return (
    <SafeAreaView className="flex-1 bg-canvas-light dark:bg-canvas-dark">
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <View className="items-center gap-1">
          <Text className="text-5xl">🎉</Text>
          <Text className="text-2xl font-extrabold text-light-text dark:text-dark-text">Trip complete</Text>
        </View>

        <Card>
          <Text className="font-bold text-light-text dark:text-dark-text">Route</Text>
          <Text className="mt-1 text-light-textMuted dark:text-dark-textMuted">📍 {ride.pickup.address}</Text>
          <Text className="text-light-textMuted dark:text-dark-textMuted">🏁 {ride.dropoff.address}</Text>
          <View className="mt-3 flex-row justify-between">
            <Text className="text-light-textMuted dark:text-dark-textMuted">
              {formatDistance(ride.distanceM)} · {formatDuration(ride.durationS)}
            </Text>
            <Text className="font-bold text-light-text dark:text-dark-text">
              {formatMoney(ride.fareFinal ?? ride.fareEstimate ?? 0, ride.currency)}
            </Text>
          </View>
        </Card>

        <Card>
          <View className="flex-row justify-between">
            <Text className="text-light-text dark:text-dark-text">Payment</Text>
            <Text className="font-semibold capitalize text-light-text dark:text-dark-text">{ride.paymentMethod}</Text>
          </View>
        </Card>

        {ride.driverId && (
          <Button label="Rate your driver" onPress={() => navigation.replace("Rate", { rideId, rateeId: ride.driverId! })} />
        )}
        <Button label="Done" variant="ghost" onPress={() => navigation.popToTop()} />
      </ScrollView>
    </SafeAreaView>
  );
}
