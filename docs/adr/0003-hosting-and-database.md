# 0003. Hosting and database: Vercel with Neon Postgres

Date: 2026-09-17

## Status

Accepted

## Context

Stadje needs application hosting and, per the constitution's Core Principle IV (deterministic,
testable game logic) and Principle VI (local-first privacy — only anonymous, opt-in analytics may
touch a server), a place for any server-side persistent storage that isn't player-local browser
state. Given the Next.js choice ([ADR 0002](0002-application-framework-and-runtime.md)), the
project owner specified Vercel for hosting, using its Neon integration for Postgres.

## Decision

The application is hosted on Vercel. Any persistent server-side storage (e.g. the daily puzzle
schedule, aggregate/world statistics shown on the About screen) uses Vercel's Neon-backed Postgres
integration.

## Consequences

- Hosting and database provisioning are managed through one vendor relationship (Vercel), reducing
  operational surface area for a solo project.
- Server-side storage is Postgres, accessed through Drizzle ORM ([ADR
  0005](0005-database-access-layer.md)).
- Any player-identifying or player-owned data (guesses, streaks, personal stats) still must stay
  client-side per Principle VI — this database is for shared/aggregate game data, not player
  accounts.
