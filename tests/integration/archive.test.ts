import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as postGuess } from "@/app/api/puzzle/guess/route";
import { GET as getReveal } from "@/app/api/puzzle/reveal/route";
import { GET as getPuzzle } from "@/app/api/puzzle/route";
import { cityForDate } from "@/lib/game/selection";
import { recomputeStats } from "@/lib/game/streak";
import type { StoredPuzzle } from "@/lib/local-storage";
import { LAUNCH_DATE } from "@/scripts/generate-puzzle-cycle";

function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

// The game launches "today" in this fixture timeline, so there's no real past date to replay
// against yet — advance the fake clock so LAUNCH_DATE is genuinely in the past, like it will be
// for real players after the game has been live a few days.
const PAST_DATE = LAUNCH_DATE;
const SIMULATED_TODAY = addDays(LAUNCH_DATE, 5);

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(`${SIMULATED_TODAY}T12:00:00Z`));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("archive replay — API works for a genuinely past date (FR-016)", () => {
  it("GET /api/puzzle accepts a past date and never leaks the answer", async () => {
    const req = new NextRequest(
      `http://localhost/api/puzzle?date=${PAST_DATE}`,
    );
    const res = await getPuzzle(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.date).toBe(PAST_DATE);
    expect(body).not.toHaveProperty("cityId");
  });

  it("POST /api/puzzle/guess and GET /api/puzzle/reveal both work for a past date", async () => {
    const answer = cityForDate(PAST_DATE)!;
    const req = new NextRequest("http://localhost/api/puzzle/guess", {
      method: "POST",
      body: JSON.stringify({ date: PAST_DATE, cityId: answer.id }),
    });
    const res = await postGuess(req);
    const body = await res.json();
    expect(body.correct).toBe(true);
    expect(body.reveal.name).toBe(answer.name);

    const revealReq = new NextRequest(
      `http://localhost/api/puzzle/reveal?date=${PAST_DATE}`,
    );
    const revealRes = await getReveal(revealReq);
    expect(revealRes.status).toBe(200);
  });
});

describe('archive replay — "no catch-up" streak semantics (FR-014)', () => {
  it("a win recorded with streakEligible:false (the archive path) never starts a streak", () => {
    const puzzles: Record<string, StoredPuzzle> = {
      [PAST_DATE]: {
        status: "won",
        streakEligible: false, // exactly what components/PuzzlePlayer.tsx sets for isArchive
        guesses: [
          {
            cityId: "x",
            order: 1,
            hints: {
              province: { match: true, tier: "green" },
              population: { direction: "equal", tier: "green" },
              distance: { km: 0, direction: null, tier: "green" },
            },
          },
        ],
        answerProvince: "Groningen",
      },
    };
    const stats = recomputeStats(puzzles, addDays(PAST_DATE, 5));
    expect(stats.totalPlayed).toBe(1);
    expect(stats.provinceAccuracy.Groningen).toEqual({ correct: 1, total: 1 });
    expect(stats.currentStreak).toBe(0);
    expect(stats.longestStreak).toBe(0);
  });
});
