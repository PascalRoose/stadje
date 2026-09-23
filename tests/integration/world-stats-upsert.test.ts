import { readFileSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as schema from "@/db/schema";

// Tier B: the atomic-upsert SQL in POST /api/world-stats (onConflictDoUpdate with raw `sql`
// fragments — LEAST(...), jsonb_set(...)) was written specifically to fix a lost-update race
// under concurrent same-day submissions (see the comment in app/api/world-stats/route.ts). Mocking
// that SQL would test nothing meaningful, so this runs it against real Postgres via pglite
// (WASM Postgres) — the same engine drizzle-kit's migration targets, just in-memory.

const { dbHolder } = vi.hoisted(() => ({
  dbHolder: { current: undefined as unknown },
}));
vi.mock("@/db/client", () => ({ getDb: () => dbHolder.current }));

const { POST, GET } = await import("@/app/api/world-stats/route");

const MIGRATION_SQL = readFileSync(
  path.join(process.cwd(), "db/migrations/0000_polite_goliath.sql"),
  "utf-8",
);

let client: PGlite;
let db: ReturnType<typeof drizzle<typeof schema>>;

beforeEach(async () => {
  client = new PGlite();
  await client.exec(MIGRATION_SQL);
  db = drizzle(client, { schema });
  dbHolder.current = db;
});

afterEach(async () => {
  await client.close();
});

function postCompletion(body: Record<string, unknown>) {
  return POST(
    new NextRequest("http://localhost/api/world-stats", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  );
}

async function rawRow(date: string) {
  const [row] = await db
    .select()
    .from(schema.worldStatsDaily)
    .where(eq(schema.worldStatsDaily.date, date));
  return row;
}

const DATE = "2026-09-17";

describe("POST /api/world-stats — atomic upsert against real Postgres semantics", () => {
  it("creates a row on the first submission for a date", async () => {
    const res = await postCompletion({
      date: DATE,
      won: true,
      guessCount: 3,
      firstGuessCityId: "veendam",
    });
    expect(res.status).toBe(204);

    const row = await rawRow(DATE);
    expect(row).toMatchObject({
      date: DATE,
      playersCount: 1,
      correctCount: 1,
      guessesSum: 3,
      fastestSolveGuesses: 3,
      firstGuessTally: { veendam: 1 },
    });
  });

  it("increments counters on the conflict branch, and only sums a losing guessCount as 0", async () => {
    await postCompletion({
      date: DATE,
      won: true,
      guessCount: 4,
      firstGuessCityId: "veendam",
    });
    await postCompletion({
      date: DATE,
      won: false,
      guessCount: 6,
      firstGuessCityId: "landgraaf",
    });

    const row = await rawRow(DATE);
    expect(row.playersCount).toBe(2);
    expect(row.correctCount).toBe(1); // the loss doesn't count as correct
    expect(row.guessesSum).toBe(4); // only the winner's guessCount sums
  });

  it("takes the LEAST fastestSolveGuesses only across wins, unaffected by a loss", async () => {
    await postCompletion({
      date: DATE,
      won: true,
      guessCount: 5,
      firstGuessCityId: "a",
    });
    await postCompletion({
      date: DATE,
      won: false,
      guessCount: 1,
      firstGuessCityId: "b",
    });
    await postCompletion({
      date: DATE,
      won: true,
      guessCount: 2,
      firstGuessCityId: "c",
    });

    const row = await rawRow(DATE);
    expect(row.fastestSolveGuesses).toBe(2);
  });

  it("tallies repeated first-guess cities via jsonb_set across separate requests", async () => {
    await postCompletion({
      date: DATE,
      won: true,
      guessCount: 1,
      firstGuessCityId: "veendam",
    });
    await postCompletion({
      date: DATE,
      won: false,
      guessCount: 6,
      firstGuessCityId: "veendam",
    });
    await postCompletion({
      date: DATE,
      won: true,
      guessCount: 3,
      firstGuessCityId: "landgraaf",
    });

    const row = await rawRow(DATE);
    expect(row.firstGuessTally).toEqual({ veendam: 2, landgraaf: 1 });
  });

  it("never loses an increment under concurrent same-date submissions (regression: prior read-then-write race)", async () => {
    const N = 20;
    const results = await Promise.all(
      Array.from({ length: N }, () =>
        postCompletion({
          date: DATE,
          won: true,
          guessCount: 3,
          firstGuessCityId: "veendam",
        }),
      ),
    );
    expect(results.every((r) => r.status === 204)).toBe(true);

    const row = await rawRow(DATE);
    expect(row.playersCount).toBe(N);
    expect(row.correctCount).toBe(N);
    expect(row.guessesSum).toBe(N * 3);
    expect(row.firstGuessTally).toEqual({ veendam: N });
  });

  it("keeps different dates' rows independent", async () => {
    await postCompletion({
      date: "2026-09-17",
      won: true,
      guessCount: 2,
      firstGuessCityId: "veendam",
    });
    await postCompletion({
      date: "2026-09-18",
      won: false,
      guessCount: 6,
      firstGuessCityId: "landgraaf",
    });

    const rowA = await rawRow("2026-09-17");
    const rowB = await rawRow("2026-09-18");
    expect(rowA.playersCount).toBe(1);
    expect(rowA.correctCount).toBe(1);
    expect(rowB.playersCount).toBe(1);
    expect(rowB.correctCount).toBe(0);
  });

  it("GET reflects what POST wrote, once enough submissions exist for display", async () => {
    for (let i = 0; i < 5; i++) {
      await postCompletion({
        date: DATE,
        won: true,
        guessCount: 2,
        firstGuessCityId: "veendam",
      });
    }

    const res = await GET(
      new NextRequest(`http://localhost/api/world-stats?date=${DATE}`),
    );
    const body = await res.json();
    expect(body).toMatchObject({
      date: DATE,
      playersCount: 5,
      correctPercentage: 100,
      mostCommonFirstGuessCityId: "veendam",
    });
  });
});
