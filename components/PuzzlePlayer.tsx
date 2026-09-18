"use client";

import { ConsentBanner } from "@/components/ConsentBanner";
import { ConsentBannerBoundary } from "@/components/ConsentBannerBoundary";
import { Countdown } from "@/components/Countdown";
import { EndScreen } from "@/components/EndScreen";
import { GameHeader } from "@/components/GameHeader";
import { GuessInput } from "@/components/GuessInput";
import { GuessTable } from "@/components/GuessTable";
import { PuzzlePhoto } from "@/components/PuzzlePhoto";
import { ResultModal } from "@/components/ResultModal";
import { MAX_GUESSES } from "@/lib/game/guess-progress";
import { deriveDisplayStats } from "@/lib/game/streak";
import { useGameState } from "@/lib/hooks/useGameState";
import { usePuzzleData } from "@/lib/hooks/usePuzzleData";

interface PuzzlePlayerProps {
  /** A specific past date (archive replay, FR-016). Omit to play today's puzzle. */
  date?: string;
}

/**
 * The full guess/hint/reveal loop, shared by the home page (today's puzzle) and archive replay
 * pages (any past, uncompleted date) — US1 and US4. Winning via a non-today date is never
 * streak-eligible (FR-014's "no catch-up" rule): only the plain `/` route can extend a streak.
 */
export function PuzzlePlayer({ date: dateProp }: PuzzlePlayerProps) {
  const isArchive = dateProp !== undefined;
  const { puzzle } = usePuzzleData(dateProp);
  const {
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
  } = useGameState({ date: puzzle?.date, isArchive });

  if (!puzzle || !state) {
    return <p className="loading">Laden…</p>;
  }

  const date = puzzle.date;
  const display = deriveDisplayStats(state.stats);
  // Consent only ever gates the optional analytics call (hasAnalyticsConsent in useGameState) —
  // per US2 (spec.md) the game itself "works exactly the same" whether or not a choice has been
  // made, so this must never disable gameplay (a consent-blocking browser extension that removes
  // the banner without ever calling onDecide would otherwise soft-lock the whole game).
  const needsConsent = !isArchive && state.consent === null;

  const content =
    status !== "in-progress" && reveal ? (
      <>
        <GameHeader date={date} />
        <div className="screen">
          <EndScreen
            date={puzzle.date}
            imageUrl={puzzle.imageUrl}
            imageCredit={puzzle.imageCredit}
            status={status}
            guessCount={guesses.length}
            guesses={guesses.map((g) => ({ cityId: g.cityId, ...g.hints }))}
            reveal={reveal}
          />
        </div>
      </>
    ) : (
      <>
        <GameHeader date={date} />
        <div className="screen">
          <PuzzlePhoto
            imageUrl={puzzle.imageUrl}
            credit={puzzle.imageCredit.owner}
            alt="Onbekende Nederlandse stad"
          />
          <p className="guess-prompt">In welk stadje is dit?</p>
          <GuessInput
            onSelect={submitGuess}
            disabled={submitting}
            guessCount={guesses.length}
            maxGuesses={MAX_GUESSES}
          />
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <GuessTable
            guesses={guesses.map((g) => ({ cityId: g.cityId, ...g.hints }))}
            maxGuesses={MAX_GUESSES}
          />
          {!isArchive && <Countdown />}
        </div>
      </>
    );

  return (
    <>
      {content}
      {needsConsent && (
        <ConsentBannerBoundary>
          <ConsentBanner onDecide={recordConsentDecision} />
        </ConsentBannerBoundary>
      )}
      {justFinished && status !== "in-progress" && reveal && (
        <ResultModal
          status={status}
          guessCount={guesses.length}
          reveal={reveal}
          stats={{
            totalPlayed: state.stats.totalPlayed,
            percentCorrect: display.percentCorrect,
            currentStreak: state.stats.currentStreak,
            averageGuesses: display.averageGuesses,
          }}
          attemptsDistribution={state.stats.attemptsDistribution}
          onClose={dismissResult}
        />
      )}
    </>
  );
}
