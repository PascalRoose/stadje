import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { getDb } from "@/db/client";
import { worldStatsDaily } from "@/db/schema";
import {
  applyCompletion,
  deriveWorldStatsDisplay,
  emptyWorldStatsRow,
  isValidCompletionSubmission,
  type WorldStatsRow,
} from "@/lib/game/world-stats";
import { isValidDateString } from "@/lib/time";

function rowToWorldStatsRow(
  date: string,
  row: typeof worldStatsDaily.$inferSelect | undefined,
): WorldStatsRow {
  if (!row) return emptyWorldStatsRow(date);
  return {
    date,
    playersCount: row.playersCount,
    correctCount: row.correctCount,
    guessesSum: row.guessesSum,
    fastestSolveGuesses: row.fastestSolveGuesses,
    firstGuessTally: row.firstGuessTally,
  };
}

// GET /api/world-stats?date=YYYY-MM-DD — contracts/api.md (FR-024, US6).
export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date");
  if (!date || !isValidDateString(date)) {
    return Response.json({ error: "Invalid date" }, { status: 400 });
  }

  let db: ReturnType<typeof getDb>;
  try {
    db = getDb();
  } catch {
    return Response.json(
      { error: "World stats are not configured" },
      { status: 503 },
    );
  }

  const [existing] = await db
    .select()
    .from(worldStatsDaily)
    .where(eq(worldStatsDaily.date, date));

  return Response.json(
    deriveWorldStatsDisplay(rowToWorldStatsRow(date, existing)),
  );
}

// POST /api/world-stats — contracts/api.md. Only ever called by an opted-in client (FR-017,
// FR-024); this route trusts that gate (already enforced client-side) and never receives or
// stores a player identifier.
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    date?: string;
    won?: unknown;
    guessCount?: unknown;
    firstGuessCityId?: unknown;
  } | null;

  const date = body?.date;
  const submission = body ?? {};
  if (
    !date ||
    !isValidDateString(date) ||
    !isValidCompletionSubmission(submission)
  ) {
    return new Response("Invalid submission", { status: 400 });
  }

  let db: ReturnType<typeof getDb>;
  try {
    db = getDb();
  } catch {
    return new Response("World stats are not configured", { status: 503 });
  }

  const [existing] = await db
    .select()
    .from(worldStatsDaily)
    .where(eq(worldStatsDaily.date, date));

  const next = applyCompletion(rowToWorldStatsRow(date, existing), submission);

  await db
    .insert(worldStatsDaily)
    .values({
      date,
      playersCount: next.playersCount,
      correctCount: next.correctCount,
      guessesSum: next.guessesSum,
      fastestSolveGuesses: next.fastestSolveGuesses,
      firstGuessTally: next.firstGuessTally,
    })
    .onConflictDoUpdate({
      target: worldStatsDaily.date,
      set: {
        playersCount: next.playersCount,
        correctCount: next.correctCount,
        guessesSum: next.guessesSum,
        fastestSolveGuesses: next.fastestSolveGuesses,
        firstGuessTally: next.firstGuessTally,
      },
    });

  return new Response(null, { status: 204 });
}
