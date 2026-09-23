import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

// Tier A: mock @/db/client entirely — these cases never need a real database. The atomic-upsert
// SQL itself is exercised against real Postgres semantics in world-stats-upsert.test.ts instead.
const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));
vi.mock("@/db/client", () => ({ getDb: getDbMock }));

async function importRoute() {
  return import("@/app/api/world-stats/route");
}

afterEach(() => {
  vi.resetModules();
  getDbMock.mockReset();
});

function req(url: string, init?: ConstructorParameters<typeof NextRequest>[1]) {
  return new NextRequest(`http://localhost${url}`, init);
}

describe("GET /api/world-stats", () => {
  it("rejects a missing date without touching the database", async () => {
    const { GET } = await importRoute();
    const res = await GET(req("/api/world-stats"));
    expect(res.status).toBe(400);
    expect(getDbMock).not.toHaveBeenCalled();
  });

  it("rejects a malformed date without touching the database", async () => {
    const { GET } = await importRoute();
    const res = await GET(req("/api/world-stats?date=not-a-date"));
    expect(res.status).toBe(400);
    expect(getDbMock).not.toHaveBeenCalled();
  });

  it("returns 503 when the database isn't configured", async () => {
    getDbMock.mockImplementation(() => {
      throw new Error("DATABASE_URL is not set — see .env.example");
    });
    const { GET } = await importRoute();
    const res = await GET(req("/api/world-stats?date=2026-09-17"));
    expect(res.status).toBe(503);
  });

  it("returns an empty/insufficient-data row when no row exists yet", async () => {
    getDbMock.mockReturnValue({
      select: () => ({
        from: () => ({
          where: () => Promise.resolve([]),
        }),
      }),
    });
    const { GET } = await importRoute();
    const res = await GET(req("/api/world-stats?date=2026-09-17"));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body).toEqual({ date: "2026-09-17", insufficientData: true });
  });

  it("maps an existing row through deriveWorldStatsDisplay", async () => {
    getDbMock.mockReturnValue({
      select: () => ({
        from: () => ({
          where: () =>
            Promise.resolve([
              {
                date: "2026-09-17",
                playersCount: 5,
                correctCount: 5,
                guessesSum: 15,
                fastestSolveGuesses: 2,
                firstGuessTally: { veendam: 5 },
              },
            ]),
        }),
      }),
    });
    const { GET } = await importRoute();
    const res = await GET(req("/api/world-stats?date=2026-09-17"));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body).toMatchObject({
      date: "2026-09-17",
      playersCount: 5,
      correctPercentage: 100,
      mostCommonFirstGuessCityId: "veendam",
    });
  });
});

describe("POST /api/world-stats", () => {
  it("rejects a malformed body without touching the database", async () => {
    const { POST } = await importRoute();
    const res = await POST(
      req("/api/world-stats", { method: "POST", body: "not json" }),
    );
    expect(res.status).toBe(400);
    expect(getDbMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid submission (bad guessCount) without touching the database", async () => {
    const { POST } = await importRoute();
    const res = await POST(
      req("/api/world-stats", {
        method: "POST",
        body: JSON.stringify({
          date: "2026-09-17",
          won: true,
          guessCount: 7,
          firstGuessCityId: "veendam",
        }),
      }),
    );
    expect(res.status).toBe(400);
    expect(getDbMock).not.toHaveBeenCalled();
  });

  it("rejects a missing/malformed date without touching the database", async () => {
    const { POST } = await importRoute();
    const res = await POST(
      req("/api/world-stats", {
        method: "POST",
        body: JSON.stringify({
          won: true,
          guessCount: 3,
          firstGuessCityId: "veendam",
        }),
      }),
    );
    expect(res.status).toBe(400);
    expect(getDbMock).not.toHaveBeenCalled();
  });

  it("returns 503 when the database isn't configured", async () => {
    getDbMock.mockImplementation(() => {
      throw new Error("DATABASE_URL is not set — see .env.example");
    });
    const { POST } = await importRoute();
    const res = await POST(
      req("/api/world-stats", {
        method: "POST",
        body: JSON.stringify({
          date: "2026-09-17",
          won: true,
          guessCount: 3,
          firstGuessCityId: "veendam",
        }),
      }),
    );
    expect(res.status).toBe(503);
  });
});
