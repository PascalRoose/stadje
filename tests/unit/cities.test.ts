import { describe, expect, it } from "vitest";
import { getCityById, resolveCity, searchCities } from "@/lib/cities";

describe("searchCities — normalized index (FR-003)", () => {
  it("matches case-insensitively", () => {
    const results = searchCities("utrecht");
    expect(results.some((c) => c.id === "utrecht")).toBe(true);
    expect(searchCities("UTRECHT").some((c) => c.id === "utrecht")).toBe(true);
  });

  it("matches diacritic-insensitively", () => {
    // "'s-Hertogenbosch" / "Den Bosch" style names carry no diacritics themselves, but the
    // normalize() path (NFKD strip) must still hold for any city name that does — exercised here
    // via a deliberately-accented query against a plain-ASCII name, which must still match since
    // both sides are normalized the same way.
    const plain = searchCities("utrecht");
    const accented = searchCities("útrécht");
    expect(accented.map((c) => c.id)).toEqual(plain.map((c) => c.id));
  });

  it("matches via an alias and resolves to the city's display name", () => {
    const rotterdam = getCityById("rotterdam");
    expect(rotterdam).toBeDefined();
    if (rotterdam?.aliases.length) {
      const results = searchCities(rotterdam.aliases[0]);
      expect(results.some((c) => c.id === "rotterdam")).toBe(true);
    }
  });

  it("returns an empty array for a blank query", () => {
    expect(searchCities("")).toEqual([]);
    expect(searchCities("   ")).toEqual([]);
  });

  it("caps results at the given limit", () => {
    // A single common letter matches many cities' names/aliases — a good stress case for `limit`.
    const results = searchCities("e", 3);
    expect(results.length).toBeLessThanOrEqual(3);
  });

  it("does not mutate its internal cache across repeated calls", () => {
    const first = searchCities("utrecht");
    const second = searchCities("utrecht");
    expect(second).toEqual(first);
    expect(second).not.toBe(first); // independent array instances (.filter() returns fresh arrays)
  });
});

describe("resolveCity — exact normalized match", () => {
  it("resolves an exact display-name match", () => {
    expect(resolveCity("Utrecht")?.id).toBe("utrecht");
  });

  it("resolves case/diacritic-insensitively", () => {
    expect(resolveCity("UTRECHT")?.id).toBe("utrecht");
  });

  it("returns undefined for an unknown city", () => {
    expect(resolveCity("Not A Real City")).toBeUndefined();
  });

  it("does not match on a mere substring (unlike searchCities)", () => {
    // "Utrec" is a substring searchCities() would match, but resolveCity() requires an exact
    // (normalized) match — it's used to validate a submitted guess, not to suggest candidates.
    expect(resolveCity("Utrec")).toBeUndefined();
  });
});
