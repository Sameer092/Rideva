import React from "react";
import { Text } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import type { DriverStackParamList, DriverTabParamList } from "./types";
import { useTheme } from "@/hooks/useTheme";
import { DriverDashboardScreen } from "@/screens/driver/DriverDashboardScreen";
import { EarningsScreen } from "@/screens/driver/EarningsScreen";
import { ActivityScreen } from "@/screens/passenger/ActivityScreen";
import { AccountScreen } from "@/screens/shared/AccountScreen";
import { ActiveTripScreen } from "@/screens/driver/ActiveTripScreen";
import { RateScreen } from "@/screens/shared/RateScreen";

const Tab = createBottomTabNavigator<DriverTabParamList>();
const Stack = createNativeStackNavigator<DriverStackParamList>();

function tabIcon(emoji: string) {
  return ({ focused }: { focused: boolean }) => (
    <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
  );
}

function DriverTabs() {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#5B5BD6",
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
      }}
    >
      <Tab.Screen name="DashboardTab" component={DriverDashboardScreen} options={{ title: "Drive", tabBarIcon: tabIcon("🚗") }} />
      <Tab.Screen name="EarningsTab" component={EarningsScreen} options={{ title: "Earnings", tabBarIcon: tabIcon("💵") }} />
      <Tab.Screen name="TripsTab" component={ActivityScreen} options={{ title: "Trips", tabBarIcon: tabIcon("🧾") }} />
      <Tab.Screen name="AccountTab" component={AccountScreen} options={{ title: "Account", tabBarIcon: tabIcon("👤") }} />
    </Tab.Navigator>
  );
}

export function DriverNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={DriverTabs} />
      <Stack.Screen name="ActiveTrip" component={ActiveTripScreen} />
      <Stack.Screen name="Rate" component={RateScreen} options={{ presentation: "modal" }} />
    </Stack.Navigator>
  );
}
