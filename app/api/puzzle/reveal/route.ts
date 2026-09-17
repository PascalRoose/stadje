import type { NextRequest } from "next/server";
import { toRevealPayload } from "@/lib/cities";
import { cityForDate, isKnownPuzzleDate } from "@/lib/game/selection";
import { resolvePuzzleDate } from "@/lib/time";

// GET /api/puzzle/reveal?date=YYYY-MM-DD — contracts/api.md.
// Explicit, on-demand reveal for the loss path; not pre-fetched anywhere (research.md).
export async function GET(request: NextRequest) {
  const dateParam = request.nextUrl.searchParams.get("date");
  const date = resolvePuzzleDate(dateParam);

  if (!date || !isKnownPuzzleDate(date)) {
    return Response.json(
      { error: "Invalid or unavailable date" },
      { status: 400 },
    );
  }

  const answer = cityForDate(date);
  if (!answer) {
    return Response.json(
      { error: "Invalid or unavailable date" },
      { status: 400 },
    );
  }

  return Response.json(toRevealPayload(answer));
}
