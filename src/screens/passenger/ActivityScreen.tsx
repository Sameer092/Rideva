import React from "react";
import { View, Text, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/Card";
import { EmptyState, LoadingState } from "@/components/ui/States";
import { rideService } from "@/services/rides";
import { qk } from "@/lib/queryClient";
import { useAuthStore } from "@/store/authStore";
import { formatMoney, formatDistance, relativeTime } from "@/utils/format";

/** Ride history for the current user (works for both passengers and drivers). */
export function ActivityScreen() {
  const userId = useAuthStore((s) => s.session?.user.id);
  const role = useAuthStore((s) => s.profile?.role === "driver" ? "driver" : "passenger");

  const { data, isLoading } = useQuery({
    queryKey: qk.rideHistory(role),
    queryFn: () => rideService.history(userId!, role),
    enabled: !!userId,
  });

  if (isLoading) return <LoadingState />;

  return (
    <SafeAreaView className="flex-1 bg-canvas-light dark:bg-canvas-dark">
      <Text className="px-5 pt-4 text-2xl font-extrabold text-light-text dark:text-dark-text">Your trips</Text>
      <FlatList
        data={data ?? []}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListEmptyComponent={<EmptyState emoji="🧾" title="No trips yet" subtitle="Your completed rides will appear here." />}
        renderItem={({ item }) => (
          <Card>
            <View className="flex-row justify-between">
              <Text className="font-semibold text-light-text dark:text-dark-text" numberOfLines={1}>
                {item.dropoff.address}
              </Text>
              <Text className="font-bold text-light-text dark:text-dark-text">
                {formatMoney(item.fareFinal ?? item.fareEstimate ?? 0, item.currency)}
              </Text>
            </View>
            <Text className="text-sm text-light-textMuted dark:text-dark-textMuted">
              {relativeTime(item.requestedAt)} · {formatDistance(item.distanceM)} ·{" "}
              <Text className={item.status === "completed" ? "text-success" : "text-danger"}>{item.status}</Text>
            </Text>
          </Card>
        )}
      />
    </SafeAreaView>
  );
}
