import React from "react";
import { Pressable, Text, View } from "react-native";

interface Segment<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
}

/** iOS-style segmented control with a sliding selected pill. */
export function SegmentedControl<T extends string>({ segments, value, onChange }: Props<T>) {
  return (
    <View className="flex-row rounded-full bg-light-border/50 dark:bg-elevated-dark p-1">
      {segments.map((seg) => {
        const active = seg.value === value;
        return (
          <Pressable
            key={seg.value}
            onPress={() => onChange(seg.value)}
            className={`flex-1 items-center justify-center rounded-full py-2.5 ${active ? "bg-surface-light dark:bg-surface-dark" : ""}`}
          >
            <Text className={`text-sm font-bold ${active ? "text-brand" : "text-light-textMuted dark:text-dark-textMuted"}`}>
              {seg.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
