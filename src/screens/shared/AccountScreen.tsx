import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/authStore";
import { useTheme } from "@/hooks/useTheme";
import { authService } from "@/services/auth";

/** Profile + settings, shared by passenger and driver experiences. */
export function AccountScreen() {
  const profile = useAuthStore((s) => s.profile);
  const { preference, setPreference } = useTheme();

  return (
    <SafeAreaView className="flex-1 bg-canvas-light dark:bg-canvas-dark">
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <View className="items-center gap-2 py-4">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-700">
            <Text className="text-3xl font-bold text-brand-700 dark:text-white">
              {profile?.fullName.charAt(0) ?? "?"}
            </Text>
          </View>
          <Text className="text-xl font-extrabold text-light-text dark:text-dark-text">{profile?.fullName}</Text>
          <Text className="text-light-textMuted dark:text-dark-textMuted">{profile?.email}</Text>
          <Text className="text-light-textMuted dark:text-dark-textMuted">
            ⭐ {profile?.ratingAvg.toFixed(2)} · {profile?.role}
          </Text>
        </View>

        <Card>
          <Text className="mb-2 font-bold text-light-text dark:text-dark-text">Appearance</Text>
          <View className="flex-row gap-2">
            {(["light", "dark", "system"] as const).map((opt) => (
              <Pressable
                key={opt}
                onPress={() => setPreference(opt)}
                className={`flex-1 items-center rounded-xl border p-2 ${
                  preference === opt ? "border-brand bg-brand-50 dark:bg-brand-700" : "border-light-border dark:border-dark-border"
                }`}
              >
                <Text className="capitalize text-light-text dark:text-dark-text">{opt}</Text>
              </Pressable>
            ))}
          </View>
        </Card>

        <Button label="Sign out" variant="danger" onPress={() => authService.signOut()} />
      </ScrollView>
    </SafeAreaView>
  );
}
