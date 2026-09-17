"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ConsentBanner } from "@/components/ConsentBanner";
import { ConsentBannerBoundary } from "@/components/ConsentBannerBoundary";
import { EndScreen } from "@/components/EndScreen";
import { GuessInput } from "@/components/GuessInput";
import { GuessTable } from "@/components/GuessTable";
import { NavMenu } from "@/components/NavMenu";
import type { City, CityReveal } from "@/lib/cities";
import { hasAnalyticsConsent, recordConsent } from "@/lib/consent";
import type { GuessHints } from "@/lib/game/hints";
import { deriveDisplayStats, recomputeStats } from "@/lib/game/streak";
import { puzzleNumber } from "@/lib/launch-date";
import {
  type LocalGameState,
  loadState,
  type StoredGuess,
  saveState,
} from "@/lib/local-storage";
import { formatHeaderDate } from "@/lib/time";

interface PuzzleResponse {
  date: string;
  imageUrl: string;
  imageCredit: { owner: string; license: string };
}

interface GuessApiResponse {
  cityId: string;
  displayName: string;
  correct: boolean;
  hints: GuessHints;
  reveal?: CityReveal;
}

const MAX_GUESSES = 6;

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
  const [puzzle, setPuzzle] = useState<PuzzleResponse | null>(null);
  const [state, setState] = useState<LocalGameState | null>(null);
  const [reveal, setReveal] = useState<CityReveal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const url = dateProp ? `/api/puzzle?date=${dateProp}` : "/api/puzzle";
    fetch(url)
      .then((r) => r.json())
      .then((data: PuzzleResponse) => setPuzzle(data));
    setState(loadState());
  }, [dateProp]);

  const date = puzzle?.date;
  const entry = date && state ? state.puzzles[date] : undefined;
  const guesses: StoredGuess[] = entry?.guesses ?? [];
  const status = entry?.status ?? "in-progress";
  const guessedCityIds = new Set(guesses.map((g) => g.cityId));

  useEffect(() => {
    if (!date || status === "in-progress") return;
    if (reveal) return;
    fetch(`/api/puzzle/reveal?date=${date}`)
      .then((r) => r.json())
      .then((data: CityReveal) => setReveal(data));
  }, [date, status, reveal]);

  async function handleGuess(city: City) {
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

      const newGuess: StoredGuess = {
        cityId: data.cityId,
        order: guesses.length + 1,
        hints: data.hints,
      };
      const nextGuesses = [...guesses, newGuess];
      const won = data.correct;
      const lost = !won && nextGuesses.length >= MAX_GUESSES;
      const nextStatus = won ? "won" : lost ? "lost" : "in-progress";

      let revealData = won ? data.reveal : undefined;
      if (lost) {
        revealData = await fetch(`/api/puzzle/reveal?date=${date}`).then((r) =>
          r.json(),
        );
      }

      const nextPuzzles = {
        ...state.puzzles,
        [date]: {
          status: nextStatus as "won" | "lost" | "in-progress",
          // "no catch-up" (FR-014): only a win on the live "/" route (not archive) counts.
          streakEligible: won && !isArchive,
          guesses: nextGuesses,
          answerProvince: revealData?.province,
        },
      };
      const nextStats = recomputeStats(nextPuzzles, date);
      const nextState: LocalGameState = {
        ...state,
        puzzles: nextPuzzles,
        stats: nextStats,
      };
      saveState(nextState);
      setState(nextState);
      if (revealData) setReveal(revealData);

      // FR-024: only ever submitted when the player has explicitly opted in (FR-017); never
      // includes a player identifier — just the anonymous outcome for this date.
      if ((won || lost) && hasAnalyticsConsent(nextState)) {
        fetch("/api/world-stats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date,
            won,
            guessCount: nextGuesses.length,
            firstGuessCityId: nextGuesses[0].cityId,
          }),
        }).catch(() => {
          // Fire-and-forget (research.md) — a failed submission isn't shown to the player.
        });
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!puzzle || !state) {
    return <p className="loading">Laden…</p>;
  }

  const display = deriveDisplayStats(state.stats);
  // Consent only ever gates the optional analytics call (hasAnalyticsConsent below) — per US2
  // (spec.md) the game itself "works exactly the same" whether or not a choice has been made, so
  // this must never disable gameplay (a consent-blocking browser extension that removes the
  // banner without ever calling onDecide would otherwise soft-lock the whole game).
  const needsConsent = !isArchive && state.consent === null;

  const content =
    status !== "in-progress" && reveal ? (
      <>
        <Header date={date} />
        <div className="screen">
          <EndScreen
            date={puzzle.date}
            imageUrl={puzzle.imageUrl}
            imageCredit={puzzle.imageCredit}
            status={status}
            guessCount={guesses.length}
            guesses={guesses.map((g) => ({ cityId: g.cityId, ...g.hints }))}
            reveal={reveal}
            stats={{
              totalPlayed: state.stats.totalPlayed,
              percentCorrect: display.percentCorrect,
              currentStreak: state.stats.currentStreak,
              averageGuesses: display.averageGuesses,
            }}
          />
        </div>
      </>
    ) : (
      <>
        <Header date={date} />
        <div className="screen">
          <div className="puzzle-photo">
            <Image
              src={puzzle.imageUrl}
              alt="Onbekende Nederlandse stad"
              fill
              sizes="430px"
            />
            <p className="puzzle-photo__credit">
              Foto: {puzzle.imageCredit.owner}
            </p>
          </div>
          <p className="guess-count">
            {guesses.length}/{MAX_GUESSES}
          </p>
          <GuessInput onSelect={handleGuess} disabled={submitting} />
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <GuessTable
            guesses={guesses.map((g) => ({ cityId: g.cityId, ...g.hints }))}
          />
          {!isArchive && (
            <p className="next-puzzle-note">Nieuw stadje om 00:00</p>
          )}
        </div>
      </>
    );

  return (
    <>
      {content}
      {needsConsent && (
        <ConsentBannerBoundary>
          <ConsentBanner
            onDecide={(analyticsOptIn) => {
              const nextState = recordConsent(state, analyticsOptIn);
              saveState(nextState);
              setState(nextState);
            }}
          />
        </ConsentBannerBoundary>
      )}
    </>
  );
}

function Header({ date }: { date?: string }) {
  return (
    <header className="app-header">
      <a
        href="/how-it-works"
        className="icon-button"
        aria-label="Hoe werkt Stadje?"
      >
        ?
      </a>
      <div className="app-header__title">
        <span>Stadje</span>
        {date && (
          <span className="app-header__date">
            NR. {puzzleNumber(date)} · {formatHeaderDate(date)}
          </span>
        )}
      </div>
      <NavMenu />
    </header>
  );
}
