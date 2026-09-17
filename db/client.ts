import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Constitution Technology Stack & Hosting: Neon Postgres via Drizzle ORM (ADR 0003, 0005).
// This is the only server-side database client this app uses — no player data lives here
// (constitution Principle VI), only anonymous, aggregate world-stats counters (data-model.md).
//
// Lazy by design: DATABASE_URL isn't required for local development (the puzzle itself needs no
// database — data/puzzle-cycle.json is static). Importing this module must never throw just
// because DATABASE_URL is unset, or every route file that imports it would break `next build`/
// `next dev` outright, not just the world-stats endpoints that actually need it.
let cached: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!cached) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error("DATABASE_URL is not set — see .env.example");
    }
    cached = drizzle(neon(url), { schema });
  }
  return cached;
}
