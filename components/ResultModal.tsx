"use client";

import { useEffect } from "react";
import { AttemptsDistribution } from "@/components/AttemptsDistribution";
import type { CityReveal } from "@/lib/cities";
import type { StoredStats } from "@/lib/local-storage";

export interface ResultModalStats {
  totalPlayed: number;
  percentCorrect: number;
  currentStreak: number;
  averageGuesses: number;
}

interface ResultModalProps {
  status: "won" | "lost";
  guessCount: number;
  reveal: CityReveal;
  stats: ResultModalStats;
  attemptsDistribution: StoredStats["attemptsDistribution"];
  onClose: () => void;
}

// Shown once, right when the final guess finishes the puzzle — the result plus the same stats
// and guess-distribution histogram as app/stats/page.tsx (via the shared AttemptsDistribution).
// EndScreen itself (the board underneath) stays free of stats now.
export function ResultModal({
  status,
  guessCount,
  reveal,
  stats,
  attemptsDistribution,
  onClose,
}: ResultModalProps) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <>
      {/* A sibling scrim button, not a wrapper div (mirrors NavMenu's scrim) — an actual <button>
          is inherently keyboard-operable, avoiding the need for a click handler paired with a
          keydown handler on an otherwise-static element. */}
      <button
        type="button"
        className="modal-backdrop"
        aria-label="Sluiten"
        onClick={onClose}
      />
      <div
        className="modal-card result-modal"
        data-status={status}
        role="dialog"
        aria-modal="true"
        aria-label={status === "won" ? "Goed geraden" : "Helaas"}
      >
        <button
          type="button"
          className="modal-card__close"
          aria-label="Sluiten"
          onClick={onClose}
        >
          ×
        </button>

        <h2>
          {status === "won"
            ? `GOED · ${guessCount} POGINGEN`
            : "HELAAS · 6 POGINGEN OP"}
        </h2>

        <p className="result-modal__answer">
          <strong>{reveal.name}</strong>
          {reveal.province} · {reveal.population.toLocaleString("nl-NL")}{" "}
          inwoners ({reveal.populationDate})
        </p>

        <dl className="result-modal__stats">
          <div>
            <dt>GESPEELD</dt>
            <dd>{stats.totalPlayed}</dd>
          </div>
          <div>
            <dt>GOED</dt>
            <dd>{stats.percentCorrect}%</dd>
          </div>
          <div>
            <dt>REEKS</dt>
            <dd>{stats.currentStreak}</dd>
          </div>
          <div>
            <dt>GEMIDD.</dt>
            <dd>{stats.averageGuesses.toFixed(1)}</dd>
          </div>
        </dl>

        <h3>Verdeling pogingen</h3>
        <AttemptsDistribution attemptsDistribution={attemptsDistribution} />
      </div>
    </>
  );
}
