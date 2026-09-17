/**
 * SERVER-ONLY. `data/puzzle-cycle.json` is the full day→city schedule, including every future
 * answer — ADR 0011 accepts that a *motivated reader of the public repo* could compute it, but it
 * must never reach the client at runtime (that would spoil the game for every casual player, not
 * just someone reading source). Import this module only from `app/api/*` route handlers. In
 * particular, never import it from `lib/game/streak.ts` or any other module reachable from a
 * "use client" component — a prior version of this app did exactly that and leaked the entire
 * schedule into the client JS bundle; see this file's git history / the fix in the same commit
 * that added this comment.
 */
import puzzleCycle from "@/data/puzzle-cycle.json";
import { type City, getCityById } from "@/lib/cities";

interface PuzzleCycleEntry {
  cityId: string;
  cycleNumber: number;
  positionInCycle: number;
}

const cycle = puzzleCycle as Record<string, PuzzleCycleEntry>;

/**
 * Pure date -> City lookup against the committed puzzle cycle (ADR 0011, FR-001).
 * Returns undefined for a date outside the generated cycle (before launch, or beyond the
 * generated horizon — regenerate data/puzzle-cycle.json to extend it).
 */
export function cityForDate(date: string): City | undefined {
  const entry = cycle[date];
  if (!entry) return undefined;
  return getCityById(entry.cityId);
}

export function isKnownPuzzleDate(date: string): boolean {
  return date in cycle;
}
