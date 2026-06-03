import React from "react";
import { Pressable, Text, ActivityIndicator, View, type PressableProps } from "react-native";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends Omit<PressableProps, "children"> {
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const base =
  "flex-row items-center justify-center rounded-2xl active:opacity-80 disabled:opacity-40";

const variants: Record<Variant, { container: string; text: string }> = {
  primary: { container: "bg-brand", text: "text-white" },
  secondary: { container: "bg-brand-100 dark:bg-brand-700", text: "text-brand-700 dark:text-white" },
  outline: { container: "border border-light-border dark:border-dark-border", text: "text-light-text dark:text-dark-text" },
  ghost: { container: "bg-transparent", text: "text-brand" },
  danger: { container: "bg-danger", text: "text-white" },
};

const sizes: Record<Size, { container: string; text: string }> = {
  sm: { container: "px-3 py-2", text: "text-sm font-semibold" },
  md: { container: "px-4 py-3.5", text: "text-base font-semibold" },
  lg: { container: "px-5 py-4", text: "text-lg font-bold" },
};

/** App-wide button with variants, sizes, loading state and icon slot. */
export function Button({
  label,
  variant = "primary",
  size = "md",
  loading = false,
  leftIcon,
  fullWidth = true,
  disabled,
  ...rest
}: ButtonProps) {
  const v = variants[variant];
  const s = sizes[size];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled || loading}
      className={`${base} ${v.container} ${s.container} ${fullWidth ? "w-full" : "self-start"}`}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" || variant === "danger" ? "#fff" : "#5B5BD6"} />
      ) : (
        <View className="flex-row items-center gap-2">
          {leftIcon}
          <Text className={`${v.text} ${s.text}`}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}
