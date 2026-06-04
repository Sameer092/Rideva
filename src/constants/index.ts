/**
 * App-wide constants: theme tokens, map defaults, timing, and tunables.
 * Keeping these in one place makes design tweaks and behaviour changes a
 * one-line edit rather than a codebase-wide grep.
 */

export const COLORS = {
  brand: "#6D5EF6",
  brandDark: "#5A4BE6",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  light: {
    canvas: "#F5F6F8",
    surface: "#FFFFFF",
    text: "#0B0D12",
    textMuted: "#737886",
    border: "#ECEEF1",
  },
  dark: {
    canvas: "#0A0B0F",
    surface: "#15171D",
    text: "#F5F6F8",
    textMuted: "#9AA0AD",
    border: "#23262E",
  },
} as const;

/** Initial camera when we don't yet have a GPS fix (downtown SF). */
export const DEFAULT_REGION = {
  latitude: 37.7749,
  longitude: -122.4194,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
} as const;

export const LOCATION = {
  /** How often a driver pushes a location update while on a trip (ms). */
  driverUpdateIntervalMs: 4000,
  /** Min distance (m) the driver must move before we send an update. */
  driverUpdateDistanceM: 15,
  /** Passenger foreground location accuracy. */
  passengerAccuracy: 4, // Location.Accuracy.High
} as const;

export const RIDE = {
  /** Seconds a driver has to accept an incoming offer (mirror of edge fn). */
  offerTtlS: 15,
  /** How often the passenger client re-pings the dispatcher while matching. */
  dispatchPollMs: 6000,
} as const;

export const VEHICLE_CLASSES = [
  { key: "motorcycle", label: "Bike", seats: 1, eta: "1 min", icon: "🏍️" },
  { key: "rickshaw", label: "Rickshaw", seats: 3, eta: "2 min", icon: "🛺" },
  { key: "economy", label: "Economy", seats: 4, eta: "3 min", icon: "🚗" },
  { key: "comfort", label: "Comfort", seats: 4, eta: "4 min", icon: "🚙" },
  { key: "xl", label: "XL", seats: 6, eta: "5 min", icon: "🚐" },
  { key: "premium", label: "Premium", seats: 4, eta: "6 min", icon: "🏎️" },
] as const;

/** Default currency for the app. */
export const CURRENCY = "USD";

/** Human-readable copy for each ride status shown in the UI. */
export const RIDE_STATUS_COPY: Record<string, { title: string; subtitle: string }> = {
  requested: { title: "Finding your driver", subtitle: "Hang tight, we're searching nearby" },
  matching: { title: "Finding your driver", subtitle: "Connecting you with the closest driver" },
  accepted: { title: "Driver on the way", subtitle: "Your driver is heading to pickup" },
  arriving: { title: "Driver is arriving", subtitle: "Almost there" },
  arrived: { title: "Driver has arrived", subtitle: "Meet your driver at the pickup point" },
  in_progress: { title: "On the way", subtitle: "Enjoy your ride" },
  completed: { title: "Trip completed", subtitle: "Thanks for riding with Rideva" },
  cancelled: { title: "Ride cancelled", subtitle: "This ride was cancelled" },
  no_drivers: { title: "No drivers found", subtitle: "We couldn't find a driver nearby" },
};

export const STORAGE_KEYS = {
  themePreference: "rideva.theme",
} as const;
