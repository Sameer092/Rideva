import React from "react";
import { Pressable, Text, ActivityIndicator, View, type PressableProps } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { GRADIENTS, GRADIENT_DIRECTION, SHADOWS } from "@/theme";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends Omit<PressableProps, "children"> {
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

// Explicit numeric heights (set via `style`, not Tailwind arbitrary classes) so
// they apply reliably — including to the LinearGradient used by the primary
// variant, which NativeWind won't size via `h-[..]`.
const sizes: Record<Size, { height: number; paddingHorizontal: number; text: string }> = {
  sm: { height: 46, paddingHorizontal: 16, text: "text-sm font-bold" },
  md: { height: 54, paddingHorizontal: 20, text: "text-base font-bold" },
  lg: { height: 58, paddingHorizontal: 24, text: "text-lg font-extrabold" },
};

/**
 * Primary action button — a fully-rounded pill. The `primary` variant is a
 * violet gradient with a subtle lift; other variants are flat/tinted.
 */
export function Button({
  label,
  variant = "primary",
  size = "md",
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = true,
  disabled,
  ...rest
}: ButtonProps) {
  const s = sizes[size];
  const isDisabled = disabled || loading;
  const width = fullWidth ? "w-full" : "self-start";

  const textColor =
    variant === "primary" || variant === "danger"
      ? "text-white"
      : variant === "ghost"
        ? "text-brand"
        : "text-light-text dark:text-dark-text";

  const content = (
    <View className="flex-row items-center justify-center gap-2">
      {leftIcon}
      {loading ? (
        <ActivityIndicator color={variant === "primary" || variant === "danger" ? "#fff" : "#6D5EF6"} />
      ) : (
        <Text className={`${s.text} ${textColor}`}>{label}</Text>
      )}
      {rightIcon}
    </View>
  );

  if (variant === "primary") {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        disabled={isDisabled}
        className={`${width} rounded-full active:opacity-90`}
        style={!isDisabled ? SHADOWS.button : undefined}
        {...rest}
      >
        <LinearGradient
          colors={isDisabled ? ["#9AA0AD", "#9AA0AD"] : [...GRADIENTS.brand]}
          {...GRADIENT_DIRECTION.diagonal}
          style={{
            height: s.height,
            paddingHorizontal: s.paddingHorizontal,
            borderRadius: 999,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {content}
        </LinearGradient>
      </Pressable>
    );
  }

  const variantClass: Record<Exclude<Variant, "primary">, string> = {
    secondary: "bg-brand-50 dark:bg-brand-700/30",
    outline: "border-2 border-light-border dark:border-dark-border bg-transparent",
    ghost: "bg-transparent",
    danger: "bg-danger",
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={isDisabled}
      className={`${width} flex-row items-center justify-center rounded-full active:opacity-80 disabled:opacity-40 ${variantClass[variant as Exclude<Variant, "primary">]}`}
      style={[
        { height: s.height, paddingHorizontal: s.paddingHorizontal },
        variant === "danger" && !isDisabled ? SHADOWS.button : undefined,
      ]}
      {...rest}
    >
      {content}
    </Pressable>
  );
}
