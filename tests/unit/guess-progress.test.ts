import { describe, expect, it } from "vitest";
import {
  applyPuzzleResult,
  computeGuessProgress,
  MAX_GUESSES,
} from "@/lib/game/guess-progress";
import type { GuessHints } from "@/lib/game/hints";
import { emptyState, type StoredGuess } from "@/lib/local-storage";

const DATE = "2026-09-17";

const GREEN_HINTS: GuessHints = {
  province: { match: true, tier: "green" },
  population: { direction: "equal", tier: "green" },
  distance: { km: 0, direction: null, tier: "green" },
};

const MISS_HINTS: GuessHints = {
  province: { match: false, tier: "red" },
  population: { direction: "higher", tier: "red" },
  distance: { km: 200, direction: "N", tier: "red" },
};

function missGuesses(count: number): StoredGuess[] {
  return Array.from({ length: count }, (_, i) => ({
    cityId: `wrong-${i}`,
    order: i + 1,
    hints: MISS_HINTS,
  }));
}

describe("computeGuessProgress — pure win/loss decision (constitution Principle II/III)", () => {
  it("appends the guess and marks a correct answer as won, regardless of guess count", () => {
    const { nextGuesses, won, lost, nextStatus } = computeGuessProgress({
      guesses: missGuesses(2),
      guessResult: { cityId: "utrecht", hints: GREEN_HINTS, correct: true },
    });
    expect(nextGuesses).toHaveLength(3);
    expect(nextGuesses[2]).toEqual({
      cityId: "utrecht",
      order: 3,
      hints: GREEN_HINTS,
    });
    expect(won).toBe(true);
    expect(lost).toBe(false);
    expect(nextStatus).toBe("won");
  });

  it("stays in-progress on a miss below MAX_GUESSES", () => {
    const { won, lost, nextStatus } = computeGuessProgress({
      guesses: missGuesses(2),
      guessResult: { cityId: "wrong", hints: MISS_HINTS, correct: false },
    });
    expect(won).toBe(false);
    expect(lost).toBe(false);
    expect(nextStatus).toBe("in-progress");
  });

  it(`marks a miss as lost exactly at the ${MAX_GUESSES}th guess, never earlier`, () => {
    // The 5th miss (of 6 max) must still be in-progress.
    const stillPlaying = computeGuessProgress({
      guesses: missGuesses(4),
      guessResult: { cityId: "wrong", hints: MISS_HINTS, correct: false },
    });
    expect(stillPlaying.lost).toBe(false);
    expect(stillPlaying.nextStatus).toBe("in-progress");

    // The 6th miss must be lost.
    const finalMiss = computeGuessProgress({
      guesses: missGuesses(MAX_GUESSES - 1),
      guessResult: { cityId: "wrong", hints: MISS_HINTS, correct: false },
    });
    expect(finalMiss.lost).toBe(true);
    expect(finalMiss.nextStatus).toBe("lost");
    expect(finalMiss.nextGuesses).toHaveLength(MAX_GUESSES);
  });

  it("a correct guess on the very last attempt is a win, not a loss", () => {
    const { won, lost, nextStatus } = computeGuessProgress({
      guesses: missGuesses(MAX_GUESSES - 1),
      guessResult: { cityId: "utrecht", hints: GREEN_HINTS, correct: true },
    });
    expect(won).toBe(true);
    expect(lost).toBe(false);
    expect(nextStatus).toBe("won");
  });
});

describe("applyPuzzleResult — persisted-state fold (pure, never mutates input)", () => {
  it("marks a live win as streak-eligible, an archive win as not (FR-014 no catch-up)", () => {
    const state = emptyState();
    const { nextGuesses, nextStatus } = computeGuessProgress({
      guesses: [],
      guessResult: { cityId: "utrecht", hints: GREEN_HINTS, correct: true },
    });

    const live = applyPuzzleResult({
      state,
      date: DATE,
      isArchive: false,
      nextGuesses,
      nextStatus,
      won: true,
      answerProvince: "Utrecht",
    });
    expect(live.puzzles[DATE].streakEligible).toBe(true);

    const archive = applyPuzzleResult({
      state,
      date: DATE,
      isArchive: true,
      nextGuesses,
      nextStatus,
      won: true,
      answerProvince: "Utrecht",
    });
    expect(archive.puzzles[DATE].streakEligible).toBe(false);
  });

  it("recomputes stats.totalPlayed and never mutates the input state", () => {
    const state = emptyState();
    const snapshot = JSON.stringify(state);
    const { nextGuesses, nextStatus } = computeGuessProgress({
      guesses: missGuesses(MAX_GUESSES - 1),
      guessResult: { cityId: "wrong", hints: MISS_HINTS, correct: false },
    });

    const next = applyPuzzleResult({
      state,
      date: DATE,
      isArchive: false,
      nextGuesses,
      nextStatus,
      won: false,
      answerProvince: "Utrecht",
    });

    expect(next.stats.totalPlayed).toBe(1);
    expect(next.puzzles[DATE].status).toBe("lost");
    expect(JSON.stringify(state)).toBe(snapshot);
  });
});
