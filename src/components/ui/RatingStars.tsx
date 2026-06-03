import React from "react";
import { Pressable, Text, View } from "react-native";

interface RatingStarsProps {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  readOnly?: boolean;
}

/** Tappable 1–5 star rating (read-only when no onChange supplied). */
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
          <Text style={{ fontSize: size }}>{star <= value ? "⭐" : "☆"}</Text>
        </Pressable>
      ))}
    </View>
  );
}
