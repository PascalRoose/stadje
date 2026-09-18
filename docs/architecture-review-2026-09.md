# Architecture Review — September 2026

Date: 2026-09-18

## Purpose

A dedicated performance/complexity pass over the codebase, prompted by the project reaching a
stable shape after several feature cycles (daily puzzle, archive replay, world stats, UI polish)
with no architecture review since. This document records the methodology, findings, and the fixes
applied. It sits alongside `docs/adr/` but is not itself an ADR: every fix here is an
implementation-detail improvement — no stack, schema, or constitution-fixed rule changed — below
the threshold the project's ADR convention (`docs/adr/README.md`) reserves for architectural
decisions.

## Methodology

Three parallel read-only explorations covered (1) overall structure/routing/config, (2) game
logic and the data layer, and (3) frontend/client architecture. Independently, a
[graphify](https://github.com/safishamsi) knowledge-graph analysis of the repository (525 nodes,
1052 edges, 31 communities) was run and cross-checked against the manual findings. Both methods
converged on the same top complexity hotspot: graphify's lowest-cohesion community (0.06,
`GRAPH_REPORT.md`'s own "should this be split?" flag) was exactly `components/PuzzlePlayer.tsx`,
independently identified as a god component by manual reading. Findings were then verified by
reading the actual source (not just summaries) before any fix was written.

## Findings and fixes

### 1. `PuzzlePlayer.tsx` was a god component

**Before**: 282 lines owning puzzle data fetching, guess submission, reveal fetching, localStorage
read/write, win/loss/streak derivation, the analytics beacon, and rendering 7+ children — plus an
inline, untested `Header` sub-component. Its core guess/win/loss orchestration had no test
coverage (only a consent-interaction test existed), unlike the already well-tested pure functions
in `lib/game/*`.

**Fix**: decomposed into:
- `components/GameHeader.tsx` — the extracted header (mechanical move, restores the codebase's
  one-component-per-file convention).
- `lib/hooks/usePuzzleData.ts` — fetches the puzzle payload for today or a given archive date.
- `lib/game/guess-progress.ts` — the pure *decision* logic pulled out of the component:
  `computeGuessProgress` (append a guess, decide win/loss) and `applyPuzzleResult` (fold a result
  into persisted state, recomputing stats). `MAX_GUESSES` moved here as the single source of
  truth for the constitution's fixed 6-guess rule.
- `lib/world-stats-client.ts` — the fire-and-forget analytics POST, kept separate from the
  privacy-critical consent check (which stays visible at the call site, not hidden in a generic
  sender).
- `lib/hooks/useGameState.ts` — the thin I/O orchestration hook composing the above.
- `components/PuzzlePlayer.tsx` — shrunk from 282 to ~120 lines: `usePuzzleData` +
  `useGameState` + JSX composition, no local `useState`/`useEffect` left.

New tests close the coverage gap directly: `tests/unit/guess-progress.test.ts` (pure win/loss
decisions, same style as `tests/unit/streak.test.ts`), `tests/unit/use-puzzle-data.test.ts`, and
`tests/unit/use-game-state.test.ts` (win/loss/streak-eligibility/duplicate-guess/consent-gated
beacon, via `renderHook`). The existing `tests/unit/puzzle-player-consent.test.tsx` passed
unchanged throughout as a characterization-test safety net — no observable behavior changed.

### 2. Zero memoization anywhere — unmemoized full-dataset scan on every keystroke

**Before**: `lib/cities.ts`'s `searchCities()`/`resolveCity()` ran Unicode-NFKD `normalize()` over
every city's name *and* every alias on every call, and `components/GuessInput.tsx` called
`searchCities()` synchronously on every keystroke.

**Fix**: `lib/cities.ts` now lazily builds and caches a normalized index (`getNormalizedCities()`)
alongside the existing `citiesCache`, so `normalize()` runs once per city/alias instead of once
per keystroke per city. `GuessInput.tsx` also debounces the search call itself (~175ms
`setTimeout`, cleared per keystroke) — memoizing the index alone doesn't cap call *frequency*
since the query string changes every keystroke; the debounce is what does. No new dependency:
built from `useEffect`/`setTimeout`, consistent with Principle V.

Tests: `tests/unit/cities.test.ts` (new — none existed before) covers diacritic/case-insensitive
matching, alias resolution, `limit`, and cache non-mutation. `tests/unit/guess-input.test.tsx`
(new) uses `vi.useFakeTimers()` to assert no synchronous search call, suggestions appearing only
after the debounce window, and rapid keystrokes coalescing into one search.

### 3. Lost-update race in `POST /api/world-stats`

**Before**: the handler did `SELECT` → compute next aggregate values in JS → `insert().
onConflictDoUpdate()` with the *computed absolute values*. Two concurrent submissions for the same
date could both read the same starting row and each write a value that discards the other's
increment.

