"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { getCityById } from "@/lib/cities";
import type { WorldStatsDisplay } from "@/lib/game/world-stats";

// Mockup screen 10 (Over Stadje) — US6.
export default function AboutPage() {
  const [stats, setStats] = useState<WorldStatsDisplay | null>(null);

  useEffect(() => {
    fetch("/api/puzzle")
      .then((r) => r.json())
      .then((puzzle: { date: string }) =>
        fetch(`/api/world-stats?date=${puzzle.date}`).then((r) => r.json()),
      )
      .then(setStats)
      .catch(() => setStats(null));
  }, []);

  return (
    <>
      <PageHeader title="Over Stadje" />
      <div className="screen about-page">
        <h1>
          Elke dag één
          <br />
          Nederlands stadje
        </h1>
        <p>
          Stadje is een dagelijks raadspel: je ziet een foto van een Nederlandse
          stad of groter dorp en hebt zes pogingen. Na elke gok zie je de
          provincie, het aantal inwoners en de afstand tot het juiste stadje.
        </p>
        <p>
          Iedereen speelt hetzelfde stadje, van middernacht tot middernacht.
        </p>

        <h2>VANDAAG WERELDWIJD</h2>
        {!stats && <p className="loading">Laden…</p>}
        {stats && "insufficientData" in stats && (
          <p>Nog niet genoeg spelers vandaag voor wereldstatistieken.</p>
        )}
        {stats && !("insufficientData" in stats) && (
          <dl className="about-page__world-stats">
            <div>
              <dt>SPELERS</dt>
              <dd>{stats.playersCount}</dd>
            </div>
            <div>
              <dt>GERADEN</dt>
              <dd>{stats.correctPercentage}%</dd>
            </div>
            <div>
              <dt>GEMIDD.</dt>
              <dd>{stats.averageGuesses}</dd>
            </div>
            <div>
              <dt>Meest gekozen eerste gok</dt>
              <dd>
                {stats.mostCommonFirstGuessCityId
                  ? (getCityById(stats.mostCommonFirstGuessCityId)?.name ?? "—")
                  : "—"}
              </dd>
            </div>
            <div>
              <dt>Snelste oplossing vandaag</dt>
              <dd>
                {stats.fastestSolveGuesses !== null
                  ? `${stats.fastestSolveGuesses} poging${stats.fastestSolveGuesses === 1 ? "" : "en"}`
                  : "—"}
              </dd>
            </div>
          </dl>
        )}

        <p className="about-page__sources">
          Inwonersaantallen: CBS (2026). Foto's via Wikimedia Commons.
        </p>
        <p className="about-page__credit">Made with ❤️ by Pascal</p>
      </div>
    </>
  );
}
