# Architecture Overview

This document explains *how Stadje's pieces fit together*. It complements, but doesn't replace,
two other documents:

- [`.specify/memory/constitution.md`](../.specify/memory/constitution.md) — the non-negotiable
  game rules (fixed hint thresholds, 6-guess limit, day boundary, local-only privacy). Read that
  first if you're touching game logic.
- [`docs/adr/`](adr/) — *why* each individual technology/design decision was made (Next.js on
  Vercel, Drizzle, the puzzle-selection algorithm, etc.). This document assumes those decisions
  and shows the resulting shape of the system.

If this document and the code disagree, trust the code and fix this document.

## High-level design

Stadje is a single Next.js app with three layers, each with a narrow, one-directional dependency
on the one below it:

```
┌─────────────────────────────────────────────────────────────────────┐
│  UI layer            app/**/page.tsx, components/*.tsx               │
│                       React components: rendering + user interaction  │
└───────────────────────────────┬───────────────────────────────────────┘
                                 │ calls
┌────────────────────────────────▼──────────────────────────────────────┐
│  Orchestration layer  lib/hooks/*.ts                                   │
│                        usePuzzleData, useGameState — the only layer    │
│                        that does I/O (fetch, localStorage) on the      │
│                        client                                          │
└───────────────────────────────┬───────────────────────────────────────┘
                                 │ calls
┌────────────────────────────────▼──────────────────────────────────────┐
│  Domain layer          lib/game/*.ts, lib/cities.ts, lib/time.ts       │
│                         Pure functions: hints, win/loss, streaks,      │
│                         puzzle selection, city search. No I/O, no      │
│                         React. Fully unit-testable in isolation.       │
└─────────────────────────────────────────────────────────────────────┘
```

A parallel, server-only path serves the same domain layer from API routes:

```
┌─────────────────────────────────────────────────────────────────────┐
│  API routes            app/api/**/route.ts                           │
│                         Thin HTTP adapters: validate input, call the  │
│                         domain layer, shape the response, set cache   │
│                         headers.                                      │
└───────────────────────────────┬───────────────────────────────────────┘
                                 │ calls
                    lib/game/selection.ts, lib/game/hints.ts, lib/cities.ts
                    (the same domain layer as above)
                                 │ reads
                    data/cities.json, data/puzzle-cycle.json  (static, bundled)
                                 │ or
                    db/schema.ts via db/client.ts  (world-stats only)
```

**The one rule that shapes everything else**: `lib/game/selection.ts` (which city is today's
answer) is never imported by client code — it's the one module that would leak every future
answer if it reached the browser. Every other domain module is safe to import from either side and
is written as a pure function of its inputs specifically so it can be.

### Why this shape

- **Pure domain layer, thin everything else.** Game logic (hints, win/loss, streaks, selection) is
  the part of the app with actual rules to get right and the part most likely to have edge cases.
  Keeping it as pure functions with no I/O means it's testable without a browser, a server, or a
  database — `tests/unit/hints.test.ts`, `streak.test.ts`, `guess-progress.test.ts`, etc. all run
  in milliseconds against plain function calls.
- **Hooks, not a global store.** State is small (one puzzle's guesses, a stats blob) and lives in
  exactly one place at a time (`useGameState`), passed down as props. There's no cross-page shared
  client state — each page independently reads localStorage on mount. This matches Principle V
  (minimal dependencies): no Redux/Zustand/Context needed at this scale, and adding one would be
  premature for a single-player, account-less game.
- **Server owns the answer; client owns the player's own history.** The city dataset and
  day→city schedule are bundled static data, read only server-side for anything that could reveal
  an answer (`/api/puzzle`, `/api/puzzle/guess`, `/api/puzzle/reveal`) and never for anything that
  doesn't (`lib/cities.ts`'s search/lookup functions are safe on both sides). The player's own
  guesses/streak/stats live only in `localStorage` — there's no account, no server-side player
  row, so there's nothing to leak.

## Request flow: playing a puzzle

1. `app/page.tsx` (server) renders `<PuzzlePlayer />` (client) — the client isn't handed puzzle
   data at this point, so the server can't spoiler anything through page props.
2. `PuzzlePlayer` calls `usePuzzleData()`, which fetches `GET /api/puzzle`. The route resolves
   "today" server-side (`lib/time.ts`), looks up the answer city (`lib/game/selection.ts`, O(1)),
   and returns only an image URL + credit — never the city's id or name. The response carries a
   `Cache-Control` header so Vercel's edge serves the same (identical-for-everyone) payload
   without re-invoking the function until the next Amsterdam midnight.
