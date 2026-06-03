import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { supabase } from "./supabase";
import { mapNotification } from "./mappers";

/**
 * Push + in-app notification service. Registers the device for Expo push,
 * persists the token to the profile (so edge functions can target it), and
 * exposes helpers to read/mark the in-app feed.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const notificationService = {
  /** Ask for permission and return the Expo push token (or null if denied). */
  async registerForPush(): Promise<string | null> {
    if (!Device.isDevice) return null; // push doesn't work on simulators

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("rides", {
        name: "Rides",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#5B5BD6",
      });
    }

    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== "granted") {
      status = (await Notifications.requestPermissionsAsync()).status;
    }
    if (status !== "granted") return null;

    const token = await Notifications.getExpoPushTokenAsync();
    return token.data;
  },

  async savePushToken(userId: string, token: string) {
    await supabase.from("profiles").update({ push_token: token }).eq("id", userId);
  },

  async list(userId: string) {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return (data ?? []).map(mapNotification);
  },

  async markRead(id: string) {
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
  },
};
