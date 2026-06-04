import React from "react";
import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/services/supabase";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/States";
import { authService } from "@/services/auth";
import { GRADIENTS, GRADIENT_DIRECTION, SHADOWS } from "@/theme";

export function AdminScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "metrics"],
    refetchInterval: 15_000,
    queryFn: async () => {
      const [users, activeRides, openReports, onlineDrivers] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("rides").select("id", { count: "exact", head: true })
          .in("status", ["requested", "matching", "accepted", "arriving", "arrived", "in_progress"]),
        supabase.from("ride_reports").select("id", { count: "exact", head: true }).eq("resolved", false),
        supabase.from("drivers").select("id", { count: "exact", head: true }).eq("status", "online"),
      ]);
      return {
        users: users.count ?? 0,
        activeRides: activeRides.count ?? 0,
        openReports: openReports.count ?? 0,
        onlineDrivers: onlineDrivers.count ?? 0,
      };
    },
  });

  if (isLoading) return <LoadingState />;

  const tiles = [
    { label: "Total users", value: data?.users, emoji: "👥" },
    { label: "Active rides", value: data?.activeRides, emoji: "🚕" },
    { label: "Online drivers", value: data?.onlineDrivers, emoji: "🟢" },
    { label: "Open disputes", value: data?.openReports, emoji: "⚠️" },
  ];

  return (
    <SafeAreaView className="flex-1 bg-canvas-light dark:bg-canvas-dark" edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center gap-2">
          <View className="h-2.5 w-2.5 rounded-full bg-success" />
          <Text className="text-3xl font-black text-light-text dark:text-dark-text">Admin · Live</Text>
        </View>

        <LinearGradient colors={[...GRADIENTS.brand]} {...GRADIENT_DIRECTION.diagonal} style={{ borderRadius: 28, ...SHADOWS.lg }}>
          <View className="p-6">
            <Text className="font-semibold text-white/70">Active rides right now</Text>
            <Text className="text-5xl font-black text-white">{data?.activeRides}</Text>
            <Text className="mt-1 text-white/70">{data?.onlineDrivers} drivers online</Text>
          </View>
        </LinearGradient>

        <View className="flex-row flex-wrap gap-3">
          {tiles.map((t) => (
            <Card key={t.label} className="w-[47%]" elevation="sm">
              <Text className="text-2xl">{t.emoji}</Text>
              <Text className="mt-1 text-3xl font-black text-light-text dark:text-dark-text">{t.value}</Text>
              <Text className="text-light-textMuted dark:text-dark-textMuted">{t.label}</Text>
            </Card>
          ))}
        </View>

        <Text className="text-sm text-light-textMuted dark:text-dark-textMuted">
          Full user/driver management, analytics and dispute handling live in the web dashboard.
        </Text>
        <Button label="Sign out" variant="danger" onPress={() => authService.signOut()} />
      </ScrollView>
    </SafeAreaView>
  );
}
