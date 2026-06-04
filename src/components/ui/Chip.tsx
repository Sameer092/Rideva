import React from "react";
import { Pressable, Text, View } from "react-native";

interface ChipProps {
  label: string;
  icon?: React.ReactNode;
  onPress?: () => void;
  active?: boolean;
}

/** Compact pill used for quick actions (Home/Work shortcuts, filters). */
export function Chip({ label, icon, onPress, active = false }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className={`flex-row items-center gap-2 rounded-full px-4 h-11 ${
        active
          ? "bg-brand"
          : "bg-light-border/50 dark:bg-elevated-dark"
      }`}
    >
      {icon}
      <Text className={`text-sm font-bold ${active ? "text-white" : "text-light-text dark:text-dark-text"}`}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Small status badge (e.g. ride status, payment state). */
export function StatusBadge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "success" | "danger" | "brand";
}) {
  // Static class strings per tone so NativeWind's compiler can detect them.
  const container: Record<string, string> = {
    neutral: "bg-light-border/60 dark:bg-elevated-dark",
    success: "bg-success/15",
    danger: "bg-danger/15",
    brand: "bg-brand/15",
  };
  const text: Record<string, string> = {
    neutral: "text-light-textMuted dark:text-dark-textMuted",
    success: "text-success",
    danger: "text-danger",
    brand: "text-brand",
  };
  return (
    <View className={`self-start rounded-full px-3 py-1 ${container[tone]}`}>
      <Text className={`text-xs font-bold capitalize ${text[tone]}`}>{label}</Text>
    </View>
  );
}
