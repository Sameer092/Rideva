import React, { useMemo } from "react";
import { View, Text, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { EmptyState, LoadingState } from "@/components/ui/States";
import { rideService } from "@/services/rides";
import { qk } from "@/lib/queryClient";
import { useAuthStore } from "@/store/authStore";
import { formatMoney, relativeTime } from "@/utils/format";
import { GRADIENTS, GRADIENT_DIRECTION, SHADOWS } from "@/theme";

export function EarningsScreen() {
  const driverId = useAuthStore((s) => s.session?.user.id);
  const { data, isLoading } = useQuery({
    queryKey: qk.earnings("all"),
    queryFn: () => rideService.earnings(driverId!),
    enabled: !!driverId,
  });

  const totals = useMemo(() => {
    const list = data ?? [];
    return {
      net: list.reduce((s, e) => s + e.netAmount, 0),
      gross: list.reduce((s, e) => s + e.grossAmount, 0),
      trips: list.length,
      currency: list[0]?.currency ?? "USD",
    };
  }, [data]);

  if (isLoading) return <LoadingState />;

  return (
    <SafeAreaView className="flex-1 bg-canvas-light dark:bg-canvas-dark" edges={["top"]}>
      <FlatList
        data={data ?? []}
        keyExtractor={(e) => e.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 10 }}
        ListHeaderComponent={
          <View className="gap-4 pb-2">
            <Text className="px-1 pt-2 text-3xl font-black text-light-text dark:text-dark-text">Earnings</Text>
            <LinearGradient colors={[...GRADIENTS.brand]} {...GRADIENT_DIRECTION.diagonal} style={{ borderRadius: 28, ...SHADOWS.lg }}>
              <View className="items-center gap-1 p-6">
                <Text className="font-semibold text-white/70">Total net payout</Text>
                <Text className="text-5xl font-black text-white">{formatMoney(totals.net, totals.currency)}</Text>
                <View className="mt-2 flex-row gap-6">
                  <View className="items-center">
                    <Text className="text-lg font-extrabold text-white">{totals.trips}</Text>
                    <Text className="text-xs text-white/70">Rides</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-lg font-extrabold text-white">{formatMoney(totals.gross, totals.currency)}</Text>
                    <Text className="text-xs text-white/70">Gross</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
            <Text className="px-1 font-extrabold text-light-text dark:text-dark-text">Recent payouts</Text>
          </View>
        }
        ListEmptyComponent={<EmptyState icon="cash-outline" title="No earnings yet" subtitle="Complete rides to start earning." />}
        renderItem={({ item }) => (
          <Card elevation="sm" className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-2xl bg-success/15">
                <Icon name="car-sport" size={18} color="#10B981" />
              </View>
              <View>
                <Text className="font-extrabold text-light-text dark:text-dark-text">Ride payout</Text>
                <Text className="text-xs text-light-textMuted dark:text-dark-textMuted">{relativeTime(item.createdAt)}</Text>
              </View>
            </View>
            <View className="items-end">
              <Text className="font-black text-success">+{formatMoney(item.netAmount, item.currency)}</Text>
              <Text className="text-xs text-light-textMuted dark:text-dark-textMuted">fee {formatMoney(item.platformFee, item.currency)}</Text>
            </View>
          </Card>
        )}
      />
    </SafeAreaView>
  );
}
