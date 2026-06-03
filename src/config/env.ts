import Constants from "expo-constants";

/**
 * Centralised, validated access to runtime configuration.
 *
 * Values come from `EXPO_PUBLIC_*` env vars (inlined at build time) with a
 * fallback to the `extra` block in app.json. Reading them through this module
 * means the rest of the app never touches `process.env` or `Constants`
 * directly and we fail fast at startup if something critical is missing.
 */
const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string>;

function read(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (!value) {
    throw new Error(
      `[env] Missing required configuration "${key}". ` +
        `Set it in your .env file or app.json "extra" block.`,
    );
  }
  return value;
}

export const env = {
  supabaseUrl: read("EXPO_PUBLIC_SUPABASE_URL", extra.supabaseUrl),
  supabaseAnonKey: read("EXPO_PUBLIC_SUPABASE_ANON_KEY", extra.supabaseAnonKey),
  googleOauthClientId: process.env.EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID ?? extra.googleOauthClientId ?? "",
} as const;
