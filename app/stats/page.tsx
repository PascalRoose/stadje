"use client";

import { useEffect, useState } from "react";
import { AttemptsDistribution } from "@/components/AttemptsDistribution";
import { PageHeader } from "@/components/PageHeader";
import { deriveDisplayStats } from "@/lib/game/streak";
import { type LocalGameState, loadState } from "@/lib/local-storage";

// Mockup screen 09 (Statistieken) — US3.
export default function StatsPage() {
  const [state, setState] = useState<LocalGameState | null>(null);

  useEffect(() => {
    setState(loadState());
  }, []);

  if (!state) return <p className="loading">Laden…</p>;

  const { stats } = state;

  if (stats.totalPlayed === 0) {
    return (
      <>
        <PageHeader title="Statistieken" />
        <div className="screen">
          <p>
            Je hebt nog geen stadje gespeeld. Speel je eerste stadje om
            statistieken te zien.
          </p>
        </div>
      </>
    );
  }

  const display = deriveDisplayStats(stats);
  const provinces = Object.entries(stats.provinceAccuracy)
    .filter(([, acc]) => acc.total > 0)
    .map(([province, acc]) => ({
      province,
      pct: Math.round((acc.correct / acc.total) * 100),
    }))
    .sort((a, b) => b.pct - a.pct);
  const strongest = provinces[0];
  const weakest = provinces[provinces.length - 1];

  return (
    <>
      <PageHeader title="Statistieken" />
      <div className="screen stats-page">
        <dl className="stats-page__grid">
          <div>
            <dt>GESPEELD</dt>
            <dd>{stats.totalPlayed}</dd>
          </div>
          <div>
            <dt>GERADEN</dt>
            <dd>{display.percentCorrect}%</dd>
          </div>
          <div>
            <dt>REEKS</dt>
            <dd>{stats.currentStreak}</dd>
          </div>
          <div>
            <dt>LANGSTE REEKS</dt>
            <dd>{stats.longestStreak}</dd>
          </div>
        </dl>

        <h2>Verdeling pogingen</h2>
        <AttemptsDistribution
          attemptsDistribution={stats.attemptsDistribution}
        />

        {strongest && weakest && (
          <p className="stats-page__provinces">
            Sterkst in <strong>{strongest.province}</strong> ({strongest.pct}%
            geraden), zwakst in <strong>{weakest.province}</strong> (
            {weakest.pct}% geraden).
          </p>
        )}
      </div>
    </>
  );
}
