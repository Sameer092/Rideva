import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useColorScheme as useRNColorScheme } from "react-native";
import { colorScheme as nwColorScheme } from "nativewind";
import * as SecureStore from "expo-secure-store";
import { COLORS, STORAGE_KEYS } from "@/constants";

type ThemePref = "light" | "dark" | "system";
type Resolved = "light" | "dark";

interface ThemeContextValue {
  preference: ThemePref;
  scheme: Resolved;
  colors: typeof COLORS.light;
  setPreference: (p: ThemePref) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Theme provider supporting light/dark/system with persisted preference.
 * Bridges the user's choice into NativeWind's `colorScheme` so the `dark:`
 * Tailwind variants resolve correctly, and exposes raw color tokens for the
 * imperative cases (map styling, status bar) that can't use className.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = (useRNColorScheme() ?? "light") as Resolved;
  const [preference, setPref] = useState<ThemePref>("system");

  useEffect(() => {
    SecureStore.getItemAsync(STORAGE_KEYS.themePreference).then((stored) => {
      if (stored === "light" || stored === "dark" || stored === "system") setPref(stored);
    });
  }, []);

  const scheme: Resolved = preference === "system" ? system : preference;

  useEffect(() => {
    nwColorScheme.set(preference);
  }, [preference]);

  const setPreference = useCallback((p: ThemePref) => {
    setPref(p);
    void SecureStore.setItemAsync(STORAGE_KEYS.themePreference, p);
  }, []);

  const toggle = useCallback(() => {
    setPreference(scheme === "dark" ? "light" : "dark");
  }, [scheme, setPreference]);

  const value: ThemeContextValue = {
    preference,
    scheme,
    colors: scheme === "dark" ? COLORS.dark : COLORS.light,
    setPreference,
    toggle,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
