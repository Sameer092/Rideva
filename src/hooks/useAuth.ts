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
 * IMPORTANT: we must NOT call other Supabase methods *synchronously inside* the
 * onAuthStateChange callback — the auth client holds a lock during the callback
 * and a nested query (our profile fetch) would deadlock, leaving the app stuck
 * on the auth screen. We therefore defer the profile load with setTimeout(0),
 * which runs it after the lock is released. (Documented Supabase caveat.)
 */
export function useAuthBootstrap() {
  const { setSession, setProfile, setInitializing } = useAuthStore();

  useEffect(() => {
    let mounted = true;

    // Fetch the profile, retrying briefly to absorb the tiny race between the
    // auth signup completing and the DB trigger inserting the profile row.
    async function loadProfileFor(userId: string | undefined) {
      if (!userId) {
        if (mounted) setProfile(null);
        return;
      }
      for (let attempt = 0; attempt < 4; attempt++) {
        try {
          const profile = await authService.fetchProfile(userId);
          if (mounted) setProfile(profile);
          return;
        } catch {
          await new Promise((r) => setTimeout(r, 350));
        }
      }
      if (mounted) setProfile(null);
    }

    // 1. Restore persisted session on launch.
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      void loadProfileFor(data.session?.user.id).finally(() => {
        if (mounted) setInitializing(false);
      });
    });

    // 2. React to subsequent auth changes (sign in / out / token refresh).
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setSession(session);
      // Defer the DB call out of the auth-lock callback to avoid a deadlock.
      setTimeout(() => {
        if (mounted) void loadProfileFor(session?.user.id);
      }, 0);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [setSession, setProfile, setInitializing]);
}
