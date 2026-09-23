import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as postGuess } from "@/app/api/puzzle/guess/route";
import { GET as getPuzzle } from "@/app/api/puzzle/route";

const KNOWN_DATE = "2026-09-17";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(`${KNOWN_DATE}T12:00:00Z`));
});

afterEach(() => {
  vi.useRealTimers();
});

function req(url: string, init?: ConstructorParameters<typeof NextRequest>[1]) {
  return new NextRequest(`http://localhost${url}`, init);
}

describe("GET /api/puzzle — invalid/unavailable date (contracts/api.md)", () => {
  it("rejects a malformed date", async () => {
    const res = await getPuzzle(req("/api/puzzle?date=not-a-date"));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body).toEqual({ error: "Invalid or unavailable date" });
  });

  it("rejects a future date", async () => {
    const res = await getPuzzle(req("/api/puzzle?date=2026-09-18"));
    expect(res.status).toBe(400);
  });

  it("rejects a date outside the generated puzzle cycle", async () => {
    const res = await getPuzzle(req("/api/puzzle?date=2020-01-01"));
    expect(res.status).toBe(400);
  });
});

describe("POST /api/puzzle/guess — validation (contracts/api.md)", () => {
  it("rejects a missing cityId", async () => {
    const res = await postGuess(
      req("/api/puzzle/guess", {
        method: "POST",
        body: JSON.stringify({ date: KNOWN_DATE }),
      }),
    );
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body).toEqual({ error: "cityId is required" });
  });

  it("rejects an unparseable body the same way as a missing cityId", async () => {
    const res = await postGuess(
      req("/api/puzzle/guess", { method: "POST", body: "not json" }),
    );
    expect(res.status).toBe(400);
  });

  it("rejects a malformed date", async () => {
    const res = await postGuess(
      req("/api/puzzle/guess", {
        method: "POST",
        body: JSON.stringify({ date: "not-a-date", cityId: "veendam" }),
      }),
    );
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body).toEqual({ error: "Invalid or unavailable date" });
  });

  it("rejects a future date", async () => {
    const res = await postGuess(
      req("/api/puzzle/guess", {
        method: "POST",
        body: JSON.stringify({ date: "2026-09-18", cityId: "veendam" }),
      }),
    );
    expect(res.status).toBe(400);
  });
});
