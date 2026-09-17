import type { GuessHints, Tier } from "./hints";

const TIER_EMOJI: Record<Tier, string> = {
  green: "🟩",
  orange: "🟧",
  red: "🟥",
};

export interface ShareParams {
  date: string;
  status: "won" | "lost";
  guessCount: number;
  /** One entry per guess, in submission order — the three independent tiers (Principle III). */
  guesses: Pick<GuessHints, "province" | "population" | "distance">[];
}

/**
 * Spoiler-free share text (FR-012): only the date, result, and a hint-tier emoji grid — the
 * answer city's name (or anything derived from it beyond the tier colors) never appears. Each
 * guess renders as three squares (province/population/distance), matching the independently
 * colored hint cells in the UI (constitution Principle III, v2.0.0).
 */
export function generateShareText({
  date,
  status,
  guessCount,
  guesses,
}: ShareParams): string {
  const result = status === "won" ? `${guessCount}/6` : "X/6";
  const grid = guesses
    .map(
      (g) =>
        `${TIER_EMOJI[g.province.tier]}${TIER_EMOJI[g.population.tier]}${TIER_EMOJI[g.distance.tier]}`,
    )
    .join("\n");
  return `Stadje ${date} — ${result}\n${grid}`;
}