**Fix**: dropped the read entirely. The insert branch is seeded via the existing, unchanged, pure
`applyCompletion()` (no race there — it's a fresh row). The conflict branch uses Drizzle `sql`
fragments so Postgres performs every counter increment atomically in the same statement that takes
the row's lock: `playersCount + 1`, `correctCount`/`guessesSum` conditioned on `submission.won`,
`fastestSolveGuesses` via `LEAST(COALESCE(...))`, and `firstGuessTally`'s per-key count via
`jsonb_set`/`jsonb ->> key`. `lib/game/world-stats.ts` (`applyCompletion`,
`deriveWorldStatsDisplay`) is untouched, so its existing unit tests remain valid unmodified.

CI has no Postgres service (`db/client.ts`'s `getDb()` throws without `DATABASE_URL`), so the
route's actual DB behavior can't be exercised there — this fix should be verified manually against
a real Postgres connection (a Neon dev branch or local instance) before relying on it in
production, including firing several concurrent POSTs at a scratch date and confirming
`playersCount` matches the request count exactly.

### 4. No HTTP/edge caching on `GET /api/puzzle`

**Before**: every request recomputed and re-served the puzzle payload from the serverless
function, despite the payload being fully deterministic and identical for every player on a given
date — the entire point of "one city per day, same for everyone" (constitution Principle I).
`app/api/puzzle/image/route.ts` already set `Cache-Control: public, max-age=3600`; the metadata
route did not.

**Fix**: `GET /api/puzzle` now sets `Cache-Control: public, max-age=<N>` where `<N>` is the
seconds until the next Europe/Amsterdam midnight (via the existing pure
`msUntilNextAmsterdamMidnight()`) for today's date, or one year + `immutable` for any validated
past date (whose answer never changes once assigned, per ADR 0011). A response header — not
`export const revalidate` — is the correct lever here since the handler reads
`request.nextUrl.searchParams`, which Next.js treats as dynamic regardless of the `revalidate`
export; Vercel's edge network honors `Cache-Control` independent of that classification, the same
way the image route already does. The undated (`/api/puzzle`) and dated (`/api/puzzle?date=X`)
URLs are distinct cache keys, correctly: the undated one must roll over at midnight; a specific
past date's never does. `GET /api/puzzle/reveal` was deliberately left uncached — it isn't gated
by the requester's own completion status, so edge-caching it for today's date would risk serving
the still-secret answer to any anonymous requester.

Tests: `tests/integration/puzzle-caching.test.ts` (new) asserts the header's presence and shape
for both a today and a past-date request.

### 5. Avoidable fetch waterfall on `/about` and `/archive`

**Before**: both pages fetched the *entire* `/api/puzzle` payload purely to learn today's date,
then made a second fetch for what they actually needed.

**Fix**: both now call the existing, pure, client-computable `todayAmsterdam()` (`lib/time.ts`)
directly, with no network round trip. This is safe specifically because `today` on these two pages
is used only for display filtering/labeling (which archive rows read "today", which date's world
stats to request) — never for deciding which puzzle content is served, which remains fully
server-resolved (`resolvePuzzleDate()`/`isKnownPuzzleDate()`, untouched). `lib/time.ts`'s existing
"never trust a client-supplied today" warning concerns gameplay-critical resolution, not this
purely cosmetic use.

Tests: `tests/unit/about-archive-date-fetch.test.tsx` (new) asserts neither page calls
`/api/puzzle`.

## Out of scope (reviewed, found already correct)

- `lib/game/hints.ts` / `lib/game/distance.ts` — pure, O(1) per guess, no duplicated logic.
- `lib/game/selection.ts` + `data/puzzle-cycle.json` — O(1) lookup, correctly server-only (never
  importable from a client component, per its own doc comment and ADR 0011).
- No import cycles anywhere in the codebase (confirmed by graphify).
- `components/PuzzlePhoto.tsx`'s deliberate `next/image` → plain `<img>` drop for the zoom
  lightbox — a documented, justified tradeoff (`next/image`'s fixed-layout mode can't support
  natural-pixel-size zoom/pan), not an oversight.
- `db/schema.ts` — a single, minimal, appropriately-scoped table.

## Verification performed

- `pnpm lint` (Biome) — 0 errors introduced (19 pre-existing warnings in untouched files remain).
- `pnpm typecheck` — clean.
- `pnpm test` — 155/155 passing (up from 121 before this review; 34 new tests added).
- `pnpm build` — production build succeeds, all routes compile.
- Manual verification of the `world-stats` concurrency fix against a real Postgres connection is
  still outstanding (not exercisable in CI) — see Finding 3.
