import React, { forwardRef, useState } from "react";
import { View, Text, TextInput, Pressable, type TextInputProps } from "react-native";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightSlot?: React.ReactNode;
}

/**
 * Labeled text input with a focus ring, inline validation error and optional
 * icon / right slot. Wired for react-hook-form Controller. Rounded-2xl filled
 * field that subtly highlights its border on focus.
 */
export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, leftIcon, rightSlot, onFocus, onBlur, ...rest },
  ref,
) {
  const [focused, setFocused] = useState(false);

  const borderClass = error
    ? "border-danger"
    : focused
      ? "border-brand"
      : "border-light-border dark:border-dark-border";

  return (
    <View className="w-full gap-2">
      {label && (
        <Text className="ml-1 text-sm font-semibold text-light-textMuted dark:text-dark-textMuted">
          {label}
        </Text>
      )}
      <View
        className={`flex-row items-center gap-3 rounded-2xl border-2 px-4 py-3.5 bg-light-border/40 dark:bg-elevated-dark ${borderClass}`}
      >
        {leftIcon}
        <TextInput
          ref={ref}
          placeholderTextColor="#9AA0AD"
          // paddingVertical:0 removes RN's default vertical padding so the text
          // isn't clipped; the row's py-3.5 controls the field height instead.
          style={{ paddingVertical: 0, fontSize: 16, lineHeight: 20 }}
          className="flex-1 font-medium text-light-text dark:text-dark-text"
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
        {rightSlot}
      </View>
      {error && <Text className="ml-1 text-xs font-medium text-danger">{error}</Text>}
    </View>
  );
});
