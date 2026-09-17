import { describe, expect, it } from "vitest";
import { hasAnalyticsConsent } from "@/lib/consent";
import {
  applyCompletion,
  deriveWorldStatsDisplay,
  emptyWorldStatsRow,
  isValidCompletionSubmission,
} from "@/lib/game/world-stats";
import { emptyState } from "@/lib/local-storage";

const DATE = "2026-09-17";

describe("world stats — consent gate (FR-024, SC-008)", () => {
  it("a declined/undecided player's local state would never trigger a submission", () => {
    // components/PuzzlePlayer.tsx only calls POST /api/world-stats when this is true — a
    // declined or undecided player's completion therefore never reaches applyCompletion at all.
    expect(hasAnalyticsConsent(emptyState())).toBe(false);
  });
});

describe("world stats — aggregate counters (US6)", () => {
  it("increments playersCount and correctCount on a win, leaves them for a loss", () => {
    let row = emptyWorldStatsRow(DATE);
    row = applyCompletion(row, {
      won: true,
      guessCount: 3,
      firstGuessCityId: "utrecht",
    });
    expect(row.playersCount).toBe(1);
    expect(row.correctCount).toBe(1);
    expect(row.guessesSum).toBe(3);

    row = applyCompletion(row, {
      won: false,
      guessCount: 6,
      firstGuessCityId: "rotterdam",
    });
    expect(row.playersCount).toBe(2);
    expect(row.correctCount).toBe(1); // unchanged — the loss doesn't count as correct
    expect(row.guessesSum).toBe(3); // unchanged — only winners' guess counts sum
  });

  it("tracks the fastest solve among winners only", () => {
    let row = emptyWorldStatsRow(DATE);
    row = applyCompletion(row, {
      won: true,
      guessCount: 4,
      firstGuessCityId: "a",
    });
    row = applyCompletion(row, {
      won: true,
      guessCount: 1,
      firstGuessCityId: "b",
    });
    row = applyCompletion(row, {
      won: false,
      guessCount: 6,
      firstGuessCityId: "c",
    });
    expect(row.fastestSolveGuesses).toBe(1);
  });

  it("tallies first guesses per city, independent of the puzzle's outcome", () => {
    let row = emptyWorldStatsRow(DATE);
    row = applyCompletion(row, {
      won: true,
      guessCount: 1,
      firstGuessCityId: "utrecht",
    });
    row = applyCompletion(row, {
      won: false,
      guessCount: 6,
      firstGuessCityId: "utrecht",
    });
    row = applyCompletion(row, {
      won: true,
      guessCount: 2,
      firstGuessCityId: "rotterdam",
    });
    expect(row.firstGuessTally).toEqual({ utrecht: 2, rotterdam: 1 });
  });

  it("never mutates the row passed in", () => {
    const row = emptyWorldStatsRow(DATE);
    const snapshot = JSON.stringify(row);
    applyCompletion(row, {
      won: true,
      guessCount: 1,
      firstGuessCityId: "utrecht",
    });
    expect(JSON.stringify(row)).toBe(snapshot);
  });
});

describe("world stats — display derivation", () => {
  it('shows "insufficient data" below the minimum player threshold', () => {
    let row = emptyWorldStatsRow(DATE);
    for (let i = 0; i < 4; i++) {
      row = applyCompletion(row, {
        won: true,
        guessCount: 3,
        firstGuessCityId: "utrecht",
      });
    }
    const display = deriveWorldStatsDisplay(row);
    expect(display).toEqual({ date: DATE, insufficientData: true });
  });

  it("computes percentage, average, most common first guess, and fastest solve once enough data exists", () => {
    let row = emptyWorldStatsRow(DATE);
    const submissions = [
      { won: true, guessCount: 2, firstGuessCityId: "utrecht" },
      { won: true, guessCount: 4, firstGuessCityId: "utrecht" },
      { won: false, guessCount: 6, firstGuessCityId: "rotterdam" },
      { won: true, guessCount: 1, firstGuessCityId: "utrecht" },
      { won: false, guessCount: 6, firstGuessCityId: "amsterdam" },
    ];
    for (const s of submissions) row = applyCompletion(row, s);

    const display = deriveWorldStatsDisplay(row);
    expect(display).toMatchObject({
      date: DATE,
      playersCount: 5,
      correctPercentage: 60, // 3/5
      mostCommonFirstGuessCityId: "utrecht",
      fastestSolveGuesses: 1,
    });
  });
});

describe("isValidCompletionSubmission", () => {
  it("accepts a well-formed submission", () => {
    expect(
      isValidCompletionSubmission({
        won: true,
        guessCount: 3,
        firstGuessCityId: "utrecht",
      }),
    ).toBe(true);
  });

  it("rejects guessCount outside 1-6", () => {
    expect(
      isValidCompletionSubmission({
        won: true,
        guessCount: 0,
        firstGuessCityId: "utrecht",
      }),
    ).toBe(false);
    expect(
      isValidCompletionSubmission({
        won: true,
        guessCount: 7,
        firstGuessCityId: "utrecht",
      }),
    ).toBe(false);
  });

  it("rejects a missing firstGuessCityId", () => {
    expect(isValidCompletionSubmission({ won: true, guessCount: 3 })).toBe(
      false,
    );
  });
});
