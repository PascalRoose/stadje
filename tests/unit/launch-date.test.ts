import { describe, expect, it } from "vitest";
import { LAUNCH_DATE, puzzleNumber } from "@/lib/launch-date";

describe("puzzleNumber", () => {
  it("is 1 on launch day", () => {
    expect(puzzleNumber(LAUNCH_DATE)).toBe(1);
  });

  it("is 2 the day after launch", () => {
    expect(puzzleNumber("2026-09-18")).toBe(2);
  });

  it("counts correctly several days later", () => {
    expect(puzzleNumber("2026-09-27")).toBe(11);
  });

  it("is 0 or negative for a date before launch", () => {
    expect(puzzleNumber("2026-09-16")).toBe(0);
    expect(puzzleNumber("2026-09-10")).toBe(-6);
  });

  it("doesn't drift across a DST transition (UTC-only Date.UTC arithmetic)", () => {
    // 2026-10-25 is the CEST->CET transition day; a naive local-time day-diff could be off by an
    // hour here, but puzzleNumber deliberately uses Date.UTC for both endpoints.
    expect(puzzleNumber("2026-10-25")).toBe(39);
    expect(puzzleNumber("2026-10-26")).toBe(40);
  });
});
