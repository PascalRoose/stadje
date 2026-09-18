import type { GuessHints } from "@/lib/game/hints";
import { recomputeStats } from "@/lib/game/streak";
import type {
  LocalGameState,
  PuzzleStatus,
  StoredGuess,
} from "@/lib/local-storage";

// The constitution's fixed 6-guess rule (Principle II) — single source of truth, shared by the
// win/loss decision below and every component that renders a guess count against it.
export const MAX_GUESSES = 6;

export interface GuessResult {
  cityId: string;
  hints: GuessHints;
  correct: boolean;
}

export interface GuessProgress {
  nextGuesses: StoredGuess[];
  won: boolean;
  lost: boolean;
  nextStatus: PuzzleStatus;
}

/**
 * Pure decision logic for one guess: appends it to the history and derives win/loss. No I/O —
 * kept separate from useGameState so it gets the same fast, dependency-free unit testing
 * lib/game/streak.ts already has, closing the gap where this logic used to be untested inline
 * inside components/PuzzlePlayer.tsx's handleGuess.
 */
export function computeGuessProgress(params: {
  guesses: StoredGuess[];
  guessResult: GuessResult;
}): GuessProgress {
  const { guesses, guessResult } = params;
  const newGuess: StoredGuess = {
    cityId: guessResult.cityId,
    order: guesses.length + 1,
    hints: guessResult.hints,
  };
  const nextGuesses = [...guesses, newGuess];
  const won = guessResult.correct;
  const lost = !won && nextGuesses.length >= MAX_GUESSES;
  const nextStatus: PuzzleStatus = won ? "won" : lost ? "lost" : "in-progress";

  return { nextGuesses, won, lost, nextStatus };
}

/**
 * Folds a finished-or-still-in-progress guess into the player's persisted state, recomputing
 * derived stats (streak, distribution, province accuracy) along the way. Pure — never mutates
 * `state`, never touches storage or the network.
 */
export function applyPuzzleResult(params: {
  state: LocalGameState;
  date: string;
  isArchive: boolean;
  nextGuesses: StoredGuess[];
  nextStatus: PuzzleStatus;
  won: boolean;
  answerProvince?: string;
}): LocalGameState {
  const {
    state,
    date,
    isArchive,
    nextGuesses,
    nextStatus,
    won,
    answerProvince,
  } = params;

  const nextPuzzles = {
    ...state.puzzles,
    [date]: {
      status: nextStatus,
      // "no catch-up" (FR-014): only a win on the live "/" route (not archive) counts.
      streakEligible: won && !isArchive,
      guesses: nextGuesses,
      answerProvince,
    },
  };
  const nextStats = recomputeStats(nextPuzzles, date);

  return {
    ...state,
    puzzles: nextPuzzles,
    stats: nextStats,
  };
}
