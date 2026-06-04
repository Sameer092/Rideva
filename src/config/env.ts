import Constants from "expo-constants";

/**
 * Centralised, validated runtime configuration.
 *
 * IMPORTANT: Expo/Metro only inlines `process.env.EXPO_PUBLIC_*` when it is
 * accessed *statically* (i.e. `process.env.EXPO_PUBLIC_SUPABASE_URL`). A
 * dynamic lookup like `process.env[key]` is NOT replaced at build time and
 * resolves to `undefined` on device — which previously caused the app to fall
 * back to the placeholder URL and fail every request. So we read each variable
 * by its literal name here, with an app.json `extra` fallback.
 */
const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? extra.supabaseUrl;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? extra.supabaseAnonKey;
const googleOauthClientId = process.env.EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID ?? extra.googleOauthClientId ?? "";

function required(value: string | undefined, name: string): string {
  if (!value || value.includes("YOUR_") ) {
    throw new Error(
      `[env] Missing/placeholder config for "${name}". ` +
        `Set EXPO_PUBLIC_${name} in your .env file and restart with: npx expo start -c`,
    );
  }
  return value;
}

export const env = {
  supabaseUrl: required(supabaseUrl, "SUPABASE_URL"),
  supabaseAnonKey: required(supabaseAnonKey, "SUPABASE_ANON_KEY"),
  googleOauthClientId,
} as const;