3. `PuzzlePlayer` calls `useGameState()`, which loads the player's local history
   (`lib/local-storage.ts`) and derives the current puzzle's guesses/status from it.
4. On each guess, `useGameState.submitGuess()` posts to `POST /api/puzzle/guess`, which computes
   hints (`lib/game/hints.ts` — three independent tiers, fixed thresholds) against the real
   answer and returns them — still without revealing the answer unless the guess was correct.
5. `useGameState` folds the result through `lib/game/guess-progress.ts` (pure: is this a win, a
   loss, or still in progress?), persists the updated state, and — only if the player opted in —
   fires an anonymous, fire-and-forget completion beacon to `POST /api/world-stats`
   (`lib/world-stats-client.ts`).
6. On a win or loss, `GET /api/puzzle/reveal` returns the full answer, and `ResultModal`/
   `EndScreen` render it alongside the player's streak (`lib/game/streak.ts`, recomputed fresh
   from the full local history every time — never incrementally patched, so it can't drift).

Archive replay (`app/archive/[date]/page.tsx` → `<PuzzlePlayer date={...} />`) reuses this exact
same path with one behavioral branch: a win recorded for a non-today date is never
streak-eligible (the "no catch-up" rule, enforced in `guess-progress.ts`).

## Module map

| Path | Role |
| --- | --- |
| `app/page.tsx`, `app/archive/[date]/page.tsx` | Entry points into the game loop (today vs. replay) |
| `app/about`, `/archive`, `/settings`, `/stats`, `/how-it-works`, `/privacy`, `/terms` | Static/informational pages, each reading local state or `/api/world-stats` directly |
| `app/api/puzzle/*`, `app/api/world-stats` | HTTP adapters over the domain layer — see [Request flow](#request-flow-playing-a-puzzle) |
| `components/PuzzlePlayer.tsx` | Composes the two `lib/hooks/*` hooks with the puzzle-screen UI |
| `components/GameHeader.tsx`, `GuessInput.tsx`, `GuessTable.tsx`, `EndScreen.tsx`, `ResultModal.tsx`, `PuzzlePhoto.tsx`, etc. | Presentational, receive everything via props |
| `lib/hooks/usePuzzleData.ts` | Fetches the puzzle payload for a given date (or today) |
| `lib/hooks/useGameState.ts` | Orchestrates one puzzle's guess loop: persisted state, in-flight submission, the analytics beacon |
| `lib/game/selection.ts` | **Server-only.** Which city is today's (or date X's) answer |
| `lib/game/hints.ts`, `distance.ts` | Pure hint computation (province/population/distance tiers) |
| `lib/game/guess-progress.ts` | Pure win/loss decision + persisted-state fold |
| `lib/game/streak.ts` | Pure stats/streak recomputation from raw puzzle history |
| `lib/game/world-stats.ts` | Pure aggregate-counter math for the anonymous daily stats |
| `lib/cities.ts` | City dataset access: lookup, normalized search/autocomplete — safe on both client and server |
| `lib/local-storage.ts` | The only place that reads/writes the player's persisted blob |
| `lib/world-stats-client.ts` | Fire-and-forget POST to the analytics endpoint |
| `lib/time.ts` | Europe/Amsterdam day-boundary math — the shared clock every date computation defers to |
| `db/schema.ts`, `db/client.ts` | The one DB table (`world_stats_daily`, anonymous aggregate counters) and its lazy Neon client |
| `data/cities.json`, `data/puzzle-cycle.json` | Static, build-bundled — the dataset and the precomputed day→city schedule |
| `scripts/generate-puzzle-cycle.ts` | Offline generator for `puzzle-cycle.json` (see ADR 0011) |

## Conventions worth knowing

- **New client-side hooks go in `lib/hooks/`**, following `usePuzzleData`/`useGameState`: a hook
  owns I/O and React state; it delegates any actual decision logic to a pure function in
  `lib/game/` so that logic stays unit-testable without React.
- **New game-rule logic goes in `lib/game/` as a pure function** first, with its own unit test,
  before it's wired into a hook or route. If it's tempting to write `fetch`/`localStorage` calls
  directly inside a component, that's usually a sign the logic belongs in `lib/game/` + a hook
  instead.
- **Never import `lib/game/selection.ts` (or `data/puzzle-cycle.json`) from a client component.**
  It's the day→city schedule and would leak every future answer to the browser.

## See also

- [`docs/architecture-review-2026-09.md`](architecture-review-2026-09.md) — the specific
  performance/complexity findings and fixes that produced the current shape of `lib/hooks/` and
  `lib/game/guess-progress.ts`.
- [`docs/adr/`](adr/) — individual technology and design decisions.
