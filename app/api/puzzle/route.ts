import type { NextRequest } from "next/server";
import { cityForDate, isKnownPuzzleDate } from "@/lib/game/selection";
import { resolvePuzzleDate } from "@/lib/time";

// GET /api/puzzle?date=YYYY-MM-DD — contracts/api.md.
// Deliberately never includes cityId/name: research.md's server-side-only-hints decision.
export async function GET(request: NextRequest) {
  const dateParam = request.nextUrl.searchParams.get("date");
  const date = resolvePuzzleDate(dateParam);

  if (!date || !isKnownPuzzleDate(date)) {
    return Response.json(
      { error: "Invalid or unavailable date" },
      { status: 400 },
    );
  }

  const city = cityForDate(date);
  if (!city) {
    return Response.json(
      { error: "Invalid or unavailable date" },
      { status: 400 },
    );
  }

  return Response.json({
    date,
    // Proxied (app/api/puzzle/image/route.ts) — never the raw origin URL, whose filename
    // routinely embeds the city's name (e.g. Wikimedia's "Veendam_105.JPG").
    imageUrl: `/api/puzzle/image?date=${date}`,
    // FR-002 requires owner + license before the first guess, not the source link — Wikimedia's
    // file-page URLs also embed the place name (".../wiki/File:Veendam_105.JPG"), so `source` is
    // withheld here and only included in the win/loss reveal, once it's no longer a spoiler.
    imageCredit: {
      owner: city.image.owner,
      license: city.image.license,
    },
  });
}
