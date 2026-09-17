/**
 * The game's launch date only — safe to import from client components (unlike
 * lib/game/selection.ts / data/puzzle-cycle.json, which carry every day's answer and must stay
 * server-only). Kept in its own module specifically so nothing client-facing ever needs to pull
 * in the dangerous generation logic just to know where the archive's date range starts.
 */
export const LAUNCH_DATE = "2026-09-17";

/** 1-indexed puzzle number for a date — "NR. 1" on launch day, "NR. 2" the day after, etc. */
export function puzzleNumber(dateStr: string): number {
  const [ly, lm, ld] = LAUNCH_DATE.split("-").map(Number);
  const [y, m, d] = dateStr.split("-").map(Number);
  const launch = Date.UTC(ly, lm - 1, ld);
  const date = Date.UTC(y, m - 1, d);
  return Math.round((date - launch) / 86_400_000) + 1;
}
