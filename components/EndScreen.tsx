"use client";

import { useState } from "react";
import { Countdown } from "@/components/Countdown";
import { type GuessRow, GuessTable } from "@/components/GuessTable";
import { PuzzlePhoto } from "@/components/PuzzlePhoto";
import type { CityReveal } from "@/lib/cities";
import { generateShareText } from "@/lib/game/share";

interface EndScreenProps {
  date: string;
  imageUrl: string;
  imageCredit: { owner: string; license: string };
  status: "won" | "lost";
  guessCount: number;
  guesses: GuessRow[];
  reveal: CityReveal;
}

// Mockup screens 04 (Gewonnen + delen) & 05 (Verloren) — FR-008–FR-012. The stats grid that used
// to live here now shows once, in ResultModal, right when the puzzle finishes — this screen is
// the permanent "board" view for a completed puzzle.
export function EndScreen({
  date,
  imageUrl,
  imageCredit,
  status,
  guessCount,
  guesses,
  reveal,
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

      <PuzzlePhoto
        imageUrl={imageUrl}
        credit={imageCredit.owner}
        alt={reveal.name}
      />

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

      <button type="button" className="end-screen__share" onClick={handleShare}>
        {shared ? "Gekopieerd!" : "Deel resultaat"}
      </button>

      <Countdown />
    </div>
  );
}
