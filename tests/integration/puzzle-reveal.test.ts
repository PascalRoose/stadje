import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET as getReveal } from "@/app/api/puzzle/reveal/route";
import { toRevealPayload } from "@/lib/cities";
import { cityForDate } from "@/lib/game/selection";

const KNOWN_DATE = "2026-09-17";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(`${KNOWN_DATE}T12:00:00Z`));
});

afterEach(() => {
  vi.useRealTimers();
});

function req(url: string) {
  return new NextRequest(`http://localhost${url}`);
}

describe("GET /api/puzzle/reveal", () => {
  it("reveals the full answer payload for a known date", async () => {
    const answer = cityForDate(KNOWN_DATE)!;
    const res = await getReveal(req(`/api/puzzle/reveal?date=${KNOWN_DATE}`));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual(toRevealPayload(answer));
  });

  it("defaults to today when no date param is given", async () => {
    const res = await getReveal(req("/api/puzzle/reveal"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.name).toBe(cityForDate(KNOWN_DATE)!.name);
  });

  it("rejects a malformed date", async () => {
    const res = await getReveal(req("/api/puzzle/reveal?date=not-a-date"));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({ error: "Invalid or unavailable date" });
  });

  it("rejects a future date", async () => {
    const res = await getReveal(req("/api/puzzle/reveal?date=2026-09-18"));
    expect(res.status).toBe(400);
  });

  it("rejects a date outside the generated puzzle cycle", async () => {
    const res = await getReveal(req("/api/puzzle/reveal?date=2020-01-01"));
    expect(res.status).toBe(400);
  });
});
