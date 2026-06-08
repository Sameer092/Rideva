import React, { useState } from "react";
import { View, Text, TextInput, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { PassengerStackParamList } from "@/navigation/types";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { RatingStars } from "@/components/ui/RatingStars";
import { rideService } from "@/services/rides";
import { useAuthStore } from "@/store/authStore";

type Props = NativeStackScreenProps<PassengerStackParamList, "Rate">;

const LABELS = ["", "Poor", "Okay", "Good", "Great", "Excellent"];

export function RateScreen({ navigation, route }: Props) {
  const { rideId, rateeId } = route.params;
  const raterId = useAuthStore((s) => s.session?.user.id);
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!raterId) return;
    setLoading(true);
    try {
      await rideService.rate(rideId, raterId, rateeId, score, comment || undefined);
      navigation.popToTop();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Could not submit rating");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-canvas-light dark:bg-canvas-dark">
      <View className="flex-1 justify-center gap-7 px-6">
        <View className="items-center gap-2">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-700/25">
            <Icon name="star" size={48} color="#F59E0B" />
          </View>
          <Text className="text-center text-3xl font-black text-light-text dark:text-dark-text">How was your ride?</Text>
          <Text className="text-light-textMuted dark:text-dark-textMuted">Your feedback keeps Rideva great</Text>
        </View>

        <View className="items-center gap-3">
          <RatingStars value={score} onChange={setScore} size={44} />
          <Text className="text-lg font-extrabold text-brand">{LABELS[score]}</Text>
        </View>

        <TextInput
          placeholder="Add a comment (optional)"
          placeholderTextColor="#9AA0AD"
          multiline
          value={comment}
          onChangeText={setComment}
          className="min-h-28 rounded-2xl bg-light-border/40 dark:bg-elevated-dark p-4 text-base text-light-text dark:text-dark-text"
        />

        <View className="gap-2">
          <Button label="Submit rating" size="lg" loading={loading} onPress={submit} />
          <Button label="Skip for now" variant="ghost" onPress={() => navigation.popToTop()} />
        </View>
      </View>
    </SafeAreaView>
  );
}
