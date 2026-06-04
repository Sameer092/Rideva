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

const sizes: Record<Size, { container: string; text: string }> = {
  sm: { container: "px-4 h-11", text: "text-sm font-bold" },
  md: { container: "px-5 h-[54px]", text: "text-base font-bold" },
  lg: { container: "px-6 h-[60px]", text: "text-lg font-extrabold" },
};

/**
 * Primary action button. The `primary` variant renders a violet gradient with
 * a soft brand-coloured glow; other variants are flat/tinted. All variants are
 * fully-rounded "pills" with generous touch targets — the modern ride-app look.
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

  const content = (
    <View className="flex-row items-center justify-center gap-2">
      {leftIcon}
      {loading ? (
        <ActivityIndicator color={variant === "primary" || variant === "danger" ? "#fff" : "#6D5EF6"} />
      ) : (
        <Text
          className={`${s.text} ${
            variant === "primary" || variant === "danger"
              ? "text-white"
              : variant === "ghost"
                ? "text-brand"
                : "text-light-text dark:text-dark-text"
          }`}
        >
          {label}
        </Text>
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
        style={!isDisabled ? SHADOWS.lg : undefined}
        {...rest}
      >
        <LinearGradient
          colors={isDisabled ? ["#9AA0AD", "#9AA0AD"] : [...GRADIENTS.brand]}
          {...GRADIENT_DIRECTION.diagonal}
          style={{ borderRadius: 999 }}
          className={`items-center justify-center rounded-full ${s.container}`}
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
      className={`${width} flex-row items-center justify-center rounded-full active:opacity-80 disabled:opacity-40 ${s.container} ${variantClass[variant as Exclude<Variant, "primary">]}`}
      style={variant === "danger" && !isDisabled ? SHADOWS.sm : undefined}
      {...rest}
    >
      {content}
    </Pressable>
  );
}
