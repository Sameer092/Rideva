import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { notificationService } from "@/services/notifications";
import { useAuthStore } from "@/store/authStore";

/**
 * Registers the device for push once a user is authenticated and persists the
 * Expo token to their profile so edge functions can target it. Also wires the
 * tap-to-open handler (deep-link into the relevant ride).
 */
export function usePushRegistration() {
  const userId = useAuthStore((s) => s.session?.user.id);

  useEffect(() => {
    if (!userId) return;
    let active = true;

    notificationService.registerForPush().then((token) => {
      if (active && token) void notificationService.savePushToken(userId, token);
    });

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      // Navigation deep-link handled by the linking config; data.ride_id available here.
      void data;
    });

    return () => {
      active = false;
      sub.remove();
    };
  }, [userId]);
}
