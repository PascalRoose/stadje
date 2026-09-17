import { describe, expect, it } from "vitest";
import { recomputeStats } from "@/lib/game/streak";
import type { StoredPuzzle } from "@/lib/local-storage";
import { LAUNCH_DATE } from "@/scripts/generate-puzzle-cycle";

function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

const DAY0 = LAUNCH_DATE;
const DAY1 = addDays(LAUNCH_DATE, 1);
const DAY2 = addDays(LAUNCH_DATE, 2);
const DAY3 = addDays(LAUNCH_DATE, 3);

function won(guessCount: number, streakEligible = true): StoredPuzzle {
  return {
    status: "won",
    streakEligible,
    guesses: Array.from({ length: guessCount }, (_, i) => ({
      cityId: "x",
      order: i + 1,
      hints: {
        province: {
          match: i === guessCount - 1,
          tier: i === guessCount - 1 ? ("green" as const) : ("red" as const),
        },
        population: { direction: "equal" as const, tier: "green" as const },
        distance: {
          km: i === guessCount - 1 ? 0 : 50,
          direction: null,
          tier: "green" as const,
        },
      },
    })),
  };
}

function lost(): StoredPuzzle {
  return {
    status: "lost",
    streakEligible: false,
    guesses: Array.from({ length: 6 }, (_, i) => ({
      cityId: "x",
      order: i + 1,
      hints: {
        province: { match: false, tier: "red" as const },
        population: { direction: "equal" as const, tier: "red" as const },
        distance: { km: 100, direction: "N" as const, tier: "red" as const },
      },
    })),
  };
}

function inProgress(): StoredPuzzle {
  return { status: "in-progress", streakEligible: false, guesses: [] };
}

describe("recomputeStats — win/loss counting", () => {
  it("counts a win toward totalPlayed and the attempts distribution", () => {
    const stats = recomputeStats({ [DAY0]: won(4) }, DAY0);
    expect(stats.totalPlayed).toBe(1);
    expect(stats.attemptsDistribution["4"]).toBe(1);
  });

  it("counts a 6-guess loss toward totalPlayed under X, not toward streak", () => {
    const stats = recomputeStats({ [DAY0]: lost() }, DAY0);
    expect(stats.totalPlayed).toBe(1);
    expect(stats.attemptsDistribution.X).toBe(1);
    expect(stats.currentStreak).toBe(0);
  });

  it("does not count today's still-in-progress puzzle toward totalPlayed", () => {
    const stats = recomputeStats({ [DAY0]: inProgress() }, DAY0);
    expect(stats.totalPlayed).toBe(0);
  });

  it("counts a rolled-over (in-progress, not today) puzzle as played but not won", () => {
    const stats = recomputeStats({ [DAY0]: inProgress() }, DAY1);
    expect(stats.totalPlayed).toBe(1);
    expect(stats.attemptsDistribution.X).toBe(1);
    expect(stats.currentStreak).toBe(0);
  });
});

describe("recomputeStats — streak", () => {
  it("builds a streak across consecutive same-day wins", () => {
    const stats = recomputeStats(
      { [DAY0]: won(2), [DAY1]: won(3), [DAY2]: won(1) },
      DAY2,
    );
    expect(stats.currentStreak).toBe(3);
    expect(stats.longestStreak).toBe(3);
  });

  it("resets the streak on a loss", () => {
    const stats = recomputeStats(
      { [DAY0]: won(2), [DAY1]: lost(), [DAY2]: won(1) },
      DAY2,
    );
    expect(stats.currentStreak).toBe(1);
    expect(stats.longestStreak).toBe(1);
  });

  it('"no catch-up": winning a rolled-over puzzle later via the archive never extends the streak', () => {
    // DAY0 won on time, DAY1 missed then later won via archive (streakEligible: false),
    // DAY2 won on time. Because DAY1 isn't streak-eligible, it must NOT bridge DAY0 and DAY2.
    const stats = recomputeStats(
      { [DAY0]: won(2, true), [DAY1]: won(5, false), [DAY2]: won(1, true) },
      DAY2,
    );
    expect(stats.currentStreak).toBe(1); // only DAY2
    expect(stats.longestStreak).toBe(1);
    // But it still counts toward played/attempts, per FR-014.
    expect(stats.totalPlayed).toBe(3);
    expect(stats.attemptsDistribution["5"]).toBe(1);
  });

  it("a catch-up win updates provinceAccuracy/totalPlayed without affecting streak, across a gap", () => {
    const withoutCatchup = recomputeStats(
      { [DAY0]: won(1, true), [DAY3]: won(1, true) },
      DAY3,
    );
    expect(withoutCatchup.currentStreak).toBe(1); // DAY1/DAY2 gap breaks it

    const withCatchup = recomputeStats(
      { [DAY0]: won(1, true), [DAY1]: won(6, false), [DAY3]: won(1, true) },
      DAY3,
    );
    expect(withCatchup.currentStreak).toBe(1); // still just DAY3 — DAY1 catch-up doesn't bridge
    expect(withCatchup.totalPlayed).toBe(3);
  });
});

describe("recomputeStats — purity", () => {
  it("does not mutate its input", () => {
    const puzzles = { [DAY0]: won(3) };
    const snapshot = JSON.stringify(puzzles);
    recomputeStats(puzzles, DAY0);
    expect(JSON.stringify(puzzles)).toBe(snapshot);
  });
});
