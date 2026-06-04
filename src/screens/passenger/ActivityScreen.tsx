import React from "react";
import { View, Text, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Chip";
import { EmptyState, LoadingState } from "@/components/ui/States";
import { rideService } from "@/services/rides";
import { qk } from "@/lib/queryClient";
import { useAuthStore } from "@/store/authStore";
import { formatMoney, formatDistance, relativeTime } from "@/utils/format";

export function ActivityScreen() {
  const userId = useAuthStore((s) => s.session?.user.id);
  const role = useAuthStore((s) => (s.profile?.role === "driver" ? "driver" : "passenger"));

  const { data, isLoading } = useQuery({
    queryKey: qk.rideHistory(role),
    queryFn: () => rideService.history(userId!, role),
    enabled: !!userId,
  });

  if (isLoading) return <LoadingState />;

  return (
    <SafeAreaView className="flex-1 bg-canvas-light dark:bg-canvas-dark" edges={["top"]}>
      <FlatList
        data={data ?? []}
        keyExtractor={(r) => r.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListHeaderComponent={<Text className="px-1 pb-1 pt-2 text-3xl font-black text-light-text dark:text-dark-text">Your rides</Text>}
        ListEmptyComponent={<EmptyState emoji="🧾" title="No rides yet" subtitle="Your completed rides will appear here." />}
        renderItem={({ item }) => (
          <Card elevation="sm">
            <View className="flex-row items-start gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-700/25">
                <Text>📍</Text>
              </View>
              <View className="flex-1">
                <Text className="font-extrabold text-light-text dark:text-dark-text" numberOfLines={1}>
                  {item.dropoff.address}
                </Text>
                <Text className="text-sm text-light-textMuted dark:text-dark-textMuted">
                  {relativeTime(item.requestedAt)} · {formatDistance(item.distanceM)}
                </Text>
                <View className="mt-2">
                  <StatusBadge label={item.status} tone={item.status === "completed" ? "success" : "danger"} />
                </View>
              </View>
              <Text className="text-lg font-black text-light-text dark:text-dark-text">
                {formatMoney(item.fareFinal ?? item.fareEstimate ?? 0, item.currency)}
              </Text>
            </View>
          </Card>
        )}
      />
    </SafeAreaView>
  );
}
