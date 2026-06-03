/**
 * App-wide constants: theme tokens, map defaults, timing, and tunables.
 * Keeping these in one place makes design tweaks and behaviour changes a
 * one-line edit rather than a codebase-wide grep.
 */

export const COLORS = {
  brand: "#5B5BD6",
  brandDark: "#4A4ABF",
  success: "#16A34A",
  warning: "#D97706",
  danger: "#DC2626",
  light: {
    canvas: "#F5F5F8",
    surface: "#FFFFFF",
    text: "#0B0B0F",
    textMuted: "#6B7280",
    border: "#E5E7EB",
  },
  dark: {
    canvas: "#0B0B0F",
    surface: "#15151B",
    text: "#F5F5F8",
    textMuted: "#9CA3AF",
    border: "#27272F",
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
  { key: "economy", label: "Economy", seats: 4, eta: "2 min", icon: "🚗" },
  { key: "comfort", label: "Comfort", seats: 4, eta: "4 min", icon: "🚙" },
  { key: "xl", label: "XL", seats: 6, eta: "5 min", icon: "🚐" },
  { key: "premium", label: "Premium", seats: 4, eta: "6 min", icon: "🏎️" },
] as const;

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
