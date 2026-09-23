import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  formatHeaderDate,
  isFutureDate,
  isValidDateString,
  msUntilNextAmsterdamMidnight,
  resolvePuzzleDate,
  todayAmsterdam,
} from "@/lib/time";

afterEach(() => {
  vi.useRealTimers();
});

describe("todayAmsterdam", () => {
  it("converts a UTC instant that is already the next calendar day in Amsterdam", () => {
    // 23:30 UTC on 2026-12-31 is CET (UTC+1, winter) => 00:30 local on 2027-01-01.
    expect(todayAmsterdam(new Date("2026-12-31T23:30:00Z"))).toBe("2027-01-01");
  });

  it("crosses midnight correctly on the spring DST transition day (CET -> CEST, 2026-03-29)", () => {
    // 23:30 UTC on 2026-03-28 is still CET (UTC+1, pre-transition) => 00:30 local on 2026-03-29.
    expect(todayAmsterdam(new Date("2026-03-28T23:30:00Z"))).toBe("2026-03-29");
  });

  it("crosses midnight correctly on the autumn DST transition day (CEST -> CET, 2026-10-25)", () => {
    // 22:30 UTC on 2026-10-24 is still CEST (UTC+2, pre-transition) => 00:30 local on 2026-10-25.
    expect(todayAmsterdam(new Date("2026-10-24T22:30:00Z"))).toBe("2026-10-25");
  });
});

describe("isFutureDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-17T12:00:00Z"));
  });

  it("is true for a date after today", () => {
    expect(isFutureDate("2026-09-18")).toBe(true);
  });

  it("is false for today", () => {
    expect(isFutureDate("2026-09-17")).toBe(false);
  });

  it("is false for a date before today", () => {
    expect(isFutureDate("2026-09-16")).toBe(false);
  });
});

describe("isValidDateString", () => {
  it("accepts a well-formed YYYY-MM-DD string", () => {
    expect(isValidDateString("2026-09-17")).toBe(true);
  });

  it.each(["2026-9-17", "20260917", "", "2026/09/17", "17-09-2026"])(
    "rejects malformed shape %s",
    (value) => {
      expect(isValidDateString(value)).toBe(false);
    },
  );

  it("does NOT validate calendar validity — a shape-valid but impossible date still passes", () => {
    // Documented (not accidental): resolvePuzzleDate/route validation rely only on shape here,
    // combined separately with lib/game/selection.ts's isKnownPuzzleDate.
    expect(isValidDateString("2026-13-40")).toBe(true);
  });
});

describe("formatHeaderDate", () => {
  it("formats with Dutch month abbreviations and no zero-padded day", () => {
    expect(formatHeaderDate("2026-09-17")).toBe("17 SEP");
    expect(formatHeaderDate("2026-03-01")).toBe("1 MRT");
    expect(formatHeaderDate("2026-12-25")).toBe("25 DEC");
  });
});

describe("msUntilNextAmsterdamMidnight", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("computes the exact remaining time from mid-day", () => {
    // 12:00 UTC = 14:00 CEST on 2026-09-17; next Amsterdam midnight is 22:00 UTC same day.
    const now = new Date("2026-09-17T12:00:00Z");
    vi.setSystemTime(now);
    expect(msUntilNextAmsterdamMidnight(now)).toBe(10 * 60 * 60 * 1000);
  });

  it("returns the full next day right at a midnight boundary", () => {
    // 22:00:00.000Z is exactly 00:00:00 CEST on 2026-09-18 — the *next* midnight is 24h away.
    const now = new Date("2026-09-17T22:00:00Z");
    vi.setSystemTime(now);
    expect(msUntilNextAmsterdamMidnight(now)).toBe(24 * 60 * 60 * 1000);
  });

  it("returns a small value one minute before a midnight boundary", () => {
    const now = new Date("2026-09-17T21:59:00Z");
    vi.setSystemTime(now);
    expect(msUntilNextAmsterdamMidnight(now)).toBe(60 * 1000);
  });
});

describe("resolvePuzzleDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-17T12:00:00Z"));
  });

  it("defaults to today when no param is given", () => {
    expect(resolvePuzzleDate(null)).toBe("2026-09-17");
  });

  it("rejects a malformed date string", () => {
    expect(resolvePuzzleDate("not-a-date")).toBeNull();
  });

  it("rejects a future date", () => {
    expect(resolvePuzzleDate("2026-09-18")).toBeNull();
  });

  it("passes through today", () => {
    expect(resolvePuzzleDate("2026-09-17")).toBe("2026-09-17");
  });

  it("passes through a valid past date", () => {
    expect(resolvePuzzleDate("2026-09-10")).toBe("2026-09-10");
  });
});
