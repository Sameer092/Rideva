import "react-native-url-polyfill/auto";
import { createClient, processLock } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { AppState } from "react-native";
import { env } from "@/config/env";

/**
 * SecureStore-backed storage adapter for the Supabase auth session.
 *
 * Supabase persists the session as a single JSON blob. SecureStore values are
 * capped at ~2KB on some platforms, but auth tokens fit comfortably. We use
 * the device keychain/keystore so refresh tokens never sit in plain
 * AsyncStorage.
 */
const SecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    storage: SecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // we handle deep-link OAuth manually
    lock: processLock,
  },
});

/**
 * Drive token auto-refresh from app foreground/background state. Supabase
 * refreshes on a timer while the app is active and pauses when backgrounded —
 * this avoids spurious refreshes and battery drain.
 */
AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
