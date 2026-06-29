import { Dimensions } from 'react-native';
import { heightPercentageToDP, widthPercentageToDP } from 'react-native-responsive-screen';

const isTablet = () => {
  const { width, height } = Dimensions.get('window');
  const shorter = Math.min(width, height);
  const aspectRatio = Math.max(width, height) / shorter;
  return shorter >= 600 && aspectRatio < 1.6;
};

export const wp = (width) => {
  return isTablet() ? heightPercentageToDP(width * 0.46) : widthPercentageToDP(width);
};

export const hp = (height) => {
  return heightPercentageToDP(height);
};

export const trunc = (text, length) => {
  if (!text) return '';
  return text.length > length ? `${text.slice(0, length)}...` : text;
};

export const currency = (amountMinor) => {
  const value = Number(amountMinor || 0) / 100;
  return `$${value.toFixed(2)}`;
};

export const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

export const formatDistance = (meters) => {
  if (meters == null) return '—';
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
};

export const formatEta = (seconds) => {
  if (seconds == null) return '—';
  return `${Math.max(1, Math.round(seconds / 60))} min`;
};

export const relativeTime = (iso) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleDateString();
};

export const ratingText = (avg, count) => {
  const unrated = count !== undefined ? count <= 0 : avg <= 0;
  return unrated ? 'New' : Number(avg).toFixed(1);
};
