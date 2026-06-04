import type { NavigatorScreenParams } from "@react-navigation/native";

/** Strongly-typed route params for every navigator in the app. */

export type AuthStackParamList = {
  Welcome: undefined;
  SignIn: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
};

export type PassengerTabParamList = {
  HomeTab: undefined;
  ActivityTab: undefined;
  AccountTab: undefined;
};

export type PassengerStackParamList = {
  Tabs: NavigatorScreenParams<PassengerTabParamList>;
  RideTracking: { rideId: string };
  RideSummary: { rideId: string };
  Rate: { rideId: string; rateeId: string };
  SavedLocations: undefined;
  LocationPicker: { field: "pickup" | "dropoff" };
};

export type DriverTabParamList = {
  DashboardTab: undefined;
  EarningsTab: undefined;
  TripsTab: undefined;
  AccountTab: undefined;
};

export type DriverStackParamList = {
  Tabs: NavigatorScreenParams<DriverTabParamList>;
  ActiveTrip: { rideId: string };
  Rate: { rideId: string; rateeId: string };
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Passenger: NavigatorScreenParams<PassengerStackParamList>;
  Driver: NavigatorScreenParams<DriverStackParamList>;
  Admin: undefined;
};
