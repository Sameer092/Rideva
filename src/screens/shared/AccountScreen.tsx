import React from "react";
import { View, Text, Pressable, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { useAuthStore } from "@/store/authStore";
import { useTheme } from "@/hooks/useTheme";
import { authService } from "@/services/auth";
import { GRADIENTS, GRADIENT_DIRECTION, SHADOWS } from "@/theme";

function Row({ icon, label, onPress }: { icon: string; label: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center gap-3 px-5 py-4 active:opacity-60">
      <View className="h-9 w-9 items-center justify-center rounded-xl bg-light-border/50 dark:bg-elevated-dark">
        <Text className="text-base">{icon}</Text>
      </View>
      <Text className="flex-1 font-bold text-light-text dark:text-dark-text">{label}</Text>
      <Text className="text-light-textMuted dark:text-dark-textMuted">›</Text>
    </Pressable>
  );
}

export function AccountScreen() {
  const profile = useAuthStore((s) => s.profile);
  const { preference, setPreference } = useTheme();
  const navigation = useNavigation<{ navigate: (s: string) => void }>();

  const isPassenger = profile?.role === "passenger";
  const comingSoon = (what: string) =>
    Alert.alert(what, "This section isn't part of the demo yet.");

  return (
    <View className="flex-1 bg-canvas-light dark:bg-canvas-dark">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Gradient header */}
        <LinearGradient colors={[...GRADIENTS.brand]} {...GRADIENT_DIRECTION.diagonal}>
          <SafeAreaView edges={["top"]}>
            <View className="items-center gap-3 px-6 pb-8 pt-4">
              <View className="rounded-full border-4 border-white/30" style={SHADOWS.md}>
                <Avatar name={profile?.fullName} uri={profile?.avatarUrl} size={88} />
              </View>
              <View className="items-center">
                <Text className="text-2xl font-black text-white">{profile?.fullName}</Text>
                <Text className="text-white/70">{profile?.email}</Text>
              </View>
              <View className="flex-row items-center gap-2 rounded-full bg-white/20 px-4 py-1.5">
                <Text className="font-bold text-white">★ {profile?.ratingAvg.toFixed(2)}</Text>
                <Text className="text-white/70">·</Text>
                <Text className="font-bold capitalize text-white">{profile?.role}</Text>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <View className="-mt-5 gap-4 rounded-t-3xl bg-canvas-light dark:bg-canvas-dark px-5 pt-6">
          <Card padded={false} className="overflow-hidden py-1">
            {isPassenger && <Row icon="⭐" label="Saved places" onPress={() => navigation.navigate("SavedLocations")} />}
            <Row icon="💳" label="Payment methods" onPress={() => comingSoon("Payment methods")} />
            <Row icon="🧾" label="Trip history" onPress={() => comingSoon("Trip history")} />
            <Row icon="🛟" label="Help & support" onPress={() => comingSoon("Help & support")} />
          </Card>

          <Card>
            <Text className="mb-3 font-extrabold text-light-text dark:text-dark-text">Appearance</Text>
            <SegmentedControl
              segments={[
                { value: "light", label: "Light" },
                { value: "dark", label: "Dark" },
                { value: "system", label: "Auto" },
              ]}
              value={preference}
              onChange={setPreference}
            />
          </Card>

          <Button label="Sign out" variant="danger" onPress={() => authService.signOut()} />
          <View className="h-6" />
        </View>
      </ScrollView>
    </View>
  );
}
