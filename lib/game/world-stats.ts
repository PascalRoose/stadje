/**
 * Pure aggregate-counter logic for FR-024/US6 — no per-completion row is ever stored
 * (research.md's "pure aggregate counters" decision). The route handlers (app/api/world-stats)
 * are a thin I/O layer around these functions; keeping the logic here makes it testable without a
 * live Neon connection.
 */

export interface WorldStatsRow {
  date: string;
  playersCount: number;
  correctCount: number;
  guessesSum: number;
  fastestSolveGuesses: number | null;
  firstGuessTally: Record<string, number>;
}

export function emptyWorldStatsRow(date: string): WorldStatsRow {
  return {
    date,
    playersCount: 0,
    correctCount: 0,
    guessesSum: 0,
    fastestSolveGuesses: null,
    firstGuessTally: {},
  };
}

export interface CompletionSubmission {
  won: boolean;
  guessCount: number; // 1..6
  firstGuessCityId: string;
}

export function isValidCompletionSubmission(s: {
  won?: unknown;
  guessCount?: unknown;
  firstGuessCityId?: unknown;
}): s is CompletionSubmission {
  return (
    typeof s.won === "boolean" &&
    typeof s.guessCount === "number" &&
    Number.isInteger(s.guessCount) &&
    s.guessCount >= 1 &&
    s.guessCount <= 6 &&
    typeof s.firstGuessCityId === "string" &&
    s.firstGuessCityId.length > 0
  );
}

/** Increments a day's aggregate counters with one anonymous, opted-in completion. */
export function applyCompletion(
  current: WorldStatsRow,
  submission: CompletionSubmission,
): WorldStatsRow {
  return {
    ...current,
    playersCount: current.playersCount + 1,
    correctCount: current.correctCount + (submission.won ? 1 : 0),
    guessesSum:
      current.guessesSum + (submission.won ? submission.guessCount : 0),
    fastestSolveGuesses: submission.won
      ? current.fastestSolveGuesses === null
        ? submission.guessCount
        : Math.min(current.fastestSolveGuesses, submission.guessCount)
      : current.fastestSolveGuesses,
    firstGuessTally: {
      ...current.firstGuessTally,
      [submission.firstGuessCityId]:
        (current.firstGuessTally[submission.firstGuessCityId] ?? 0) + 1,
    },
  };
}

// Below this many opted-in completions, showing a percentage/average would be misleading
// (spec edge case) — an implementation detail, not a spec-level number.
const MIN_PLAYERS_FOR_DISPLAY = 5;

export type WorldStatsDisplay =
  | { date: string; insufficientData: true }
  | {
      date: string;
      playersCount: number;
      correctPercentage: number;
      averageGuesses: number;
      mostCommonFirstGuessCityId: string | null;
      fastestSolveGuesses: number | null;
    };

export function deriveWorldStatsDisplay(row: WorldStatsRow): WorldStatsDisplay {
  if (row.playersCount < MIN_PLAYERS_FOR_DISPLAY) {
    return { date: row.date, insufficientData: true };
  }

  let mostCommonFirstGuessCityId: string | null = null;
  let maxCount = 0;
  for (const [cityId, count] of Object.entries(row.firstGuessTally)) {
    if (count > maxCount) {
      maxCount = count;
      mostCommonFirstGuessCityId = cityId;
    }
  }

  return {
    date: row.date,
    playersCount: row.playersCount,
    correctPercentage: Math.round((row.correctCount / row.playersCount) * 100),
    averageGuesses:
      row.correctCount > 0
        ? Math.round((row.guessesSum / row.correctCount) * 10) / 10
        : 0,
    mostCommonFirstGuessCityId,
    fastestSolveGuesses: row.fastestSolveGuesses,
  };
}
