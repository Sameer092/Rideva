/** Presentation formatters. Money is stored as integer minor units (cents). */

export function formatMoney(minorUnits: number | null | undefined, currency = "USD"): string {
  const value = (minorUnits ?? 0) / 100;
  const code = (currency || "USD").trim().toUpperCase();
  if (code === "PKR") return `₨${Math.round(value).toLocaleString("en-US")}`;
  // Guard against an invalid/empty currency code — Intl throws "Currency is
  // invalid" otherwise, which would crash the screen.
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: code, minimumFractionDigits: 2 }).format(value);
  } catch {
    return `$${value.toFixed(2)}`;
  }
}

export function formatDistance(meters: number | null | undefined): string {
  if (meters == null) return "—";
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null) return "—";
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  return `${h}h ${mins % 60}m`;
}

export function formatEta(seconds: number | null | undefined): string {
  if (seconds == null) return "—";
  const mins = Math.max(1, Math.round(seconds / 60));
  return `${mins} min away`;
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleDateString();
}
