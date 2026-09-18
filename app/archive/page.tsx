"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { LAUNCH_DATE, puzzleNumber } from "@/lib/launch-date";
import { type LocalGameState, loadState } from "@/lib/local-storage";
import { formatHeaderDate, todayAmsterdam } from "@/lib/time";

type Filter = "all" | "guessed" | "missed";

function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

// Mockup screen 08 (Archief) — US4. Only ever reads the player's own local history; never needs
// (and must never import) the server-only day→city schedule — see lib/game/selection.ts.
export default function ArchivePage() {
  const [state, setState] = useState<LocalGameState | null>(null);
  // Display-only — only picks which archive rows are labeled "today"; never which puzzle content
  // is served (that stays fully server-resolved). todayAmsterdam() is a pure, client-computable
  // function, so no round trip to /api/puzzle is needed just to learn the date.
  const [today] = useState(() => todayAmsterdam());
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    setState(loadState());
  }, []);

  if (!state) return <p className="loading">Laden…</p>;

  const days: string[] = [];
  for (let d = LAUNCH_DATE; d <= today; d = addDays(d, 1)) {
    days.push(d);
  }
  days.reverse();

  const rows = days.map((date) => {
    const entry = state.puzzles[date];
    const guessed = entry?.status === "won";
    const missed = !guessed; // lost, in-progress-but-not-today, or never played — all "missed"
    return { date, entry, guessed, missed };
  });

  const filtered = rows.filter((r) => {
    if (filter === "guessed") return r.guessed;
    if (filter === "missed") return r.missed;
    return true;
  });

  const playedCount = rows.filter((r) => r.entry).length;
  const guessedCount = rows.filter((r) => r.guessed).length;

  return (
    <>
      <PageHeader title="Archief" />
      <div className="screen">
        <nav className="archive-page__filters">
          <button
            type="button"
            className="pill"
            data-active={filter === "all"}
            onClick={() => setFilter("all")}
          >
            Alles
          </button>
          <button
            type="button"
            className="pill"
            data-active={filter === "guessed"}
            onClick={() => setFilter("guessed")}
          >
            Geraden
          </button>
          <button
            type="button"
            className="pill"
            data-active={filter === "missed"}
            onClick={() => setFilter("missed")}
          >
            Gemist
          </button>
        </nav>

        <ul className="archive-page__list">
          {filtered.map(({ date, entry }) => {
            const isToday = date === today;
            const label = isToday ? "/" : `/archive/${date}`;
            const guessCount = entry?.guesses.length ?? 0;
            const played = entry?.status === "won" || entry?.status === "lost";
            const resultLabel =
              entry?.status === "won"
                ? `${guessCount}/6`
                : entry?.status === "lost"
                  ? "X/6"
                  : null;
            return (
              <li key={date}>
                <Link href={label}>
                  <span>
                    NR. {puzzleNumber(date)} · {formatHeaderDate(date)}
                  </span>
                  {played ? (
                    <span data-tier={entry?.status === "won" ? "green" : "red"}>
                      {resultLabel}
                    </span>
                  ) : (
                    <span className="pill">
                      {isToday ? "Vandaag" : "Spelen"}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        <p className="archive-page__footer">
          {days.length} stadjes · {guessedCount} geraden ({playedCount}{" "}
          gespeeld)
        </p>
      </div>
    </>
  );
}
