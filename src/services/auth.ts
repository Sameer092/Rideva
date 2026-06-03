import * as WebBrowser from "expo-web-browser";
import * as AppleAuthentication from "expo-apple-authentication";
import { makeRedirectUri } from "expo-auth-session";
import { supabase } from "./supabase";
import { mapProfile } from "./mappers";
import type { Profile, UserRole } from "@/types";
import type { SignInValues, SignUpValues } from "@/utils/validation";

WebBrowser.maybeCompleteAuthSession();

const redirectTo = makeRedirectUri({ scheme: "rideva", path: "auth/callback" });

/**
 * Auth service — wraps Supabase Auth so screens never call the SDK directly.
 * Covers email/password, Google (OAuth via system browser + deep link),
 * Apple (native), password reset, and profile loading.
 */
export const authService = {
  async signIn({ email, password }: SignInValues) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signUp({ email, password, fullName, phone, role }: SignUpValues) {
    // role + name travel in user metadata; the on_auth_user_created trigger
    // reads them to provision the profile (and drivers row) server-side.
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone: phone || null, role: role as UserRole },
        emailRedirectTo: redirectTo,
      },
    });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw error;
  },

  /** Google OAuth via the system browser, returning to the app via deep link. */
  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error) throw error;

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== "success") return;

    // The deep link carries the auth code/tokens in the URL fragment.
    const url = new URL(result.url);
    const code = url.searchParams.get("code");
    if (code) {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) throw exchangeError;
    }
  },

  /** Apple Sign In (native). iOS only. */
  async signInWithApple() {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    if (!credential.identityToken) throw new Error("Apple Sign In failed: no identity token");

    const { error } = await supabase.auth.signInWithIdToken({
      provider: "apple",
      token: credential.identityToken,
    });
    if (error) throw error;
  },

  /** Load the current user's profile (role, rating, etc.). */
  async fetchProfile(userId: string): Promise<Profile> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (error) throw error;
    return mapProfile(data);
  },

  async updatePushToken(userId: string, token: string) {
    await supabase.from("profiles").update({ push_token: token }).eq("id", userId);
  },
};
