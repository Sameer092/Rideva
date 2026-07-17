import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/Ionicons';
import colors from '@colors';
import { wp } from '@utils/utilities';
import Home from '@routes/Passenger/Home';
import Activity from '@routes/Passenger/Activity';
import Profile from '@routes/Shared/Profile';
import RideTracking from '@routes/Passenger/RideTracking';
import RideSummary from '@routes/Passenger/RideSummary';
import LocationPicker from '@routes/Passenger/LocationPicker';
import SavedLocations from '@routes/Passenger/SavedLocations';
import Rate from '@routes/Shared/Rate';
import EditProfile from '@routes/Shared/EditProfile';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const ICONS = { Home: 'map', Activity: 'receipt', Profile: 'person' };

function PassengerTabs() {
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
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="Activity" component={Activity} />
      <Tab.Screen name="Profile" component={Profile} />
    </Tab.Navigator>
  );
}

function PassengerStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PassengerTabs" component={PassengerTabs} />
      <Stack.Screen name="RideTracking" component={RideTracking} />
      <Stack.Screen name="RideSummary" component={RideSummary} />
      <Stack.Screen name="LocationPicker" component={LocationPicker} />
      <Stack.Screen name="SavedLocations" component={SavedLocations} />
      <Stack.Screen name="Rate" component={Rate} />
      <Stack.Screen name="EditProfile" component={EditProfile} />
    </Stack.Navigator>
  );
}

export default PassengerStack;
