import React from "react";
import { View, type ViewProps } from "react-native";

interface CardProps extends ViewProps {
  /** Adds a subtle glassmorphism look (semi-transparent + border). */
  glass?: boolean;
}

/** Surface container with rounded corners and theme-aware background. */
export function Card({ glass = false, className = "", children, ...rest }: CardProps & { className?: string }) {
  return (
    <View
      className={`rounded-2xl p-4 ${
        glass
          ? "bg-white/70 dark:bg-white/10 border border-white/30 dark:border-white/10"
          : "bg-surface-light dark:bg-surface-dark"
      } ${className}`}
      {...rest}
    >
      {children}
    </View>
  );
}
