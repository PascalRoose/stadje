import type { GuessHints } from "@/lib/game/hints";

const STORAGE_KEY = "stadje:v1";
// v2: hints changed from one combined tier per guess to three independent tiers (province/
// population/distance) — constitution Principle III, amended v2.0.0. Bumped so any pre-existing
// stored data (old shape) is discarded cleanly by loadState() rather than misread.
const SCHEMA_VERSION = 2;

export interface StoredGuess {
  cityId: string;
  order: number; // 1..6
  hints: GuessHints;
}

export type PuzzleStatus = "in-progress" | "won" | "lost";

export interface StoredPuzzle {
  status: PuzzleStatus;
  guesses: StoredGuess[];
  /**
   * True only when this puzzle was won while its own date was still "today" (constitution
   * Principle I's shared day). A win recorded later — e.g. via the archive, FR-016 — leaves this
   * false forever, so it can never start/extend/restore a streak (FR-014's "no catch-up" rule;
   * see lib/game/streak.ts).
   */
  streakEligible: boolean;
  /**
   * The answer's province, captured from the win/loss reveal response once the puzzle is over.
   * Stored here (rather than re-derived) specifically so lib/game/streak.ts never needs to import
   * the day→city schedule client-side — that schedule must stay server-only (see
   * lib/game/selection.ts's doc comment) since it reveals every future answer.
   */
  answerProvince?: string;
}

export interface StoredStats {
  totalPlayed: number;
  currentStreak: number;
  longestStreak: number;
  attemptsDistribution: Record<"1" | "2" | "3" | "4" | "5" | "6" | "X", number>;
  provinceAccuracy: Record<string, { correct: number; total: number }>;
}

export interface StoredConsent {
  analyticsOptIn: boolean;
  decidedAt: string;
}

export interface StoredSettings {
  highContrast: boolean;
}

export interface LocalGameState {
  schemaVersion: number;
  puzzles: Record<string, StoredPuzzle>;
  stats: StoredStats;
  consent: StoredConsent | null;
  settings: StoredSettings;
}

export function emptyState(): LocalGameState {
  return {
    schemaVersion: SCHEMA_VERSION,
    puzzles: {},
    stats: {
      totalPlayed: 0,
      currentStreak: 0,
      longestStreak: 0,
      attemptsDistribution: {
        "1": 0,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        X: 0,
      },
      provinceAccuracy: {},
    },
    consent: null,
    settings: { highContrast: false },
  };
}

// Merely reading window.localStorage (not just calling its methods) throws a SecurityError in
// browsers that block cookies/site data entirely (e.g. Safari's "Block All Cookies"), so every
// access — including this feature check — must be inside the try/catch.
function getLocalStorage(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Reads the whole state blob, migrating/defaulting as needed. Safe to call on the server (SSR). */
export function loadState(): LocalGameState {
  const storage = getLocalStorage();
  if (!storage) return emptyState();
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as LocalGameState;
    if (parsed.schemaVersion !== SCHEMA_VERSION) {
      // No prior schema versions to migrate from yet — reset cleanly if it ever mismatches.
      return emptyState();
    }
    return parsed;
  } catch {
    return emptyState();
  }
}

export function saveState(state: LocalGameState): void {
  const storage = getLocalStorage();
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Quota exceeded or storage blocked mid-session — game state is local-only and
    // best-effort (constitution: no accounts), so silently drop the write.
  }
}
