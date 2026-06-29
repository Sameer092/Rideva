export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

export const NOMINATIM = 'https://nominatim.openstreetmap.org';

export const DEFAULT_REGION = {
  latitude: 37.7749,
  longitude: -122.4194,
};

export const VEHICLE_CLASSES = [
  { key: 'motorcycle', label: 'Bike', icon: 'motorbike', seats: 1 },
  { key: 'rickshaw', label: 'Rickshaw', icon: 'rickshaw', seats: 3 },
  { key: 'economy', label: 'Economy', icon: 'car-hatchback', seats: 4 },
  { key: 'comfort', label: 'Comfort', icon: 'car', seats: 4 },
  { key: 'xl', label: 'XL', icon: 'van-passenger', seats: 6 },
  { key: 'premium', label: 'Premium', icon: 'car-sports', seats: 4 },
];

export const RIDE_STATUS_COPY = {
  requested: { title: 'Finding your driver', subtitle: 'Connecting you with nearby drivers' },
  matching: { title: 'Choosing your driver', subtitle: 'Pick a driver offer below' },
  accepted: { title: 'Driver on the way', subtitle: 'Your driver is heading to pickup' },
  arriving: { title: 'Driver is arriving', subtitle: 'Almost there' },
  arrived: { title: 'Driver has arrived', subtitle: 'Meet your driver at the pickup point' },
  in_progress: { title: 'On the way', subtitle: 'Enjoy your ride' },
  completed: { title: 'Ride completed', subtitle: 'Thanks for riding with Rideva' },
  cancelled: { title: 'Ride cancelled', subtitle: 'This ride was cancelled' },
  no_drivers: { title: 'No drivers found', subtitle: 'Please try again' },
};
