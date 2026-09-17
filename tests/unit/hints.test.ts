import { describe, expect, it } from "vitest";
import type { City } from "@/lib/cities";
import { computeHints } from "@/lib/game/hints";

function makeCity(overrides: Partial<City>): City {
  return {
    id: "test",
    name: "Test",
    aliases: [],
    province: "Zuid-Holland",
    population: 100_000,
    populationSource: "CBS",
    populationDate: "2026",
    latitude: 52.0,
    longitude: 5.0,
    image: { url: "", source: "", owner: "", license: "" },
    wikipedia: "",
    ...overrides,
  };
}

// Answer: population 100,000, at (52.0, 5.0). Green population boundary is 10% => 90,000-110,000.
// Orange population boundary is 25% => 75,000-125,000. Orange distance boundary is 25km.
const ANSWER = makeCity({
  province: "Zuid-Holland",
  population: 100_000,
  latitude: 52.0,
  longitude: 5.0,
});

describe("computeHints — province (independent of population/distance)", () => {
  it("is green when province matches, even when population/distance are both far off", () => {
    const guess = makeCity({
      province: "Zuid-Holland",
      population: 1,
      latitude: 60,
      longitude: 20,
    });
    const hints = computeHints(guess, ANSWER);
    expect(hints.province).toEqual({ match: true, tier: "green" });
  });

  it("is red when province doesn't match, even when population/distance are both spot on", () => {
    // Different province, but otherwise identical (population equal, effectively same location).
    const guess = makeCity({
      province: "Groningen",
      population: 100_000,
      latitude: 52.0,
      longitude: 5.0,
    });
    const hints = computeHints(guess, ANSWER);
    expect(hints.province).toEqual({ match: false, tier: "red" });
  });

  it("has no orange tier — province is always exactly green or red", () => {
    const guess = makeCity({ province: "Groningen" });
    const hints = computeHints(guess, ANSWER);
    expect(["green", "red"]).toContain(hints.province.tier);
  });
});

describe("computeHints — population boundary (10%/25%), independent of province/distance", () => {
  it("is green when population is exactly 10% off (boundary, inclusive)", () => {
    const guess = makeCity({
      province: "Groningen",
      population: 90_000,
      latitude: 0,
      longitude: 0,
    });
    expect(computeHints(guess, ANSWER).population.tier).toBe("green");
  });

  it("is orange (not green) when population is just over 10% off", () => {
    const guess = makeCity({
      province: "Groningen",
      population: 89_999,
      latitude: 0,
      longitude: 0,
    });
    expect(computeHints(guess, ANSWER).population.tier).toBe("orange");
  });

  it("is orange when population is exactly 25% off (boundary, inclusive)", () => {
    const guess = makeCity({
      province: "Groningen",
      population: 75_000,
      latitude: 0,
      longitude: 0,
    });
    expect(computeHints(guess, ANSWER).population.tier).toBe("orange");
  });

  it("is red when population is just over 25% off", () => {
    const guess = makeCity({
      province: "Groningen",
      population: 74_999,
      latitude: 0,
      longitude: 0,
    });
    expect(computeHints(guess, ANSWER).population.tier).toBe("red");
  });

  it("reports direction 'higher' when the true value is above the guess", () => {
    const guess = makeCity({ population: 50_000 });
    expect(computeHints(guess, ANSWER).population.direction).toBe("higher");
  });

  it("reports direction 'lower' when the true value is below the guess", () => {
    const guess = makeCity({ population: 150_000 });
    expect(computeHints(guess, ANSWER).population.direction).toBe("lower");
  });

  it("reports direction 'equal' when population matches exactly", () => {
    const guess = makeCity({ population: 100_000 });
    expect(computeHints(guess, ANSWER).population.direction).toBe("equal");
  });
});

describe("computeHints — distance: green ONLY at exactly 0 km", () => {
  it("is orange when distance is exactly 25 km (boundary, inclusive)", () => {
    const guess = makeCity({
      province: "Groningen",
      population: 1,
      latitude: ANSWER.latitude - 25 / 111.32,
      longitude: ANSWER.longitude,
    });
    const hints = computeHints(guess, ANSWER);
    expect(hints.distance.km).toBe(25);
    expect(hints.distance.tier).toBe("orange");
  });

  it("is red when distance is 26 km", () => {
    const guess = makeCity({
      province: "Groningen",
      population: 1,
      latitude: ANSWER.latitude - 26 / 111.32,
      longitude: ANSWER.longitude,
    });
    const hints = computeHints(guess, ANSWER);
    expect(hints.distance.km).toBe(26);
    expect(hints.distance.tier).toBe("red");
  });

  it("is orange, NOT green, at 1 km — green means exactly correct, not merely very close", () => {
    const guess = makeCity({
      province: "Groningen",
      population: 1,
      latitude: ANSWER.latitude - 1 / 111.32,
      longitude: ANSWER.longitude,
    });
    const hints = computeHints(guess, ANSWER);
    expect(hints.distance.km).toBeGreaterThanOrEqual(0);
    expect(hints.distance.km).toBeLessThanOrEqual(2);
    expect(hints.distance.tier).not.toBe("green");
  });

  it("is green only when distance is exactly 0 km (the correct city)", () => {
    const hints = computeHints(ANSWER, ANSWER);
    expect(hints.distance.km).toBe(0);
    expect(hints.distance.tier).toBe("green");
    expect(hints.distance.direction).toBeNull();
  });
});

describe("computeHints — the correct city is green across all three hints at once", () => {
  it("guessing the answer itself yields green province, population, and distance", () => {
    const hints = computeHints(ANSWER, ANSWER);
    expect(hints.province.tier).toBe("green");
    expect(hints.population.tier).toBe("green");
    expect(hints.distance.tier).toBe("green");
  });
});
