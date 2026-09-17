import type { NextRequest } from "next/server";
import { cityForDate, isKnownPuzzleDate } from "@/lib/game/selection";
import { resolvePuzzleDate } from "@/lib/time";

// GET /api/puzzle/image?date=YYYY-MM-DD
//
// Proxies the day's photo without ever exposing its origin URL to the client. Wikimedia Commons
// filenames routinely embed the place name (e.g. "Veendam_105.JPG"), so handing the client the
// raw `image.url` from GET /api/puzzle would leak the answer through the filename alone, before
// any guess — this route exists specifically to close that leak. Not "re-hosting" in the
// storage sense (research.md's next/image decision still holds — nothing is stored, only
// streamed through per request).
export async function GET(request: NextRequest) {
  const dateParam = request.nextUrl.searchParams.get("date");
  const date = resolvePuzzleDate(dateParam);

  if (!date || !isKnownPuzzleDate(date)) {
    return new Response("Invalid or unavailable date", { status: 400 });
  }

  const city = cityForDate(date);
  if (!city) {
    return new Response("Invalid or unavailable date", { status: 400 });
  }

  const upstream = await fetch(city.image.url);
  if (!upstream.ok || !upstream.body) {
    return new Response("Image unavailable", { status: 502 });
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "image/jpeg",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
