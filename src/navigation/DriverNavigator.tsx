import React from "react";
import { Ionicons } from "@expo/vector-icons";
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
import { EditProfileScreen } from "@/screens/shared/EditProfileScreen";

const Tab = createBottomTabNavigator<DriverTabParamList>();
const Stack = createNativeStackNavigator<DriverStackParamList>();

/** Tab icon factory — filled when active, outline when inactive. */
function tabIcon(filled: keyof typeof Ionicons.glyphMap, outline: keyof typeof Ionicons.glyphMap) {
  return ({ focused, color, size }: { focused: boolean; color: string; size: number }) => (
    <Ionicons name={focused ? filled : outline} size={size ?? 24} color={color} />
  );
}

function DriverTabs() {
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
      <Tab.Screen name="DashboardTab" component={DriverDashboardScreen} options={{ title: "Drive", tabBarIcon: tabIcon("car-sport", "car-sport-outline") }} />
      <Tab.Screen name="EarningsTab" component={EarningsScreen} options={{ title: "Earnings", tabBarIcon: tabIcon("wallet", "wallet-outline") }} />
      <Tab.Screen name="TripsTab" component={ActivityScreen} options={{ title: "Rides", tabBarIcon: tabIcon("receipt", "receipt-outline") }} />
      <Tab.Screen name="AccountTab" component={AccountScreen} options={{ title: "Account", tabBarIcon: tabIcon("person-circle", "person-circle-outline") }} />
    </Tab.Navigator>
  );
}

export function DriverNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={DriverTabs} />
      <Stack.Screen name="ActiveTrip" component={ActiveTripScreen} />
      <Stack.Screen name="Rate" component={RateScreen} options={{ presentation: "modal" }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ presentation: "modal" }} />
    </Stack.Navigator>
  );
}
