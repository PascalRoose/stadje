import { describe, expect, it } from "vitest";
import { generatePuzzleCycle } from "@/scripts/generate-puzzle-cycle";

const CITY_IDS = ["a", "b", "c", "d", "e"];
const LAUNCH = "2026-01-01";

describe("generatePuzzleCycle", () => {
  it("assigns exactly one date per day starting at the launch date", () => {
    const cycle = generatePuzzleCycle(CITY_IDS, LAUNCH, 5);
    expect(Object.keys(cycle)).toEqual([
      "2026-01-01",
      "2026-01-02",
      "2026-01-03",
      "2026-01-04",
      "2026-01-05",
    ]);
  });

  it("does not repeat a cityId within the same cycleNumber", () => {
    const cycle = generatePuzzleCycle(CITY_IDS, LAUNCH, CITY_IDS.length);
    const seenInCycle = new Map<number, Set<string>>();
    for (const entry of Object.values(cycle)) {
      const seen = seenInCycle.get(entry.cycleNumber) ?? new Set<string>();
      expect(seen.has(entry.cityId)).toBe(false);
      seen.add(entry.cityId);
      seenInCycle.set(entry.cycleNumber, seen);
    }
  });

  it("uses every city exactly once within a full cycle", () => {
    const cycle = generatePuzzleCycle(CITY_IDS, LAUNCH, CITY_IDS.length);
    const assigned = Object.values(cycle)
      .map((e) => e.cityId)
      .sort();
    expect(assigned).toEqual([...CITY_IDS].sort());
  });

  it("starts a new cycle (cycleNumber increments) once the dataset is exhausted", () => {
    const cycle = generatePuzzleCycle(CITY_IDS, LAUNCH, CITY_IDS.length + 1);
    const dates = Object.keys(cycle);
    const last = cycle[dates[dates.length - 1]];
    expect(last.cycleNumber).toBe(1);
    expect(last.positionInCycle).toBe(0);
  });

  it("is deterministic — the same inputs always produce the same assignment", () => {
    const a = generatePuzzleCycle(CITY_IDS, LAUNCH, 20);
    const b = generatePuzzleCycle(CITY_IDS, LAUNCH, 20);
    expect(a).toEqual(b);
  });

  it("throws for an empty city list", () => {
    expect(() => generatePuzzleCycle([], LAUNCH, 5)).toThrow();
  });
});
