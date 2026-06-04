import React from "react";
import { View, type ViewProps } from "react-native";
import { SHADOWS } from "@/theme";

interface CardProps extends ViewProps {
  className?: string;
  /** Glassmorphism look (semi-transparent + hairline border). */
  glass?: boolean;
  /** Drop shadow elevation. Defaults to "md". */
  elevation?: "none" | "sm" | "md" | "lg";
  /** Padding preset. */
  padded?: boolean;
}

/**
 * Surface container with rounded-3xl corners, theme-aware background and a
 * configurable soft shadow. The default elevated card is what most floating
 * panels and list items use.
 */
export function Card({
  glass = false,
  elevation = "md",
  padded = true,
  className = "",
  children,
  style,
  ...rest
}: CardProps) {
  return (
    <View
      className={`rounded-3xl ${padded ? "p-5" : ""} ${
        glass
          ? "bg-white/70 dark:bg-white/[0.06] border border-white/40 dark:border-white/10"
          : "bg-surface-light dark:bg-surface-dark"
      } ${className}`}
      style={[elevation !== "none" && !glass ? SHADOWS[elevation] : undefined, style]}
      {...rest}
    >
      {children}
    </View>
  );
}
