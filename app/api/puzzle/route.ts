import type { NextRequest } from "next/server";
import { cityForDate, isKnownPuzzleDate } from "@/lib/game/selection";
import {
  msUntilNextAmsterdamMidnight,
  resolvePuzzleDate,
  todayAmsterdam,
} from "@/lib/time";

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

  // This payload is fully deterministic and identical for every player on a given date (the whole
  // point of "one city per day, same for everyone" — constitution Principle I), so it's safe to
  // let Vercel's edge cache serve it instead of re-invoking this function per request. Today's
  // date is cacheable only until the next Amsterdam midnight, when the answer rolls over; any
  // past (validated, non-future) date's answer never changes once assigned (ADR 0011), so it's
  // cacheable indefinitely. The undated `/api/puzzle` and dated `/api/puzzle?date=X` requests are
  // different cache keys, which is exactly right: the undated URL must roll over at midnight,
  // while a specific past date's URL never does.
  const isToday = date === todayAmsterdam();
  const maxAge = isToday
    ? Math.max(1, Math.floor(msUntilNextAmsterdamMidnight() / 1000))
    : 60 * 60 * 24 * 365;

  return Response.json(
    {
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
    },
    {
      headers: {
        "Cache-Control": `public, max-age=${maxAge}${isToday ? "" : ", immutable"}`,
      },
    },
  );
}
