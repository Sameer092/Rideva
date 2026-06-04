import React from "react";
import { Text } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import type { PassengerStackParamList, PassengerTabParamList } from "./types";
import { useTheme } from "@/hooks/useTheme";
import { HomeScreen } from "@/screens/passenger/HomeScreen";
import { ActivityScreen } from "@/screens/passenger/ActivityScreen";
import { AccountScreen } from "@/screens/shared/AccountScreen";
import { RideTrackingScreen } from "@/screens/passenger/RideTrackingScreen";
import { RideSummaryScreen } from "@/screens/passenger/RideSummaryScreen";
import { RateScreen } from "@/screens/shared/RateScreen";
import { SavedLocationsScreen } from "@/screens/passenger/SavedLocationsScreen";
import { LocationPickerScreen } from "@/screens/passenger/LocationPickerScreen";

const Tab = createBottomTabNavigator<PassengerTabParamList>();
const Stack = createNativeStackNavigator<PassengerStackParamList>();

function tabIcon(emoji: string) {
  return ({ focused }: { focused: boolean }) => (
    <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
  );
}

function PassengerTabs() {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#6D5EF6",
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700" },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 86,
          paddingTop: 8,
          paddingBottom: 28,
        },
      }}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ title: "Home", tabBarIcon: tabIcon("🗺️") }} />
      <Tab.Screen name="ActivityTab" component={ActivityScreen} options={{ title: "Activity", tabBarIcon: tabIcon("🧾") }} />
      <Tab.Screen name="AccountTab" component={AccountScreen} options={{ title: "Account", tabBarIcon: tabIcon("👤") }} />
    </Tab.Navigator>
  );
}

export function PassengerNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={PassengerTabs} />
      <Stack.Screen name="RideTracking" component={RideTrackingScreen} />
      <Stack.Screen name="RideSummary" component={RideSummaryScreen} options={{ presentation: "modal" }} />
      <Stack.Screen name="Rate" component={RateScreen} options={{ presentation: "modal" }} />
      <Stack.Screen name="SavedLocations" component={SavedLocationsScreen} options={{ headerShown: true, title: "Saved places" }} />
      <Stack.Screen name="LocationPicker" component={LocationPickerScreen} options={{ presentation: "fullScreenModal" }} />
    </Stack.Navigator>
  );
}
