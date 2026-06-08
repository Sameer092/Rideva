import React from "react";
import { View, Text, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/services/supabase";
import { mapSavedLocation } from "@/services/mappers";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { EmptyState, LoadingState } from "@/components/ui/States";
import { qk } from "@/lib/queryClient";
import { Ionicons } from "@expo/vector-icons";

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = { home: "home", work: "briefcase" };

export function SavedLocationsScreen() {
  const { data, isLoading } = useQuery({
    queryKey: qk.savedLocations,
    queryFn: async () => {
      const { data, error } = await supabase.from("saved_locations").select("*").order("created_at");
      if (error) throw error;
      return (data ?? []).map(mapSavedLocation);
    },
  });

  if (isLoading) return <LoadingState />;

  return (
    <SafeAreaView className="flex-1 bg-canvas-light dark:bg-canvas-dark">
      <FlatList
        data={data ?? []}
        keyExtractor={(l) => l.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListEmptyComponent={<EmptyState icon="star-outline" title="No saved places" subtitle="Save home and work for faster booking." />}
        renderItem={({ item }) => (
          <Card elevation="sm" className="flex-row items-center gap-3">
            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-700/25">
              <Icon name={ICONS[item.label.toLowerCase()] ?? "location"} size={18} color="#6D5EF6" />
            </View>
            <View className="flex-1">
              <Text className="font-extrabold text-light-text dark:text-dark-text">{item.label}</Text>
              <Text className="text-sm text-light-textMuted dark:text-dark-textMuted" numberOfLines={1}>{item.address}</Text>
            </View>
          </Card>
        )}
      />
    </SafeAreaView>
  );
}
