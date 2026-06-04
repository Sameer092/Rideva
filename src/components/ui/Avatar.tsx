import React from "react";
import { View, Text, Image } from "react-native";

interface AvatarProps {
  name?: string | null;
  uri?: string | null;
  size?: number;
}

/** Circular avatar with image or initials fallback on a brand-tinted disc. */
export function Avatar({ name, uri, size = 48 }: AvatarProps) {
  const initial = (name?.trim()?.charAt(0) ?? "?").toUpperCase();
  if (uri) {
    return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }
  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className="items-center justify-center bg-brand-100 dark:bg-brand-700/40"
    >
      <Text style={{ fontSize: size * 0.4 }} className="font-extrabold text-brand-600 dark:text-brand-200">
        {initial}
      </Text>
    </View>
  );
}
