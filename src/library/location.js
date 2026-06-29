import * as Location from 'expo-location';
import { NOMINATIM } from '@config/constant';

export async function requestPermission() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

export async function getCurrentLocation() {
  const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
}

export async function reverseGeocode(point) {
  try {
    const url = `${NOMINATIM}/reverse?format=jsonv2&lat=${point.latitude}&lon=${point.longitude}&zoom=18&addressdetails=1&accept-language=en`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Rideva/1.0', Accept: 'application/json' } });
    if (res.ok) {
      const data = await res.json();
      const a = data.address || {};
      const line = [a.road || a.neighbourhood || a.suburb, a.city || a.town || a.village, a.country]
        .filter(Boolean)
        .join(', ');
      if (line) return line;
      if (data.display_name) return data.display_name;
    }
  } catch (e) {}
  return `${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)}`;
}

export async function searchPlaces(query, near) {
  try {
    let url = `${NOMINATIM}/search?format=jsonv2&q=${encodeURIComponent(query)}&limit=6&addressdetails=1&accept-language=en`;
    if (near) {
      const d = 0.6;
      url += `&viewbox=${near.longitude - d},${near.latitude + d},${near.longitude + d},${near.latitude - d}&bounded=0`;
    }
    const res = await fetch(url, { headers: { 'User-Agent': 'Rideva/1.0', Accept: 'application/json' } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.map((d) => ({
      label: d.display_name,
      point: { latitude: parseFloat(d.lat), longitude: parseFloat(d.lon) },
    }));
  } catch (e) {
    return [];
  }
}

export function watchLocation(onUpdate, intervalMs, distanceM) {
  return Location.watchPositionAsync(
    { accuracy: Location.Accuracy.High, timeInterval: intervalMs, distanceInterval: distanceM },
    (pos) => {
      onUpdate(
        { latitude: pos.coords.latitude, longitude: pos.coords.longitude },
        pos.coords.heading,
        pos.coords.speed != null ? pos.coords.speed * 3.6 : null,
      );
    },
  );
}

export function toEWKT(point) {
  return `SRID=4326;POINT(${point.longitude} ${point.latitude})`;
}

export function wkbHexToLatLng(hex) {
  try {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    const dv = new DataView(bytes.buffer);
    const little = dv.getUint8(0) === 1;
    const type = dv.getUint32(1, little);
    let offset = 5;
    if ((type & 0x20000000) !== 0) offset += 4;
    const longitude = dv.getFloat64(offset, little);
    const latitude = dv.getFloat64(offset + 8, little);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    return { latitude, longitude };
  } catch (e) {
    return null;
  }
}

export function toLatLng(geo) {
  if (!geo) return null;
  if (typeof geo === 'string') {
    return /^[0-9A-Fa-f]{40,}$/.test(geo) ? wkbHexToLatLng(geo) : null;
  }
  if (geo.coordinates) {
    return { latitude: geo.coordinates[1], longitude: geo.coordinates[0] };
  }
  return null;
}
