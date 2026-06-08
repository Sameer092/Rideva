import React from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "./Button";

/** Centred spinner for full-screen loading. */
export function LoadingState({ message }: { message?: string }) {
  return (
    <View className="flex-1 items-center justify-center gap-4 bg-canvas-light dark:bg-canvas-dark">
      <View className="h-16 w-16 items-center justify-center rounded-3xl bg-brand-50 dark:bg-brand-700/25">
        <ActivityIndicator size="large" color="#6D5EF6" />
      </View>
      {message && <Text className="font-medium text-light-textMuted dark:text-dark-textMuted">{message}</Text>}
    </View>
  );
}

/** Friendly empty placeholder with optional CTA. */
export function EmptyState({
  icon = "file-tray-outline",
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View className="flex-1 items-center justify-center gap-3 p-10">
      <View className="h-24 w-24 items-center justify-center rounded-4xl bg-light-border/50 dark:bg-elevated-dark">
        <Ionicons name={icon} size={44} color="#9AA0AD" />
      </View>
      <Text className="text-xl font-extrabold text-light-text dark:text-dark-text">{title}</Text>
      {subtitle && (
        <Text className="text-center text-light-textMuted dark:text-dark-textMuted">{subtitle}</Text>
      )}
      {actionLabel && onAction && (
        <View className="mt-3 w-52">
          <Button label={actionLabel} onPress={onAction} />
        </View>
      )}
    </View>
  );
}

/** Error panel with retry. */
export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <View className="flex-1 items-center justify-center gap-3 p-10">
      <View className="h-24 w-24 items-center justify-center rounded-4xl bg-danger/10">
        <Ionicons name="alert-circle-outline" size={44} color="#EF4444" />
      </View>
      <Text className="text-xl font-extrabold text-light-text dark:text-dark-text">Something went wrong</Text>
      <Text className="text-center text-light-textMuted dark:text-dark-textMuted">
        {message ?? "Please try again."}
      </Text>
      {onRetry && (
        <View className="mt-3 w-44">
          <Button label="Retry" variant="outline" onPress={onRetry} />
        </View>
      )}
    </View>
  );
}

/** Animated skeleton block for list/card placeholders. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <View className={`rounded-2xl bg-light-border dark:bg-dark-border ${className}`} />;
}
