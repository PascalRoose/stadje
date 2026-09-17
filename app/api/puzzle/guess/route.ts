import type { NextRequest } from "next/server";
import { getCityById, toRevealPayload } from "@/lib/cities";
import { computeHints } from "@/lib/game/hints";
import { cityForDate, isKnownPuzzleDate } from "@/lib/game/selection";
import { resolvePuzzleDate } from "@/lib/time";

// POST /api/puzzle/guess — contracts/api.md.
// Stateless per request (research.md): the client enforces the 6-guess limit and duplicate
// rejection itself (FR-004, FR-005) before ever calling this.
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    date?: string;
    cityId?: string;
  } | null;
  if (!body?.cityId) {
    return Response.json({ error: "cityId is required" }, { status: 400 });
  }

  const date = resolvePuzzleDate(body.date ?? null);
  if (!date || !isKnownPuzzleDate(date)) {
    return Response.json(
      { error: "Invalid or unavailable date" },
      { status: 400 },
    );
  }

  const guessed = getCityById(body.cityId);
  if (!guessed) {
    return Response.json({ error: "Unknown cityId" }, { status: 400 });
  }

  const answer = cityForDate(date);
  if (!answer) {
    return Response.json(
      { error: "Invalid or unavailable date" },
      { status: 400 },
    );
  }

  const hints = computeHints(guessed, answer);
  const correct = guessed.id === answer.id;

  return Response.json({
    cityId: guessed.id,
    displayName: guessed.name,
    correct,
    hints,
    ...(correct ? { reveal: toRevealPayload(answer) } : {}),
  });
}
