import type { LatLng } from "@/types";

/**
 * Geospatial helpers. The backend stores geography as WGS84 points; over the
 * wire (PostgREST) they arrive as GeoJSON. These functions translate between
 * GeoJSON, the `{latitude, longitude}` shape react-native-maps expects, and the
 * WKT/longitude-first ordering Postgres functions require.
 */

/** PostGIS geography column serialised by PostgREST as GeoJSON. */
export interface GeoJSONPoint {
  type: "Point";
  coordinates: [number, number]; // [lng, lat]
}

/**
 * Decode whatever PostgREST returns for a geography column into {lat,lng}.
 * Supabase returns PostGIS geography as **WKB hex** (e.g. "0101000020E6100000…")
 * by default, but we also accept GeoJSON in case a view/cast returns it.
 */
export function toLatLng(geo: unknown): LatLng | null {
  if (!geo) return null;
  if (typeof geo === "string") {
    return /^[0-9A-Fa-f]{40,}$/.test(geo) ? wkbHexToLatLng(geo) : null;
  }
  if (typeof geo === "object" && "coordinates" in (geo as Record<string, unknown>)) {
    const coords = (geo as GeoJSONPoint).coordinates;
    if (!coords) return null;
    const [longitude, latitude] = coords;
    return { latitude, longitude };
  }
  return null;
}

/** Parse a (E)WKB hex Point into {lat,lng}. Handles the optional SRID flag. */
export function wkbHexToLatLng(hex: string): LatLng | null {
  try {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    const dv = new DataView(bytes.buffer);
    const little = dv.getUint8(0) === 1;
    const type = dv.getUint32(1, little);
    let offset = 5; // byte-order(1) + geometry-type(4)
    if ((type & 0x20000000) !== 0) offset += 4; // skip SRID when the flag is set
    const longitude = dv.getFloat64(offset, little);
    const latitude = dv.getFloat64(offset + 8, little);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    return { latitude, longitude };
  } catch {
    return null;
  }
}

/**
 * Build the value PostgREST/PostGIS accept for a geography INSERT/UPDATE.
 * Must be EWKT text — sending a GeoJSON object fails with "invalid geometry".
 */
export function toEWKT(point: LatLng): string {
  return `SRID=4326;POINT(${point.longitude} ${point.latitude})`;
}

const EARTH_RADIUS_M = 6_371_000;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance in metres (Haversine). */
export function haversineMeters(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Compass bearing a→b in degrees (0..360), for rotating the car marker. */
export function bearing(a: LatLng, b: LatLng): number {
  const φ1 = toRad(a.latitude);
  const φ2 = toRad(b.latitude);
  const Δλ = toRad(b.longitude - a.longitude);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (Math.atan2(y, x) * 180) / Math.PI + 360;
}

/** A map region that comfortably frames two points with padding. */
export function regionForPoints(a: LatLng, b: LatLng) {
  const latitude = (a.latitude + b.latitude) / 2;
  const longitude = (a.longitude + b.longitude) / 2;
  const latitudeDelta = Math.abs(a.latitude - b.latitude) * 1.6 + 0.01;
  const longitudeDelta = Math.abs(a.longitude - b.longitude) * 1.6 + 0.01;
  return { latitude, longitude, latitudeDelta, longitudeDelta };
}

/**
 * Decode a Google encoded polyline string into a list of coordinates so the
 * route can be drawn with <Polyline/>. Standard precision-5 algorithm.
 */
export function decodePolyline(encoded: string): LatLng[] {
  const points: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    result = 0;
    shift = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return points;
}
