import React, { useMemo } from "react";
import { View, Text, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/Card";
import { EmptyState, LoadingState } from "@/components/ui/States";
import { rideService } from "@/services/rides";
import { qk } from "@/lib/queryClient";
import { useAuthStore } from "@/store/authStore";
import { formatMoney, relativeTime } from "@/utils/format";

/** Driver earnings dashboard: lifetime + per-trip net payout ledger. */
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
    <SafeAreaView className="flex-1 bg-canvas-light dark:bg-canvas-dark">
      <View className="p-5 gap-3">
        <Text className="text-2xl font-extrabold text-light-text dark:text-dark-text">Earnings</Text>
        <Card className="items-center">
          <Text className="text-sm text-light-textMuted dark:text-dark-textMuted">Total net payout</Text>
          <Text className="text-4xl font-extrabold text-brand">{formatMoney(totals.net, totals.currency)}</Text>
          <Text className="mt-1 text-light-textMuted dark:text-dark-textMuted">
            {totals.trips} trips · {formatMoney(totals.gross, totals.currency)} gross
          </Text>
        </Card>
      </View>

      <FlatList
        data={data ?? []}
        keyExtractor={(e) => e.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 10 }}
        ListEmptyComponent={<EmptyState emoji="💵" title="No earnings yet" subtitle="Complete trips to start earning." />}
        renderItem={({ item }) => (
          <Card className="flex-row justify-between">
            <View>
              <Text className="font-semibold text-light-text dark:text-dark-text">Trip payout</Text>
              <Text className="text-sm text-light-textMuted dark:text-dark-textMuted">{relativeTime(item.createdAt)}</Text>
            </View>
            <View className="items-end">
              <Text className="font-bold text-success">{formatMoney(item.netAmount, item.currency)}</Text>
              <Text className="text-xs text-light-textMuted dark:text-dark-textMuted">
                fee {formatMoney(item.platformFee, item.currency)}
              </Text>
            </View>
          </Card>
        )}
      />
    </SafeAreaView>
  );
}
