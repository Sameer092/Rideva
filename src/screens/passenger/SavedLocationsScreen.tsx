import React from "react";
import { View, Text, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/services/supabase";
import { mapSavedLocation } from "@/services/mappers";
import { Card } from "@/components/ui/Card";
import { EmptyState, LoadingState } from "@/components/ui/States";
import { qk } from "@/lib/queryClient";

/** Manage saved/favourite places (home, work, custom). */
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
        ListEmptyComponent={<EmptyState emoji="⭐" title="No saved places" subtitle="Save home and work for faster booking." />}
        renderItem={({ item }) => (
          <Card>
            <Text className="font-semibold text-light-text dark:text-dark-text">{item.label}</Text>
            <Text className="text-sm text-light-textMuted dark:text-dark-textMuted">{item.address}</Text>
          </Card>
        )}
      />
    </SafeAreaView>
  );
}
