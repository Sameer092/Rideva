import React from "react";
import { Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface RatingStarsProps {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  readOnly?: boolean;
}

/** Tappable 1–5 star rating using vector star icons. */
export function RatingStars({ value, onChange, size = 32, readOnly = false }: RatingStarsProps) {
  return (
    <View className="flex-row gap-1.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable
          key={star}
          disabled={readOnly}
          accessibilityRole="button"
          accessibilityLabel={`${star} star${star > 1 ? "s" : ""}`}
          onPress={() => onChange?.(star)}
        >
          <Ionicons name={star <= value ? "star" : "star-outline"} size={size} color={star <= value ? "#F59E0B" : "#9AA0AD"} />
        </Pressable>
      ))}
    </View>
  );
}
