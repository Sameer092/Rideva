import React from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { Button } from "./Button";

/** Centred spinner for full-screen loading. */
export function LoadingState({ message }: { message?: string }) {
  return (
    <View className="flex-1 items-center justify-center gap-3 bg-canvas-light dark:bg-canvas-dark">
      <ActivityIndicator size="large" color="#5B5BD6" />
      {message && <Text className="text-light-textMuted dark:text-dark-textMuted">{message}</Text>}
    </View>
  );
}

/** Friendly empty placeholder with optional CTA. */
export function EmptyState({
  emoji = "📭",
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  emoji?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View className="flex-1 items-center justify-center gap-3 p-8">
      <Text className="text-5xl">{emoji}</Text>
      <Text className="text-lg font-bold text-light-text dark:text-dark-text">{title}</Text>
      {subtitle && (
        <Text className="text-center text-light-textMuted dark:text-dark-textMuted">{subtitle}</Text>
      )}
      {actionLabel && onAction && (
        <View className="mt-2 w-48">
          <Button label={actionLabel} onPress={onAction} />
        </View>
      )}
    </View>
  );
}

/** Error panel with retry. */
export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <View className="flex-1 items-center justify-center gap-3 p-8">
      <Text className="text-5xl">⚠️</Text>
      <Text className="text-lg font-bold text-light-text dark:text-dark-text">Something went wrong</Text>
      <Text className="text-center text-light-textMuted dark:text-dark-textMuted">
        {message ?? "Please try again."}
      </Text>
      {onRetry && (
        <View className="mt-2 w-40">
          <Button label="Retry" variant="outline" onPress={onRetry} />
        </View>
      )}
    </View>
  );
}

/** Animated skeleton block for list/card placeholders. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <View className={`rounded-xl bg-light-border dark:bg-dark-border ${className}`} />;
}
