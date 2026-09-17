import { describe, expect, it } from "vitest";
import { compassBearing, distanceKm } from "@/lib/game/distance";

// Known coordinates (from data/cities.json)
const UTRECHT = { latitude: 52.0907, longitude: 5.1214 };
const ROTTERDAM = { latitude: 51.9244, longitude: 4.4777 };
const SAME_POINT = { latitude: 52.0907, longitude: 5.1214 };

describe("distanceKm", () => {
  it("returns 0 for identical coordinates", () => {
    expect(distanceKm(UTRECHT, SAME_POINT)).toBe(0);
  });

  it("computes a known distance rounded to whole km (Utrecht-Rotterdam ~49km)", () => {
    const d = distanceKm(UTRECHT, ROTTERDAM);
    expect(d).toBeGreaterThanOrEqual(45);
    expect(d).toBeLessThanOrEqual(53);
    expect(Number.isInteger(d)).toBe(true);
  });

  it("is symmetric", () => {
    expect(distanceKm(UTRECHT, ROTTERDAM)).toBe(distanceKm(ROTTERDAM, UTRECHT));
  });
});

describe("compassBearing", () => {
  it("points north when the target is due north", () => {
    const from = { latitude: 52.0, longitude: 5.0 };
    const to = { latitude: 53.0, longitude: 5.0 };
    expect(compassBearing(from, to)).toBe("N");
  });

  it("points south when the target is due south", () => {
    const from = { latitude: 53.0, longitude: 5.0 };
    const to = { latitude: 52.0, longitude: 5.0 };
    expect(compassBearing(from, to)).toBe("S");
  });

  it("points east when the target is due east", () => {
    const from = { latitude: 52.0, longitude: 5.0 };
    const to = { latitude: 52.0, longitude: 6.0 };
    expect(compassBearing(from, to)).toBe("E");
  });

  it("points west when the target is due west", () => {
    const from = { latitude: 52.0, longitude: 6.0 };
    const to = { latitude: 52.0, longitude: 5.0 };
    expect(compassBearing(from, to)).toBe("W");
  });

  it("returns one of the 8 defined compass points for an arbitrary pair", () => {
    const result = compassBearing(UTRECHT, ROTTERDAM);
    expect(["N", "NE", "E", "SE", "S", "SW", "W", "NW"]).toContain(result);
  });
});
