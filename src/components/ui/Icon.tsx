import React from "react";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import type { VehicleClass } from "@/types";

interface IconProps {
  name: keyof typeof Ionicons.glyphMap;
  size?: number;
  color?: string;
  /** Use the muted text color (for input/leading icons). */
  muted?: boolean;
}

/** App icon wrapper — Ionicons with theme-aware default color. */
export function Icon({ name, size = 20, color, muted }: IconProps) {
  const { colors } = useTheme();
  return <Ionicons name={name} size={size} color={color ?? (muted ? colors.textMuted : colors.text)} />;
}

/** Vehicle-class icon (MaterialCommunityIcons has motorbike/rickshaw/etc.). */
const VEHICLE_ICON: Record<VehicleClass, keyof typeof MaterialCommunityIcons.glyphMap> = {
  motorcycle: "motorbike",
  rickshaw: "rickshaw",
  economy: "car-hatchback",
  comfort: "car",
  xl: "van-passenger",
  premium: "car-sports",
};

export function VehicleIcon({ vehicle, size = 24, color }: { vehicle: VehicleClass; size?: number; color?: string }) {
  const { colors } = useTheme();
  return <MaterialCommunityIcons name={VEHICLE_ICON[vehicle]} size={size} color={color ?? colors.text} />;
}
