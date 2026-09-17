import type { StoredPuzzle, StoredStats } from "@/lib/local-storage";

// NOTE: this module MUST NEVER import lib/game/selection.ts or data/puzzle-cycle.json — it's
// used from client components (app/page.tsx), and that data is the server-only day→city
// schedule (see selection.ts's doc comment). provinceAccuracy below reads the province straight
// off each StoredPuzzle instead (captured from the reveal response once a puzzle ends).

export function emptyStats(): StoredStats {
  return {
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
  };
}

type Outcome = "won" | "missed"; // "lost" and a rolled-over in-progress both count as "missed" here

function classify(
  puzzle: StoredPuzzle,
  date: string,
  today: string,
): Outcome | null {
  if (puzzle.status === "won") return "won";
  if (puzzle.status === "lost") return "missed";
  // in-progress: only "today" is still genuinely open; any other in-progress date has rolled over.
  return date === today ? null : "missed";
}

function addOneDay(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1, d));
  next.setUTCDate(next.getUTCDate() + 1);
  return next.toISOString().slice(0, 10);
}

/**
 * Recomputes all derived stats from the raw puzzle history — a pure function of
 * (puzzles, today), per constitution Principle IV. Never mutates its input.
 */
export function recomputeStats(
  puzzles: Record<string, StoredPuzzle>,
  today: string,
): StoredStats {
  const stats = emptyStats();
  const dates = Object.keys(puzzles).sort();

  const wonOnOwnDate = new Set<string>();

  for (const date of dates) {
    const puzzle = puzzles[date];
    const outcome = classify(puzzle, date, today);
    if (outcome === null) continue; // today, still in progress — not counted yet

    stats.totalPlayed += 1;

    if (outcome === "won") {
      const guessCount = Math.min(Math.max(puzzle.guesses.length, 1), 6);
      const key = String(
        guessCount,
      ) as keyof StoredStats["attemptsDistribution"];
      stats.attemptsDistribution[key] += 1;
      if (puzzle.streakEligible) {
        wonOnOwnDate.add(date);
      }
    } else {
      stats.attemptsDistribution.X += 1;
    }

    if (puzzle.answerProvince) {
      const acc = stats.provinceAccuracy[puzzle.answerProvince] ?? {
        correct: 0,
        total: 0,
      };
      acc.total += 1;
      if (outcome === "won") acc.correct += 1;
      stats.provinceAccuracy[puzzle.answerProvince] = acc;
    }
  }

  // Longest streak: the longest run of consecutive calendar dates all in wonOnOwnDate.
  let longest = 0;
  let running = 0;
  let previousDate: string | null = null;
  for (const date of dates) {
    if (!wonOnOwnDate.has(date)) {
      running = 0;
      previousDate = null;
      continue;
    }
    running =
      previousDate !== null && addOneDay(previousDate) === date
        ? running + 1
        : 1;
    previousDate = date;
    longest = Math.max(longest, running);
  }
  stats.longestStreak = longest;

  // Current streak: start at today if it's already won-on-its-own-date, otherwise the day
  // before, then walk backward through consecutive won-on-own-date days.
  let current = 0;
  let walk = wonOnOwnDate.has(today) ? today : subtractOneDay(today);
  while (wonOnOwnDate.has(walk)) {
    current += 1;
    walk = subtractOneDay(walk);
  }
  stats.currentStreak = current;

  return stats;
}

/** Derives the win%/average-guesses summary shown on the end screen and about screen. */
export function deriveDisplayStats(stats: StoredStats): {
  percentCorrect: number;
  averageGuesses: number;
} {
  const wins = stats.totalPlayed - stats.attemptsDistribution.X;
  const percentCorrect =
    stats.totalPlayed > 0 ? Math.round((wins / stats.totalPlayed) * 100) : 0;
  const guessSum =
    1 * stats.attemptsDistribution["1"] +
    2 * stats.attemptsDistribution["2"] +
    3 * stats.attemptsDistribution["3"] +
    4 * stats.attemptsDistribution["4"] +
    5 * stats.attemptsDistribution["5"] +
    6 * stats.attemptsDistribution["6"];
  const averageGuesses = wins > 0 ? guessSum / wins : 0;
  return { percentCorrect, averageGuesses };
}

function subtractOneDay(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - 1);
  return dt.toISOString().slice(0, 10);
}
