# Quickstart: Daily City Puzzle

Validation guide once this feature is implemented — not implementation code. See `data-model.md`
for storage details and `contracts/api.md` for the exact API shapes referenced below.

## Prerequisites

- Node.js 24, pnpm (or open the repo in the devcontainer once it exists — constitution Technology
  Stack & Hosting).
- A Neon Postgres connection string in `.env` (`DATABASE_URL`), with the `world_stats_daily` table
  migrated (`data-model.md`) — this is the only table.
- `data/puzzle-cycle.json` generated and covering today's Europe/Amsterdam date (`pnpm generate:
  puzzle-cycle` or equivalent, per research.md's seeded-shuffle decision) — without this,
  `GET /api/puzzle` has no answer to serve.

## Setup

```bash
pnpm install
pnpm drizzle-kit push   # or the project's chosen migration command
pnpm dev
```

## Scenario 1 — Play today's puzzle, win path (spec US1, acceptance scenarios 1–4, 6)

1. Open the app. Confirm today's city photo and credit render, 6 guesses shown, no answer identity
   anywhere in the page source or network responses (`GET /api/puzzle` per its contract).
2. Type a partial city name. Confirm matching suggestions appear (by display name and by alias —
   e.g. typing "Den Bosch" should surface 's-Hertogenbosch, spec FR-003).
3. Select a suggestion. Confirm it's submitted immediately (FR-021) via `POST /api/puzzle/guess`,
   a hint row appears, and the guess counter decrements.
4. Repeat with the correct city as one of the guesses (use `data/puzzle-cycle.json` to know today's
   actual `cityId` in a dev/test environment). Confirm the win screen appears with the number of
   guesses used, full guess history, revealed answer (name/province/population/source+year), and a
   countdown to the next Europe/Amsterdam midnight.

## Scenario 2 — Lose path (spec US1, acceptance scenario 5)

1. Submit 6 incorrect guesses. Confirm the game calls `GET /api/puzzle/reveal` only after the 6th
   incorrect guess (not earlier), and the loss screen shows the same reveal/history/countdown shape
   as the win screen.

## Scenario 3 — Duplicate guess rejected (spec Edge Cases)

1. Guess a city, then try to guess it again in the same puzzle. Confirm it's rejected client-side
   (no `POST /api/puzzle/guess` call, no guess consumed) with a message identifying it as already
   guessed.

## Scenario 4 — Resume an in-progress puzzle (spec US1, acceptance scenario 7)

1. Make 2–3 guesses, then reload the page. Confirm the prior guesses and their hints reappear
   exactly as left (read from `localStorage`, not re-fetched from the server).

## Scenario 5 — Consent banner and world stats (spec US2, US6)

1. As a first-time visitor (clear `localStorage`), confirm the consent banner appears before any
   analytics/world-stats call, and distinguishes always-on local progress from optional analytics.
2. Decline. Complete a puzzle. Confirm no `POST /api/world-stats` call is made.
3. Accept (in a second, separate browser profile/incognito session). Complete a puzzle. Confirm
   exactly one `POST /api/world-stats` call is made, and `GET /api/world-stats` for that date
   reflects it.
4. With very few/no opted-in completions for a date, confirm `GET /api/world-stats` returns the
   `insufficientData` shape and the About screen shows a clear empty state, not misleading numbers.

## Scenario 6 — Archive replay and streak "no catch-up" (spec US4, FR-014 edge case)

1. Simulate an unfinished puzzle rolling over a day boundary (or use a past date with no local
   history). Confirm it shows as "missed" / not-yet-played in the archive.
2. Play and win that past puzzle from the archive. Confirm: `stats.totalPlayed` and
   `provinceAccuracy` update, but `stats.currentStreak` does **not** change — only completing the
   puzzle whose date equals today's server-resolved date can move the streak (data-model.md's state
   transitions).

## Scenario 7 — Share text never leaks the answer (spec US5, SC-006)

1. Complete a puzzle (win or lose) and generate a share summary. Confirm the answer city's name
   does not appear anywhere in the generated text, only the guess-count/hint-tier pattern.

## Automated checks

```bash
pnpm test        # Vitest — lib/game/* pure-function tests (constitution Principle IV)
pnpm biome check  # lint/format (constitution Technology Stack & Hosting)
pnpm build        # Next.js production build on Node 24 in CI (ADR 0002)
```
