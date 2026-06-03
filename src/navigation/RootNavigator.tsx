import React from "react";
import { NavigationContainer, DefaultTheme, DarkTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as Linking from "expo-linking";
import type { RootStackParamList } from "./types";
import { useAuthStore } from "@/store/authStore";
import { useTheme } from "@/hooks/useTheme";
import { LoadingState } from "@/components/ui/States";
import { AuthNavigator } from "./AuthNavigator";
import { PassengerNavigator } from "./PassengerNavigator";
import { DriverNavigator } from "./DriverNavigator";
import { AdminScreen } from "@/screens/admin/AdminScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

const linking = {
  prefixes: [Linking.createURL("/"), "rideva://"],
  config: {
    screens: {
      Auth: { screens: { SignIn: "auth/callback" } },
    },
  },
};

/**
 * Root navigator with role-based access control. Which stack mounts is driven
 * purely by auth state + the profile role:
 *   - no session            → Auth stack
 *   - role = passenger       → Passenger stack
 *   - role = driver          → Driver stack
 *   - role = admin           → Admin entry (full dashboard is web; mobile is a
 *                              monitoring surface)
 * Because the stacks are mutually exclusive, a passenger can never reach driver
 * screens and vice-versa — RBAC is enforced at the navigation boundary in
 * addition to RLS at the data layer.
 */
export function RootNavigator() {
  const { scheme } = useTheme();
  const session = useAuthStore((s) => s.session);
  const profile = useAuthStore((s) => s.profile);
  const initializing = useAuthStore((s) => s.initializing);

  if (initializing) return <LoadingState message="Starting Rideva…" />;

  const role = profile?.role;

  return (
    <NavigationContainer linking={linking} theme={scheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!session || !profile ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : role === "driver" ? (
          <Stack.Screen name="Driver" component={DriverNavigator} />
        ) : role === "admin" ? (
          <Stack.Screen name="Admin" component={AdminScreen} />
        ) : (
          <Stack.Screen name="Passenger" component={PassengerNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
