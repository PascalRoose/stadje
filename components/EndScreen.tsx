"use client";

import Image from "next/image";
import { useState } from "react";
import { Countdown } from "@/components/Countdown";
import { type GuessRow, GuessTable } from "@/components/GuessTable";
import type { CityReveal } from "@/lib/cities";
import { generateShareText } from "@/lib/game/share";

export interface EndScreenStats {
  totalPlayed: number;
  percentCorrect: number;
  currentStreak: number;
  averageGuesses: number;
}

interface EndScreenProps {
  date: string;
  imageUrl: string;
  imageCredit: { owner: string; license: string };
  status: "won" | "lost";
  guessCount: number;
  guesses: GuessRow[];
  reveal: CityReveal;
  stats: EndScreenStats;
}

// Mockup screens 04 (Gewonnen + delen) & 05 (Verloren) — FR-008–FR-012.
export function EndScreen({
  date,
  imageUrl,
  imageCredit,
  status,
  guessCount,
  guesses,
  reveal,
  stats,
}: EndScreenProps) {
  const [shared, setShared] = useState(false);

  async function handleShare() {
    const text = generateShareText({
      date,
      status,
      guessCount,
      guesses,
    });
    try {
      if (navigator.share) {
        await navigator.share({ text });
      } else {
        await navigator.clipboard.writeText(text);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }
    } catch {
      // Player cancelled the share sheet, or clipboard access was denied — not an error state.
    }
  }

  return (
    <div className="end-screen" data-status={status}>
      <h2>
        {status === "won"
          ? `GOED · ${guessCount} POGINGEN`
          : "HELAAS · 6 POGINGEN OP"}
      </h2>

      <div className="puzzle-photo">
        <Image src={imageUrl} alt={reveal.name} fill sizes="430px" />
        <p className="puzzle-photo__credit">Foto: {imageCredit.owner}</p>
      </div>

      {status === "lost" && (
        <p className="end-screen__lead">Het stadje van vandaag was</p>
      )}

      <p className="end-screen__answer">
        <strong>{reveal.name}</strong>
        {reveal.province} · {reveal.population.toLocaleString("nl-NL")} inwoners
        ({reveal.populationDate})
      </p>

      <a
        className="end-screen__wikipedia"
        href={reveal.wikipedia}
        target="_blank"
        rel="noreferrer"
      >
        Bekijk op Wikipedia
      </a>

      <GuessTable guesses={guesses} />

      <dl className="end-screen__stats">
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

      <button type="button" className="end-screen__share" onClick={handleShare}>
        {shared ? "Gekopieerd!" : "Deel resultaat"}
      </button>

      <Countdown />
    </div>
  );
}
