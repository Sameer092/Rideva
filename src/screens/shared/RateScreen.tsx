import React, { useState } from "react";
import { View, Text, TextInput, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { PassengerStackParamList } from "@/navigation/types";
import { Button } from "@/components/ui/Button";
import { RatingStars } from "@/components/ui/RatingStars";
import { rideService } from "@/services/rides";
import { useAuthStore } from "@/store/authStore";

// Reused by both stacks; params shape is identical.
type Props = NativeStackScreenProps<PassengerStackParamList, "Rate">;

/** Rate the trip counterparty (1–5 stars + optional comment). */
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
      <View className="flex-1 justify-center gap-6 p-6">
        <Text className="text-center text-2xl font-extrabold text-light-text dark:text-dark-text">
          How was your trip?
        </Text>
        <View className="items-center">
          <RatingStars value={score} onChange={setScore} size={40} />
        </View>
        <TextInput
          placeholder="Leave a comment (optional)"
          placeholderTextColor="#9CA3AF"
          multiline
          value={comment}
          onChangeText={setComment}
          className="min-h-24 rounded-2xl border border-light-border dark:border-dark-border p-4 text-light-text dark:text-dark-text"
        />
        <Button label="Submit" loading={loading} onPress={submit} />
        <Button label="Skip" variant="ghost" onPress={() => navigation.popToTop()} />
      </View>
    </SafeAreaView>
  );
}
