import type { ViewStyle } from "react-native";

/**
 * Design tokens that can't be expressed cleanly as Tailwind classes —
 * elevation shadows (RN needs shadowColor/elevation) and gradient color stops
 * for expo-linear-gradient. Colors here mirror tailwind.config.js so the look
 * stays consistent whether a surface is styled via className or inline.
 */

export const SHADOWS: Record<string, ViewStyle> = {
  // Soft card lift
  sm: {
    shadowColor: "#0B0D12",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  // Standard floating card / sheet
  md: {
    shadowColor: "#0B0D12",
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  // Prominent CTA / hero element
  lg: {
    shadowColor: "#4536C9",
    shadowOpacity: 0.28,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
};

/** Gradient stops for <LinearGradient/>. Use with start/end {x,y}. */
export const GRADIENTS = {
  brand: ["#8E82F8", "#6D5EF6", "#5A4BE6"] as const,
  brandSoft: ["#7C6FF7", "#5A4BE6"] as const,
  hero: ["#241F45", "#14132A", "#0A0B0F"] as const,
  dark: ["#1C1F26", "#15171D"] as const,
  success: ["#34D399", "#10B981"] as const,
};

export const GRADIENT_DIRECTION = {
  topToBottom: { start: { x: 0, y: 0 }, end: { x: 0, y: 1 } },
  diagonal: { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
  leftToRight: { start: { x: 0, y: 0 }, end: { x: 1, y: 0 } },
} as const;
