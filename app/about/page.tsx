"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { getCityById } from "@/lib/cities";
import type { WorldStatsDisplay } from "@/lib/game/world-stats";
import { todayAmsterdam } from "@/lib/time";

// Mockup screen 10 (Over Stadje) — US6.
export default function AboutPage() {
  const [stats, setStats] = useState<WorldStatsDisplay | null>(null);
  // Display-only — only picks which date's world stats to show, never which puzzle is served
  // (that stays fully server-resolved). todayAmsterdam() is a pure, client-computable function,
  // so no round trip to /api/puzzle is needed just to learn the date.
  const [today] = useState(() => todayAmsterdam());

  useEffect(() => {
    fetch(`/api/world-stats?date=${today}`)
      .then((r) => r.json())
      .then(setStats)
      .catch(() => setStats(null));
  }, [today]);

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
          </dl>
        )}

        <p className="about-page__sources">
          Inwonersaantallen: CBS (2026). Foto's via Wikimedia Commons.
        </p>

        <p className="about-page__credit">Made with ❤️ by Pascal</p>
        <a
          href="https://github.com/PascalRoose/stadje"
          target="_blank"
          rel="noreferrer"
          className="btn btn-outline about-page__github"
        >
          <svg
            aria-hidden="true"
            className="about-page__github-icon"
            viewBox="0 0 24 24"
          >
            <path
              fill="currentColor"
              d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.74.08-.74 1.2.08 1.84 1.23 1.84 1.23 1.07 1.83 2.8 1.3 3.49.99.11-.77.42-1.3.76-1.6-2.67-.3-5.47-1.34-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.6-2.8 5.62-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.69.83.57A12 12 0 0 0 12 .5"
            />
          </svg>
          View on GitHub
        </a>
      </div>
    </>
  );
}
