import "react-native-url-polyfill/auto";
import { createClient, processLock } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { AppState } from "react-native";
import { env } from "@/config/env";

/**
 * SecureStore-backed storage adapter for the Supabase auth session.
 *
 * Supabase persists the whole session (access token + refresh token + user) as
 * a single JSON blob that exceeds SecureStore's ~2KB recommended limit. To
 * store it reliably (and silence the size warning) we transparently split large
 * values into <2KB chunks keyed `<key>__<i>` with a small manifest at `<key>`.
 * Tokens stay in the device keychain/keystore — never plain storage.
 */
const CHUNK_SIZE = 2000;
const MANIFEST = "__chunks__:";

const SecureStoreAdapter = {
  async getItem(key: string): Promise<string | null> {
    const head = await SecureStore.getItemAsync(key);
    if (head == null || !head.startsWith(MANIFEST)) return head; // plain value
    const count = parseInt(head.slice(MANIFEST.length), 10);
    let out = "";
    for (let i = 0; i < count; i++) {
      const part = await SecureStore.getItemAsync(`${key}__${i}`);
      if (part == null) return null;
      out += part;
    }
    return out;
  },
  async setItem(key: string, value: string): Promise<void> {
    if (value.length <= CHUNK_SIZE) {
      await SecureStore.setItemAsync(key, value);
      return;
    }
    const count = Math.ceil(value.length / CHUNK_SIZE);
    for (let i = 0; i < count; i++) {
      await SecureStore.setItemAsync(`${key}__${i}`, value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE));
    }
    await SecureStore.setItemAsync(key, `${MANIFEST}${count}`);
  },
  async removeItem(key: string): Promise<void> {
    const head = await SecureStore.getItemAsync(key);
    if (head?.startsWith(MANIFEST)) {
      const count = parseInt(head.slice(MANIFEST.length), 10);
      for (let i = 0; i < count; i++) await SecureStore.deleteItemAsync(`${key}__${i}`);
    }
    await SecureStore.deleteItemAsync(key);
  },
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
