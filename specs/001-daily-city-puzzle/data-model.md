# Phase 1 Data Model: Daily City Puzzle

Three storage locations, matching the split explained in `plan.md` and `research.md`:

- **Static app data** — `data/cities.json` (unchanged) plus the generated day→city cycle assignment
  (ADR 0011), both committed to the repo and read only by server-side code.
- **Neon (Postgres via Drizzle)** — one table: anonymous, aggregate-only world-stats counters. This
  is the only state that's genuinely mutable and shared live across players.
- **Browser `localStorage`** — everything player-specific.

## City *(static, from `data/cities.json` — read-only for this feature)*

Per constitution Data & Content Standards; schema unchanged.

| Field | Type | Notes |
|---|---|---|
| `id` | string | Derived (stable slug of `name`, ASCII/kebab-case) — not present in `data/cities.json` today; computed once at load time and used as the stable identifier everywhere else in this data model. |
| `name` | string | Display name (spec FR-003 / Key Entities: "display name = first `name` field"). |
| `aliases` | string[] | Alternate names that resolve to this city (FR-003). |
| `province` | string | |
| `population` | number | |
| `populationSource` | string | e.g. `"CBS"` |
| `populationDate` | string | e.g. `"2026"` |
| `latitude`, `longitude` | number | Used for distance/bearing (research.md). |
| `image.url` / `.source` / `.owner` / `.license` | string | Photo + attribution (FR-002, Data & Content Standards). |
| `wikipedia` | string | Reference link. |

## PuzzleCycleDay *(static, generated, committed to the repo — e.g. `data/puzzle-cycle.json`)*

The generated day→city assignment implementing ADR 0011. One entry per calendar day that has been
assigned a city so far; new entries are generated ahead of need (e.g., a batch per cycle, via a
script) and committed, rather than computed on the fly per request. ADR 0011 explicitly accepts
that this file is public (the repo is public — ADR 0001); it is kept out of the client bundle by
only ever being imported from server-side code (`app/api/*` route handlers), not for secrecy from
a determined reader, but so a casual player can't see today's or a future answer by opening the
page or its network tab.

| Field | Type | Notes |
|---|---|---|
| `date` | string (key) | Europe/Amsterdam calendar date. |
| `cityId` | string | References a `City.id` from the static dataset. |
| `cycleNumber` | integer | Which shuffle cycle this date belongs to (increments each time the full dataset has been used once — ADR 0011). |
| `positionInCycle` | integer | This date's index within its cycle's shuffled order. |

**Validation / invariants**: `cityId` MUST NOT repeat within the same `cycleNumber` (ADR 0011's
no-repeat-per-cycle rule) — enforced by construction (the generation script shuffles each `cityId`
into exactly one slot per cycle), verified by a Vitest test over the generation function.

## WorldStatsDaily *(Neon table: `world_stats_daily`)*

Pure aggregate counters for FR-024/US6; no per-completion or per-player rows.

| Field | Type | Notes |
|---|---|---|
| `date` | date (PK) | Europe/Amsterdam calendar date. |
| `players_count` | integer | Opted-in players who completed this date's puzzle. |
| `correct_count` | integer | Of those, how many won. |
| `guesses_sum` | integer | Sum of guess-counts used by winners, for computing the average. |
| `fastest_solve_guesses` | integer, nullable | Minimum guess-count among winners so far. |
| `first_guess_tally` | JSON map (`city_id` → count) | Increment the guessed city's count on each submission; the max entry is "most common first guess." |

**Validation / invariants**: All counters are non-negative and only ever incremented (no per-row
update/delete path) — a single `POST /api/world-stats` call performs one atomic increment
transaction per completed, opted-in puzzle. "Average guesses" (spec's US6) is derived at read time
as `guesses_sum / correct_count` (undefined/omitted if `correct_count` is 0 — see the "not enough
data" edge case).

## LocalGameState *(`localStorage`, one namespaced JSON blob — see `lib/local-storage.ts`)*

Everything specific to a player, per constitution Principle VI / spec FR-013. Never sent to the
server except the minimal, anonymous, opt-in payload described under `WorldStatsDaily`.

```text
{
  schemaVersion: number,

  puzzles: {
    [date: string]: {
      status: "in-progress" | "won" | "lost",
      // True only if won while this date was still "today" (constitution Principle I). A win
      // recorded later (e.g. via the archive, FR-016) leaves this false forever, so it can never
      // start/extend/restore a streak — FR-014's "no catch-up" rule. See lib/game/streak.ts.
      streakEligible: boolean,
      // The answer's province, captured from the win/loss reveal response once the puzzle ends.
      // Stored here — rather than re-derived from PuzzleCycleDay — specifically so
      // lib/game/streak.ts (used from client components) never needs to import the day→city
      // schedule. That schedule is SERVER-ONLY: it names every future answer, so importing it
      // anywhere reachable from a "use client" component bundles the whole thing into client JS.
      // An earlier version of this feature did exactly that via streak.ts → selection.ts; caught
      // by inspecting the production build's client chunks, fixed by moving province onto this
      // field instead. See lib/game/selection.ts's doc comment.
      answerProvince: string | undefined,
      guesses: Array<{
        cityId: string,
        order: number,               // 1..6
        // Three INDEPENDENT hint tiers (constitution Principle III, amended v2.0.0) — not one
        // combined verdict for the guess. A guess is green across all three only when it's the
        // correct city.
        hints: {
          province: { match: boolean, tier: "green" | "red" },              // no orange
          population: { direction: "higher" | "lower" | "equal", tier: "green" | "orange" | "red" },
          distance: {
            km: number,
            direction: "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW" | null,
            // green ONLY at km === 0 (the correct city) — never for any other closeness.
            tier: "green" | "orange" | "red"
          }
        }
      }>
    }
  },

  stats: {
    totalPlayed: number,
    currentStreak: number,
    longestStreak: number,
    attemptsDistribution: { "1": number, "2": number, ..., "6": number, "X": number },
    provinceAccuracy: { [province: string]: { correct: number, total: number } }
  },

  consent: {
    analyticsOptIn: boolean,
    decidedAt: string  // ISO timestamp
  } | null,   // null = no choice made yet (spec Edge Case: first-time visitor)

  settings: {
    highContrast: boolean
  }
}
```

**Derived-field note**: `stats` is a cache recomputed from `puzzles` by `lib/game/streak.ts`
whenever a puzzle's status changes (win, loss, or a rollover marking it missed) — it is never
hand-edited independently of `puzzles`, so the two can't drift. This function is exactly the
"streak/statistics updates" pure function constitution Principle IV requires to be tested.

**State transitions** (`lib/game/streak.ts`, enforcing spec FR-014):

- A puzzle entry moves `in-progress → won` the instant a correct guess is recorded, or
  `in-progress → lost` at 6 guesses without a win, or (for the *current* day only) is left
  `in-progress` across a day-rollover, after which the *previous* day's entry is treated as
  "missed" for statistics purposes without being mutated (its `status` may remain `in-progress`
  in storage — "missed" is a read-time classification for any non-today `in-progress` puzzle, not
  a stored status).
- `totalPlayed` counts every puzzle with status `won`, `lost`, or "missed" (as defined above).
- `currentStreak`/`longestStreak` only ever advance when the puzzle whose `date` equals the
  Europe/Amsterdam "today" at the moment of completion is won — completing any other date's
  puzzle (via the archive) updates `totalPlayed`/`provinceAccuracy`/`attemptsDistribution` but
  never touches streak fields, per the spec's explicit "no catch-up" rule.
