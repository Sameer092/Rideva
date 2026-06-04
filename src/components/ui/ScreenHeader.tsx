import React from "react";
import { View, Text, Pressable } from "react-native";

interface Props {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}

/** Lightweight screen header with an optional circular back button. */
export function ScreenHeader({ title, subtitle, onBack, right }: Props) {
  return (
    <View className="flex-row items-center gap-3 px-1 py-2">
      {onBack && (
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="h-11 w-11 items-center justify-center rounded-full bg-light-border/50 dark:bg-elevated-dark"
        >
          <Text className="text-xl text-light-text dark:text-dark-text">‹</Text>
        </Pressable>
      )}
      <View className="flex-1">
        {title && <Text className="text-2xl font-extrabold text-light-text dark:text-dark-text">{title}</Text>}
        {subtitle && <Text className="text-sm text-light-textMuted dark:text-dark-textMuted">{subtitle}</Text>}
      </View>
      {right}
    </View>
  );
}

/** A small drag handle shown at the top of bottom sheets. */
export function SheetHandle() {
  return <View className="self-center my-2 h-1.5 w-10 rounded-full bg-light-border dark:bg-dark-border" />;
}
