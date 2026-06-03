/**
 * Custom Google Maps dark style (subset). Keeps the map legible and on-brand in
 * dark mode without third-party tiles. Truncated for brevity — extend as needed
 * via https://mapstyle.withgoogle.com.
 */
export const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#1d1d24" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1d1d24" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#9ca3af" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2a2a33" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#15151b" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0b0b0f" }] },
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
];
