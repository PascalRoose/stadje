import { useEffect, useState } from "react";
import type { City, CityReveal } from "@/lib/cities";
import { hasAnalyticsConsent, recordConsent } from "@/lib/consent";
import {
  applyPuzzleResult,
  computeGuessProgress,
} from "@/lib/game/guess-progress";
import type { GuessHints } from "@/lib/game/hints";
import {
  type LocalGameState,
  loadState,
  type PuzzleStatus,
  type StoredGuess,
  saveState,
} from "@/lib/local-storage";
import { submitWorldStatsCompletion } from "@/lib/world-stats-client";

interface GuessApiResponse {
  cityId: string;
  displayName: string;
  correct: boolean;
  hints: GuessHints;
  reveal?: CityReveal;
}

interface UseGameStateParams {
  /** The puzzle's own date, once known (from usePuzzleData) — guessing is disabled until set. */
  date?: string;
  isArchive: boolean;
}

/**
 * Orchestrates one puzzle's guess/hint/reveal loop: persisted state, in-flight submission, and
 * the analytics beacon. The win/loss decision itself lives in lib/game/guess-progress.ts (pure,
 * unit-tested); this hook is the thin I/O layer around it.
 */
export function useGameState({ date, isArchive }: UseGameStateParams) {
  const [state, setState] = useState<LocalGameState | null>(null);
  const [reveal, setReveal] = useState<CityReveal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Only true right after the guess that ends the puzzle THIS session — never on a reload of an
  // already-finished puzzle, so the result popup shows exactly once, "upon the final guess".
  const [justFinished, setJustFinished] = useState(false);

  useEffect(() => {
    setState(loadState());
  }, []);

  const entry = date && state ? state.puzzles[date] : undefined;
  const guesses: StoredGuess[] = entry?.guesses ?? [];
  const status: PuzzleStatus = entry?.status ?? "in-progress";
  const guessedCityIds = new Set(guesses.map((g) => g.cityId));

  useEffect(() => {
    if (!date || status === "in-progress") return;
    if (reveal) return;
    fetch(`/api/puzzle/reveal?date=${date}`)
      .then((r) => r.json())
      .then((data: CityReveal) => setReveal(data));
  }, [date, status, reveal]);

  async function submitGuess(city: City) {
    if (!date || !state || submitting) return;
    if (guessedCityIds.has(city.id)) {
      setError(`Je hebt ${city.name} al geprobeerd — kies een ander stadje.`);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/puzzle/guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, cityId: city.id }),
      });
      const data = (await res.json()) as GuessApiResponse;
      if (!res.ok) {
        setError("Er ging iets mis — probeer het opnieuw.");
        return;
      }

      const { nextGuesses, won, lost, nextStatus } = computeGuessProgress({
        guesses,
        guessResult: {
          cityId: data.cityId,
          hints: data.hints,
          correct: data.correct,
        },
      });

      let revealData = won ? data.reveal : undefined;
      if (lost) {
        revealData = await fetch(`/api/puzzle/reveal?date=${date}`).then((r) =>
          r.json(),
        );
      }

      const nextState = applyPuzzleResult({
        state,
        date,
        isArchive,
        nextGuesses,
        nextStatus,
        won,
        answerProvince: revealData?.province,
      });
      saveState(nextState);
      setState(nextState);
      if (revealData) setReveal(revealData);
      if (won || lost) setJustFinished(true);

      // FR-024: only ever submitted when the player has explicitly opted in (FR-017); never
      // includes a player identifier — just the anonymous outcome for this date.
      if ((won || lost) && hasAnalyticsConsent(nextState)) {
        submitWorldStatsCompletion({
          date,
          won,
          guessCount: nextGuesses.length,
          firstGuessCityId: nextGuesses[0].cityId,
        });
      }
    } finally {
      setSubmitting(false);
    }
  }

  function dismissResult() {
    setJustFinished(false);
  }

  function recordConsentDecision(analyticsOptIn: boolean) {
    if (!state) return;
    const nextState = recordConsent(state, analyticsOptIn);
    saveState(nextState);
    setState(nextState);
  }

  return {
    state,
    guesses,
    status,
    reveal,
    submitting,
    error,
    justFinished,
    submitGuess,
    dismissResult,
    recordConsentDecision,
  };
}
