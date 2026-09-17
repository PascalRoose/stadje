import { describe, expect, it } from "vitest";
import { getCities } from "@/lib/cities";
import { cityForDate, isKnownPuzzleDate } from "@/lib/game/selection";
import { LAUNCH_DATE } from "@/scripts/generate-puzzle-cycle";

describe("cityForDate", () => {
  it("resolves a real city for the launch date", () => {
    const city = cityForDate(LAUNCH_DATE);
    expect(city).toBeDefined();
    expect(getCities().some((c) => c.id === city?.id)).toBe(true);
  });

  it("returns undefined for a date before launch", () => {
    expect(cityForDate("2000-01-01")).toBeUndefined();
  });

  it("returns undefined for a date beyond the generated horizon", () => {
    expect(cityForDate("2999-01-01")).toBeUndefined();
  });

  it("does not repeat a city within the first full cycle", () => {
    const cityCount = getCities().length;
    const seen = new Set<string>();
    const [year, month, day] = LAUNCH_DATE.split("-").map(Number);
    for (let i = 0; i < cityCount; i++) {
      const date = new Date(Date.UTC(year, month - 1, day));
      date.setUTCDate(date.getUTCDate() + i);
      const dateStr = date.toISOString().slice(0, 10);
      const city = cityForDate(dateStr);
      expect(city).toBeDefined();
      if (!city) throw new Error("unreachable");
      expect(seen.has(city.id)).toBe(false);
      seen.add(city.id);
    }
  });
});

describe("isKnownPuzzleDate", () => {
  it("is true for the launch date", () => {
    expect(isKnownPuzzleDate(LAUNCH_DATE)).toBe(true);
  });

  it("is false for a pre-launch date", () => {
    expect(isKnownPuzzleDate("2000-01-01")).toBe(false);
  });
});
