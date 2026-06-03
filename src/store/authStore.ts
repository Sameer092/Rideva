import { create } from "zustand";
import type { Session } from "@supabase/supabase-js";
import type { Profile } from "@/types";

/**
 * Auth + identity store. This holds the *session* and the loaded *profile*
 * (which carries the role used for RBAC routing). It is the single source of
 * truth the navigation tree subscribes to in order to decide which stack to
 * render (auth / passenger / driver / admin).
 *
 * The store is intentionally thin: side-effects (Supabase calls, listeners)
 * live in `useAuth` and `services/auth`. Here we only keep state.
 */
interface AuthState {
  session: Session | null;
  profile: Profile | null;
  /** True until the initial session restore + profile fetch resolves. */
  initializing: boolean;

  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setInitializing: (value: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  profile: null,
  initializing: true,

  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  setInitializing: (initializing) => set({ initializing }),
  reset: () => set({ session: null, profile: null }),
}));

/** Convenience selectors (stable references avoid needless re-renders). */
export const selectIsAuthenticated = (s: AuthState) => !!s.session && !!s.profile;
export const selectRole = (s: AuthState) => s.profile?.role ?? null;
