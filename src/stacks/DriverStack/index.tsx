import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/Ionicons';
import colors from '@colors';
import { wp } from '@utils/utilities';
import Dashboard from '@routes/Driver/Dashboard';
import Earnings from '@routes/Driver/Earnings';
import Activity from '@routes/Passenger/Activity';
import Profile from '@routes/Shared/Profile';
import ActiveTrip from '@routes/Driver/ActiveTrip';
import Rate from '@routes/Shared/Rate';
import EditProfile from '@routes/Shared/EditProfile';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const ICONS = { Drive: 'car-sport', Earnings: 'wallet', Rides: 'receipt', Profile: 'person' };

function DriverTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.txtTertiary,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: wp(15) + insets.bottom,
          paddingBottom: insets.bottom + wp(1.5),
          paddingTop: wp(1.5),
        },
        tabBarLabelStyle: { fontSize: wp(2.7) },
        tabBarIcon: ({ color, focused }) => (
          <Icon name={focused ? ICONS[route.name] : `${ICONS[route.name]}-outline`} size={wp(6)} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Drive" component={Dashboard} />
      <Tab.Screen name="Earnings" component={Earnings} />
      <Tab.Screen name="Rides" component={Activity} />
      <Tab.Screen name="Profile" component={Profile} />
    </Tab.Navigator>
  );
}

function DriverStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DriverTabs" component={DriverTabs} />
      <Stack.Screen name="ActiveTrip" component={ActiveTrip} />
      <Stack.Screen name="Rate" component={Rate} />
      <Stack.Screen name="EditProfile" component={EditProfile} />
    </Stack.Navigator>
  );
}

export default DriverStack;
