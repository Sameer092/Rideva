import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/services/supabase";
import { authService } from "@/services/auth";

/**
 * Bootstraps and maintains the auth session for the whole app. Mounted once at
 * the root. Responsibilities:
 *   1. Restore any persisted session on launch.
 *   2. Subscribe to auth state changes (sign in/out, token refresh).
 *   3. Load the profile whenever the session's user changes (drives RBAC).
 *
 * Components read state from `useAuthStore`; they don't call this hook.
 */
export function useAuthBootstrap() {
  const { setSession, setProfile, setInitializing } = useAuthStore();

  useEffect(() => {
    let mounted = true;

    async function loadProfileFor(userId: string | undefined) {
      if (!userId) {
        setProfile(null);
        return;
      }
      try {
        const profile = await authService.fetchProfile(userId);
        if (mounted) setProfile(profile);
      } catch {
        if (mounted) setProfile(null);
      }
    }

    // 1. Restore persisted session.
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      await loadProfileFor(data.session?.user.id);
      setInitializing(false);
    });

    // 2. React to subsequent auth changes.
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      setSession(session);
      await loadProfileFor(session?.user.id);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [setSession, setProfile, setInitializing]);
}
