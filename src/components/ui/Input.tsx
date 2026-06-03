import React, { forwardRef } from "react";
import { View, Text, TextInput, type TextInputProps } from "react-native";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

/** Labeled text input with inline validation error, wired for RHF/Controller. */
export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, leftIcon, ...rest },
  ref,
) {
  return (
    <View className="w-full gap-1.5">
      {label && (
        <Text className="text-sm font-medium text-light-textMuted dark:text-dark-textMuted">
          {label}
        </Text>
      )}
      <View
        className={`flex-row items-center gap-2 rounded-2xl border px-4 py-3.5 bg-surface-light dark:bg-surface-dark ${
          error ? "border-danger" : "border-light-border dark:border-dark-border"
        }`}
      >
        {leftIcon}
        <TextInput
          ref={ref}
          placeholderTextColor="#9CA3AF"
          className="flex-1 text-base text-light-text dark:text-dark-text"
          {...rest}
        />
      </View>
      {error && <Text className="text-xs text-danger">{error}</Text>}
    </View>
  );
});
