import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { GET as getPuzzle } from "@/app/api/puzzle/route";
import { todayAmsterdam } from "@/lib/time";
import { LAUNCH_DATE } from "@/scripts/generate-puzzle-cycle";

describe("GET /api/puzzle — edge caching (perf: same deterministic payload for every player)", () => {
  it("caches today's puzzle only until the next Amsterdam midnight", async () => {
    const req = new NextRequest("http://localhost/api/puzzle");
    const res = await getPuzzle(req);
    const cacheControl = res.headers.get("Cache-Control");

    expect(cacheControl).toMatch(/public/);
    const maxAgeMatch = cacheControl?.match(/max-age=(\d+)/);
    expect(maxAgeMatch).toBeTruthy();
    const maxAge = Number(maxAgeMatch?.[1]);
    expect(maxAge).toBeGreaterThan(0);
    expect(maxAge).toBeLessThanOrEqual(24 * 60 * 60);
    // Today's answer still rolls over at midnight — must not be marked immutable.
    expect(cacheControl).not.toMatch(/immutable/);
  });

  it("caches a past date's puzzle indefinitely (the answer never changes once assigned)", async () => {
    const req = new NextRequest(
      `http://localhost/api/puzzle?date=${LAUNCH_DATE}`,
    );
    const res = await getPuzzle(req);
    const cacheControl = res.headers.get("Cache-Control");

    expect(cacheControl).toMatch(/public/);
    expect(cacheControl).toMatch(/immutable/);
    const maxAgeMatch = cacheControl?.match(/max-age=(\d+)/);
    expect(Number(maxAgeMatch?.[1])).toBeGreaterThan(24 * 60 * 60);
  });

  it("does not mark today's own date param as immutable, only strictly-past dates", async () => {
    const today = todayAmsterdam();
    if (today === LAUNCH_DATE) return; // launch day itself — nothing to distinguish yet
    const req = new NextRequest(`http://localhost/api/puzzle?date=${today}`);
    const res = await getPuzzle(req);
    expect(res.headers.get("Cache-Control")).not.toMatch(/immutable/);
  });
});
