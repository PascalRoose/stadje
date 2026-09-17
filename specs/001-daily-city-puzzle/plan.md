# Implementation Plan: Daily City Puzzle

**Branch**: `main` (feature dir: `specs/001-daily-city-puzzle`) | **Date**: 2026-09-17 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-daily-city-puzzle/spec.md`

## Summary

Stadje is a daily, Wordle-like game: one Dutch city is chosen per calendar day (Europe/Amsterdam
midnight boundary, ADR 0011's shuffle-once/cycle-through order), and a player gets 6 guesses to
name it from a photo, receiving a province/population/direction+distance hint after each guess.
Technically: a single Next.js app on Vercel computes hints server-side (so the answer's identity
never reaches the client except on win or explicit reveal), while all player-specific state
(guesses, streaks, stats, consent) lives only in the browser's `localStorage` — matching the
constitution's local-first privacy principle. The day→city cycle assignment (ADR 0011) is static,
generated data committed to the repo, read only by server-side code. Neon/Postgres, via Drizzle,
holds the one thing that's genuinely mutable and shared live across players: opt-in-only world
statistics aggregates (FR-024).

## Technical Context

**Language/Version**: TypeScript on Node.js 24 (constitution Technology Stack & Hosting; ADR
[0002](../../docs/adr/0002-application-framework-and-runtime.md),
[0008](../../docs/adr/0008-language.md))

**Primary Dependencies**: Next.js (App Router), Drizzle ORM + Neon serverless driver, Vercel
Analytics — all fixed by the constitution and ADRs
[0002](../../docs/adr/0002-application-framework-and-runtime.md),
[0005](../../docs/adr/0005-database-access-layer.md),
[0009](../../docs/adr/0009-analytics-provider.md). No additional runtime dependency is introduced
for game logic (seeded shuffle, geo-distance/bearing, name/alias search) — see research.md for why.

**Storage**: Neon Postgres via Drizzle (ADR [0003](../../docs/adr/0003-hosting-and-database.md),
[0005](../../docs/adr/0005-database-access-layer.md)) for exactly one table: daily world-stats
aggregates. The day→city cycle assignment (ADR 0011) is static, generated data committed to the
repo instead — the project owner has decided its public visibility is an acceptable tradeoff (see
ADR 0011), so it needs no database. Everything player-specific (guesses, streak, stats, consent,
settings) lives only in browser `localStorage` (constitution Principle VI / spec FR-013) — there is
no player table and no player identifier anywhere server-side.

**Testing**: Vitest (constitution Technology Stack & Hosting; ADR
[0006](../../docs/adr/0006-testing-framework.md)), covering the pure game-logic functions required
by constitution Principle IV: selection-cycle lookup, hint-tier computation (including the exact
10%/25%/25 km boundaries from both sides), win/loss/duplicate-guess handling, streak/stats
transitions (including the "no catch-up via archive" rule), and share-text generation (never
leaking the answer).

**Target Platform**: Web, deployed on Vercel (ADR
[0003](../../docs/adr/0003-hosting-and-database.md)); mobile-first, portrait-locked layout at all
viewport sizes including desktop (spec FR-023) — there is no separate wide-desktop layout to build.

**Project Type**: Single Next.js web application (UI + API routes in one project) — no separate
frontend/backend split; the "backend" is just this app's own `app/api/*` route handlers.

**Performance Goals**: No numeric SLA is specified in the spec. Default: fast-loading mobile web
app behavior (sub-3s time-to-interactive on a typical 4G connection), consistent with a small,
mostly-static dataset (178 cities today) and no heavy client-side computation.

**Constraints**: Must run on Node 24 (ADR 0002). Hint computation MUST happen server-side
only (never client-side), because computing a hint requires comparing against the actual answer;
shipping that comparison to the client would leak *today's* answer through inspectable network
responses or code before the player finishes guessing. The day→city cycle assignment MAY be
committed to the repo as static data (ADR 0011) — the project owner has explicitly accepted that a
motivated reader of the public source could compute future answers; this is a different, accepted
tradeoff from the (unchanged) requirement that a casual player can't see an answer early just by
using the page normally. Concretely: `lib/game/selection.ts` and `data/puzzle-cycle.json` (the
day→city schedule) MUST only ever be imported from `app/api/*` route handlers — never from
`lib/game/streak.ts` or any other module reachable from a `"use client"` component. During
implementation this was violated once (streak.ts's province lookup transitively pulled the whole
schedule into a client JS chunk, caught by inspecting `next build`'s output) and fixed by having
each `StoredPuzzle` carry its own `answerProvince` from the reveal response instead of re-deriving
it. Verify this with `grep -rl cycleNumber .next/static/` returning nothing after any future
change that touches `lib/game/streak.ts` or archive/world-stats wiring.

**Scale/Scope**: Solo hobby project; today's dataset is 178 cities (spec Assumptions; growing the
dataset is explicitly out of scope for this feature). No defined concurrent-user target — default
to Vercel's standard serverless autoscaling with no special provisioning.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle / Section | Check | Status |
|---|---|---|
| I. Shared Daily Puzzle | One city/day, Europe/Amsterdam boundary, identical for all players — implemented as a server-side-only lookup against the static generated cycle data, computed from the server's own Europe/Amsterdam date, never trusting client-supplied dates for "today." | PASS |
| II. Validated, Non-Repeating Guesses | Guess candidates resolve against the bundled city dataset (name+alias) before the guess API is even called; duplicate-guess rejection is enforced client-side against the player's own local guess history for that date (no server-side player state exists to check against — consistent with Principle VI). | PASS |
| III. Fixed, Fair Hint Rules | Hint-tier thresholds (10%/25% population, ≤25 km) are implemented once, server-side, as constants matching the constitution verbatim; not configurable at runtime. | PASS |
| IV. Deterministic, Testable Game Logic | All hint/selection/streak logic is written as pure functions in `lib/game/*`, independent of the Next.js route layer, so Vitest can test them directly without spinning up a server. | PASS |
| V. Simplicity & Minimal Dependencies | No new dependency added beyond the constitution's fixed stack; seeded shuffle and geo math are implemented in-repo (see research.md) rather than pulling in a library for a few dozen lines. | PASS |
| VI. Local-First Privacy | No accounts, no server-side player table. The day→city assignment is public-by-design data, not player data (ADR 0011). The only server-side data concern is opt-in world-stats counters (FR-024), which store no per-player identifier. Analytics/world-stats submission only fires after explicit consent. | PASS |
| Data & Content Standards | `data/cities.json` schema is read as-is (unchanged) as static app data; population/photo attribution and the approximations disclaimer are rendered directly from its existing fields (FR-002, FR-010, FR-019). | PASS |
| Technology Stack & Hosting | Next.js/Node 24, Vercel+Neon, pnpm, Drizzle, Vitest, Biome, TypeScript, Vercel Analytics — all used exactly as pinned; devcontainer and Claude/Copilot sync are project-wide setup, not per-feature, and are tracked separately. | PASS |
| Development Workflow (tests identified) | This plan's Testing section above identifies the Principle IV test set before implementation begins, as required. | PASS |
| Development Workflow (ADR requirement) | No new "significant architectural decision" is introduced by this plan beyond what ADRs 0001–0012 already cover; implementation-level choices (shuffle algorithm, geo formulas, search approach) are recorded in research.md, not as new ADRs, since they're reversible, ordinary code decisions, not costly-to-reverse architecture. | PASS |

No violations — Complexity Tracking table is intentionally omitted.

**Post-design re-check**: after Phase 0/1 (research.md, data-model.md, contracts/api.md), the gate
still holds — in particular, `contracts/api.md` confirms the answer's identity never appears in any
response before a win or explicit reveal (Principle I/III), `db/schema.ts`'s sole table
(data-model.md) carries no player identifier (Principle VI), and every game-rule function
(`lib/game/*`) is designed as a pure function independent of the route layer (Principle IV). No new
violations were introduced by the design phase.

## Project Structure

### Documentation (this feature)

```text
specs/001-daily-city-puzzle/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md         # Phase 1 output (/speckit-plan command)
├── quickstart.md         # Phase 1 output (/speckit-plan command)
├── contracts/            # Phase 1 output (/speckit-plan command)
│   └── api.md
├── checklists/
│   └── requirements.md
└── tasks.md              # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
app/
├── page.tsx                     # Today's puzzle (US1)
├── layout.tsx
├── globals.css
├── archive/
│   ├── page.tsx                  # Archive list + filters (US4)
│   └── [date]/page.tsx           # Play/view a specific past puzzle (US4)
├── stats/page.tsx                # Personal statistics (US3)
├── about/page.tsx                # World stats (US6)
├── settings/page.tsx             # Consent, high-contrast, distance unit (US2, FR-020)
├── privacy/page.tsx              # Privacy policy (FR-019, FR-022)
├── terms/page.tsx                # Terms of Service (FR-025)
└── api/
    ├── puzzle/route.ts           # GET today's/a date's puzzle image (no answer identity)
    ├── puzzle/guess/route.ts     # POST a candidate city id, get hints back
    ├── puzzle/reveal/route.ts    # GET the answer once a puzzle is over
    └── world-stats/route.ts      # GET aggregate stats, POST an opted-in completed result

lib/
├── game/
│   ├── selection.ts              # FR-001: cycle → city-for-date (pure fn)
│   ├── hints.ts                  # FR-006/FR-007: hint-tier computation (pure fn)
│   ├── distance.ts               # haversine distance + compass bearing (pure fn)
│   ├── share.ts                  # FR-012: spoiler-free share text (pure fn)
│   └── streak.ts                 # FR-014: played/streak/stats transitions (pure fn)
├── cities.ts                     # loads data/cities.json, name+alias search (FR-003)
├── time.ts                       # Europe/Amsterdam "today" resolution (FR-001)
└── local-storage.ts              # FR-013: client-only guesses/streak/stats/consent/settings

data/
└── puzzle-cycle.json             # generated day→city assignment (ADR 0011), server-only import

scripts/
└── generate-puzzle-cycle.ts       # seeded shuffle generator that writes data/puzzle-cycle.json

db/
├── schema.ts                     # Drizzle schema: world_stats_daily (only table)
├── client.ts                     # Neon + Drizzle client
└── migrations/                   # drizzle-kit output

components/
├── GuessInput.tsx                 # autocomplete, immediate-submit-on-select (FR-003, FR-021)
├── GuessTable.tsx                  # running hint table (FR-006/FR-007)
├── EndScreen.tsx                    # win/loss reveal, countdown, share (FR-008–FR-012)
├── Countdown.tsx                    # FR-011
├── ConsentBanner.tsx                 # FR-017 / US2
└── HowItWorks.tsx                     # FR-018

tests/
├── unit/
│   ├── selection.test.ts
│   ├── hints.test.ts
│   ├── distance.test.ts
│   ├── streak.test.ts
│   └── share.test.ts
└── integration/
    └── puzzle-flow.test.ts             # end-to-end win/loss via the API route handlers
```

**Structure Decision**: Single Next.js app (App Router) — UI routes under `app/`, thin API routes
under `app/api/*` acting as the only server boundary, all game rules implemented as framework-free
pure functions under `lib/game/` so constitution Principle IV's test requirement doesn't depend on
the web framework at all. `db/` is deliberately small (one table) since almost all state is
client-local per Principle VI. No `backend/`/`frontend/` split (Option 2 of the generic template)
is used, since Next.js API routes already provide that separation within one deployable project —
introducing a second project would violate Principle V without adding real value here.

## Complexity Tracking

*No violations — table intentionally omitted.*
