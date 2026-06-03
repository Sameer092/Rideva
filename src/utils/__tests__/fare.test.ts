import { haversineMeters, decodePolyline } from "@/utils/geo";
import { formatMoney, formatDistance } from "@/utils/format";

describe("geo utils", () => {
  it("computes haversine distance between two SF points (~1.4km)", () => {
    const a = { latitude: 37.7749, longitude: -122.4194 };
    const b = { latitude: 37.7849, longitude: -122.4094 };
    const d = haversineMeters(a, b);
    expect(d).toBeGreaterThan(1200);
    expect(d).toBeLessThan(1600);
  });

  it("decodes a Google polyline", () => {
    // "_p~iF~ps|U_ulLnnqC_mqNvxq`@" → 3 points (canonical example)
    const pts = decodePolyline("_p~iF~ps|U_ulLnnqC_mqNvxq`@");
    expect(pts).toHaveLength(3);
    expect(pts[0]!.latitude).toBeCloseTo(38.5, 1);
  });
});

describe("format utils", () => {
  it("formats minor units as currency", () => {
    expect(formatMoney(1234, "USD")).toBe("$12.34");
  });
  it("formats distance in m and km", () => {
    expect(formatDistance(500)).toBe("500 m");
    expect(formatDistance(1500)).toBe("1.5 km");
  });
});
