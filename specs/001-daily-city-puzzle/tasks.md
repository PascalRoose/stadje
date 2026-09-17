---

description: "Task list template for feature implementation"
---

# Tasks: Daily City Puzzle

**Input**: Design documents from `/specs/001-daily-city-puzzle/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md, quickstart.md

**Design source**: the "Stadje UI mockups" Claude Design project (13 screens) —
`https://claude.ai/design/p/fddd440a-4830-4fbb-995d-6559e730d5a6?file=Stadje+Mockups.dc.html`
(read-only published view: `https://claude.ai/code/artifact/cf2ae287-ba49-49c6-ad56-b066fe3923c0`).
Every UI-building task below cites the specific screen(s) it implements — build against the actual
mockup, not just the FR text, for layout, copy tone, and the recurring header pattern ("Stadje" /
puzzle number+date / "≡" menu icon) shared by nearly every screen.

**Tests**: Included and REQUIRED — constitution Principle IV (NON-NEGOTIABLE) mandates automated
coverage of the win path, the 6-guess loss path, duplicate-guess rejection, the exact hint-tier
boundaries (both sides of 10%/25% population, 25 km distance), streak/statistics transitions
(including "no catch-up" via the archive), and share-text generation that never leaks the answer.

**Organization**: Tasks are grouped by user story (spec.md, priorities P1–P4) to enable independent
implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: Which user story this task belongs to (US1–US6)
- Every task states its exact file path

## Path Conventions

Single Next.js project (App Router + API routes in one project — plan.md's Structure Decision, no
separate frontend/backend). Paths are relative to the repository root: `app/`, `lib/`, `db/`,
`data/`, `scripts/`, `components/`, `tests/`.

---

## Phase 1: Setup

**Purpose**: Project initialization and basic tooling, per plan.md's Project Structure and the
constitution's Technology Stack & Hosting section.

- [X] T001 Initialize the Next.js App Router + TypeScript project (`package.json`, `tsconfig.json`,
      `next.config.ts`, `app/layout.tsx`, `app/globals.css`) using pnpm, targeting Node.js 24 only
      (ADR 0002, 0004, 0008)
- [X] T002 Configure Biome (`biome.json`) and add `biome check`/`biome format` scripts to
      `package.json` (ADR 0007) — depends on T001
- [X] T003 Configure Vitest (`vitest.config.ts`) and add a `test` script to `package.json`
      (ADR 0006) — depends on T001
- [X] T004 [P] Configure `next.config.ts`'s remote image patterns for the Wikimedia Commons URLs
      already present in `data/cities.json`'s `image.url` field (research.md's `next/image` decision) —
      depends on T001
- [X] T005 [P] Scaffold the Drizzle + Neon client in `db/client.ts` and `drizzle.config.ts`
      (ADR 0003, 0005) — depends on T001
- [X] T006 [P] Add `.env.example` documenting the required `DATABASE_URL` (data-model.md) —
      depends on T001

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The shared game-rule engine and data every user story depends on — constitution
Principle IV requires this to be pure, testable functions independent of the route layer.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T007 [P] Implement `lib/cities.ts`: load `data/cities.json`, derive a stable `id` slug per city,
      and expose name+alias search (data-model.md City entity — `id`, `name` as display name,
      `aliases`, `province`, `population`, `populationSource`, `populationDate`, `latitude`,
      `longitude`, `image.{url,source,owner,license}`, `wikipedia`)
- [X] T008 [P] Implement `lib/time.ts`: resolve the current Europe/Amsterdam calendar date via
      `Intl.DateTimeFormat` with `timeZone: 'Europe/Amsterdam'` (no dependency) — constitution
      Principle I, FR-001, research.md's server-resolved-"today" decision
- [X] T009 [P] Implement `lib/game/distance.ts`: haversine great-circle distance rounded to whole
      kilometers, plus an 8-point compass bearing (N/NE/E/SE/S/SW/W/NW) — FR-006, research.md
- [X] T010 [P] Unit tests for `lib/game/distance.ts` in `tests/unit/distance.test.ts` — known
      coordinate pairs, whole-km rounding, and bearing correctness at each of the 8 compass points
      (constitution Principle IV) — depends on T009
- [X] T011 Implement `lib/game/hints.ts`: province match (green/red), population direction
      (higher/lower/equal) + tier, and distance/direction + tier, using these exact thresholds
      verbatim from constitution Principle III / spec FR-007 — green: correct province OR
      population within 10% of the true value; orange ("warm"): distance ≤25 km OR population
      within 25% of the true value; red: none of the above — depends on T009
- [X] T012 [P] Unit tests for `lib/game/hints.ts` in `tests/unit/hints.test.ts` — MUST cover both
      sides of every boundary: population exactly 10% off (green) vs. just over 10% (not green);
      population exactly 25% off (orange) vs. just over 25% (red); distance exactly 25 km (orange)
      vs. 26 km (red) — constitution Principle IV's explicit boundary-testing requirement —
      depends on T011
- [X] T013 Implement `scripts/generate-puzzle-cycle.ts`: a dependency-free seeded PRNG
      (mulberry32-style) performing one Fisher-Yates shuffle per cycle over city ids from
      `lib/cities.ts`, writing the result to `data/puzzle-cycle.json` (ADR 0011; data-model.md
      PuzzleCycleDay — `date`, `cityId`, `cycleNumber`, `positionInCycle`; a given `cityId` MUST
      NOT repeat within the same `cycleNumber`) — depends on T007
- [X] T014 [P] Unit test for the generator's no-repeat-per-cycle invariant in
      `tests/unit/generate-puzzle-cycle.test.ts` (data-model.md validation rule) — constitution
      Principle IV — depends on T013
- [X] T015 Run the generator to produce an initial `data/puzzle-cycle.json` covering from the
      game's launch date through a reasonable horizon (quickstart.md prerequisite) — depends on
      T013
- [X] T016 Implement `lib/game/selection.ts`: pure `date → cityId` lookup against
      `data/puzzle-cycle.json` (FR-001) — depends on T015
- [X] T017 [P] Unit tests for `lib/game/selection.ts` in `tests/unit/selection.test.ts` — no city
      repeats within a cycle, correct date→city lookup at cycle boundaries (constitution
      Principle IV) — depends on T016
- [X] T018 [P] Implement `lib/local-storage.ts`: versioned single-blob read/write matching
      data-model.md's `LocalGameState` shape exactly (`schemaVersion`, `puzzles`, `stats`,
      `consent`, `settings`)
- [X] T019 Implement `lib/game/streak.ts`: `totalPlayed`/`currentStreak`/`longestStreak`/
      `attemptsDistribution`/`provinceAccuracy` transitions per FR-014 and data-model.md's state
      transitions — a puzzle counts toward `totalPlayed` as soon as it is won, lost, or left
      unfinished at day rollover; `currentStreak`/`longestStreak` advance ONLY when the puzzle
      whose date equals "today" (per `lib/time.ts`) is won on that day — completing any other
      date's puzzle via the archive MUST NEVER start, extend, or restore a streak ("no catch-up") —
      depends on T018
- [X] T020 [P] Unit tests for `lib/game/streak.ts` in `tests/unit/streak.test.ts` — the win path,
      the 6-guess loss path, the "no catch-up via archive" rule, and a rolled-over/missed puzzle
      counting toward `totalPlayed` without touching the streak (constitution Principle IV's
      explicit requirement) — depends on T019
- [X] T021 Define the Drizzle schema for `world_stats_daily` in `db/schema.ts` per data-model.md
      (`date` PK, `players_count`, `correct_count`, `guesses_sum`, `fastest_solve_guesses`
      nullable, `first_guess_tally` as a JSON `city_id → count` map) and run the initial migration
      — depends on T005

**Checkpoint**: Foundation ready — user story implementation can now begin.

---

## Phase 3: User Story 1 - Play Today's Puzzle (Priority: P1) 🎯 MVP

**Goal**: A player can see today's city photo, guess up to 6 times via autocomplete, see three
hints after each guess, and reach a win or loss reveal — the entire game, playable end to end.

**Independent Test**: Play a single day's puzzle start to finish (both win and loss paths) and
confirm hints, guess limits, and the reveal are all correct — no other story needs to exist yet.

**Mockup screens**: 01 (Nieuw spel), 02 (Onderweg · autocomplete), 03 (Dubbele gok), 04 (Gewonnen +
delen), 05 (Verloren), 07 (Menu).

### Tests for User Story 1

> Written first per constitution Principle IV; they exercise the API route handlers directly and
> will fail until the Implementation tasks below land.

- [X] T022 [P] [US1] Integration test for the win path in
      `tests/integration/puzzle-win.test.ts` — submit the correct city as a guess, confirm the
      response has `correct: true` plus a `reveal` object, and confirm `GET /api/puzzle`'s response
      never includes `cityId`/`name` at any point (contracts/api.md; constitution Principle IV)
- [X] T023 [P] [US1] Integration test for the loss path in
      `tests/integration/puzzle-loss.test.ts` — submit 6 incorrect guesses, then confirm
      `GET /api/puzzle/reveal` returns the correct answer only after that point (constitution
      Principle IV)

### Implementation for User Story 1

- [X] T024 [US1] Implement `GET /api/puzzle` in `app/api/puzzle/route.ts` per contracts/api.md —
      `date` optional (defaults to `lib/time.ts`'s today), returns `{date, imageUrl, imageCredit}`
      only (never `cityId`/`name`), 400 for a future or pre-launch date — depends on T016, T007;
      makes T022 assertions about this route meaningful. Scope expanded during implementation:
      also add `GET /api/puzzle/image` (`app/api/puzzle/image/route.ts`) to proxy the photo —
      exposing the raw Wikimedia URL directly leaks the answer via its filename (e.g.
      `Veendam_105.JPG`), a real bug T022 caught; `imageCredit` also drops `source` pre-guess for
      the same reason (research.md, contracts/api.md updated to match).
- [X] T025 [US1] Implement `POST /api/puzzle/guess` in `app/api/puzzle/guess/route.ts` per
      contracts/api.md — stateless per request; resolves the date's answer via
      `lib/game/selection.ts`, computes hints via `lib/game/hints.ts`/`lib/game/distance.ts`,
      returns `{cityId, displayName, correct, hints}` plus `reveal` only when `correct: true`, 400
      for an unresolvable `cityId` or invalid date — depends on T016, T011, T007; makes T022/T023
      pass
- [X] T026 [US1] Implement `GET /api/puzzle/reveal` in `app/api/puzzle/reveal/route.ts` per
      contracts/api.md — returns the full answer (name, province, population, source, year); no
      server-side proof of guess exhaustion is required (research.md) — depends on T016, T007;
      makes T023 pass
- [X] T027 [US1] Build `components/GuessInput.tsx` per **mockup screens 01 & 02**: the "Typ een
      stad…" input, autocomplete dropdown grouped by matching substring (see screen 02's Zw/Zwolle/
      Zwijndrecht/Zwaag grouping) with each suggestion's province shown, filtering `lib/cities.ts`
      by display name and alias (case/diacritic-insensitive), immediate-submit-on-select per
      FR-021 (no separate confirm step) — depends on T007
- [X] T028 [US1] Wire client-side duplicate-guess rejection and the 6-guess limit (FR-004, FR-005)
      per **mockup screen 03** ("Je hebt Rotterdam al geprobeerd — kies een ander stadje"), against
      the player's `localStorage` history for the current date, rejecting a repeat guess without
      consuming an attempt — depends on T027, T018
- [X] T029 [P] [US1] Build `components/GuessTable.tsx` per **mockup screens 02, 04 & 05**: the
      running per-guess table (Stad / Provincie / Inwoners / Afstand columns), with population
      shown as e.g. "235k ↓" and distance as e.g. "↙ 176 km", each cell colored by its hint tier
      (FR-006)
- [X] T030 [P] [US1] Build `components/Countdown.tsx` per **mockup screens 04 & 05**: "Volgend
      stadje over H:MM uur" — time remaining to the next Europe/Amsterdam midnight (FR-011) —
      depends on T008
- [X] T031 [US1] Build `components/EndScreen.tsx` per **mockup screens 04 (Gewonnen + delen) & 05
      (Verloren)**: "GOED · N POGINGEN" / "HELAAS · 6 POGINGEN OP" heading, revealed answer with
      province + population + year, the full GuessTable, the played/correct%/streak/average stat
      row (screen 04), and the Countdown (FR-008–FR-010) — depends on T026, T029, T030
- [X] T032 [US1] Build `components/NavMenu.tsx` per **mockup screen 07 (Menu)**: the "≡" header
      icon shared by nearly every screen, opening a menu with links to How it works, Archive,
      Statistics, About Stadje, Privacy policy, and Cookies — this is the app's shared navigation
      chrome that US3/US4/US6/settings/privacy pages all link from
- [X] T033 [US1] Build `app/page.tsx` per **mockup screen 01 (Nieuw spel)**: the "Stadje / NR. NNN ·
      DD MON / ≡" header (using `NavMenu`), photo with credit line under it, GuessInput,
      GuessTable, EndScreen, Countdown, resuming an in-progress puzzle from `localStorage` on load
      (FR-002; spec acceptance scenario 7) — depends on T024, T027, T028, T029, T030, T031, T032,
      T018
- [X] T034 [US1] Wire `lib/local-storage.ts` writes on every guess and on win/loss so a reload
      resumes exactly where the player left off (FR-013, SC-007) — depends on T033

**Checkpoint**: User Story 1 is fully functional and independently playable — this is the MVP.

---

## Phase 4: User Story 2 - Manage Privacy & Analytics Consent (Priority: P2)

**Goal**: A first-time visitor sees a consent notice distinguishing always-on local progress from
optional anonymous analytics, can accept/decline, and can change that choice later in settings.

**Independent Test**: Load the game as a new visitor, confirm no analytics activity occurs before a
choice is made, and confirm accept/decline (and later toggling in settings) behave correctly —
independent of whether any puzzle has been played.

**Mockup screens**: 13 (Cookiemelding), 11 (Instellingen — Bezoekstatistieken toggle).

### Tests for User Story 2

- [X] T035 [P] [US2] Integration test in `tests/integration/consent.test.ts` confirming no
      `POST /api/world-stats` call fires before a consent choice is made, and none fires when the
      player declines (FR-017, SC-004)

### Implementation for User Story 2

- [X] T036 [US2] Build `components/ConsentBanner.tsx` per **mockup screen 13 (Cookiemelding)**:
      "Je spelvoortgang blijft altijd op je eigen apparaat staan — daar is geen toestemming voor
      nodig. Mag Stadje daarnaast anonieme bezoekstatistieken bijhouden?" with Weigeren/Accepteren
      actions and Privacy/Voorwaarden links (FR-017 acceptance scenarios 1–3)
- [X] T037 [US2] Wire consent state into `lib/local-storage.ts`'s `consent` field (`null` = no
      choice made yet) and gate any future analytics/world-stats call behind
      `consent.analyticsOptIn === true` — depends on T036, T018; makes T035 pass
- [X] T038 [US2] Add a consent toggle to `app/settings/page.tsx` per **mockup screen 11
      (Instellingen)**'s "Bezoekstatistieken — Anoniem, geen advertenties" row, so a player can
      view/change their choice at any time (FR-017 acceptance scenario 4) — depends on T037

**Checkpoint**: User Stories 1 AND 2 both work independently; the consent gate exists (world-stats
display itself is US6).

---

## Phase 5: User Story 3 - View Personal Statistics (Priority: P3)

**Goal**: A player who has completed several puzzles sees their played count, win rate, streaks,
attempts-to-win distribution, and per-province accuracy.

**Independent Test**: Simulate a local history of completed puzzles (wins, losses, varying guess
counts and provinces) and confirm the statistics screen summarizes that history correctly,
independent of the archive or sharing features.

**Mockup screen**: 09 (Statistieken).

### Implementation for User Story 3

- [X] T039 [US3] Build `app/stats/page.tsx` per **mockup screen 09 (Statistieken)**: the
      GESPEELD/GERADEN/REEKS/LANGSTE stat tiles, the "VERDELING POGINGEN" 1–6/X histogram, and the
      "PROVINCIES — Sterkst in X (N% geraden), zwakst in Y (N% geraden)" line, rendering
      `totalPlayed`, percentage correct, `currentStreak`, `longestStreak`, `attemptsDistribution`,
      and `provinceAccuracy` from `lib/local-storage.ts` via `lib/game/streak.ts`'s derived stats —
      depends on T019, T018
- [X] T040 [P] [US3] Add the empty state to `app/stats/page.tsx` for a player with zero completed
      puzzles, per spec acceptance scenario 3 — depends on T039

**Checkpoint**: User Stories 1–3 all work independently.

---

## Phase 6: User Story 4 - Browse Archive & Play Past Puzzles (Priority: P3)

**Goal**: A player can browse every past daily puzzle (filterable all/guessed/missed) and play any
one they haven't completed yet, under the same rules as today's puzzle.

**Independent Test**: Simulate several past days' outcomes (including some never played) and
confirm the archive list, its filters, and playing an unplayed past puzzle all behave correctly.

**Mockup screen**: 08 (Archief).

### Tests for User Story 4

- [X] T041 [P] [US4] Integration test in `tests/integration/archive.test.ts` confirming that
      winning a past, previously-missed puzzle via the archive updates `totalPlayed`/
      `provinceAccuracy` but leaves `currentStreak` unchanged (constitution Principle IV;
      FR-014's explicit "no catch-up" rule)

### Implementation for User Story 4

- [X] T042 [US4] Build `app/archive/page.tsx` per **mockup screen 08 (Archief)**: the
      Alles/Geraden/Gemist filter tabs, a row per day (city name, "NR. NNN · DD MON", result as
      "N/6" or "Nog niet gespeeld" with a Spelen button), and the "N stadjes · M geraden" footer —
      every day from launch through today (from `data/puzzle-cycle.json`) cross-referenced with the
      player's `localStorage` history — "missed" includes both losses and puzzles never played
      (FR-015; spec Assumptions) — depends on T015, T018
- [X] T043 [US4] Build `app/archive/[date]/page.tsx` reusing US1's GuessInput/GuessTable/EndScreen
      (mockup screens 01, 02, 04, 05) against the same `GET/POST /api/puzzle*` routes parameterized
      by `date` (FR-016) — a previously completed date renders read-only (guess history only, no
      new guesses accepted) — depends on T024, T025, T026, T027, T029, T031
- [X] T044 [US4] Wire archive-puzzle completion through `lib/game/streak.ts`'s "no catch-up" path
      so `app/archive/[date]/page.tsx` updates `totalPlayed`/`provinceAccuracy` on a win but never
      `currentStreak`/`longestStreak` (FR-014) — depends on T043, T019; makes T041 pass

**Checkpoint**: User Stories 1–4 all work independently.

---

## Phase 7: User Story 5 - Share a Result (Priority: P4)

**Goal**: After finishing a puzzle, a player can generate a spoiler-free summary of their attempt
to share.

**Independent Test**: Complete a puzzle (win or lose) and confirm the generated share content
reflects that attempt's pattern without containing the answer city's name.

**Mockup screens**: 04 & 05 ("Deel resultaat" button).

### Tests for User Story 5

- [X] T045 [P] [US5] Unit test in `tests/unit/share.test.ts` asserting the answer city's name (and
      its aliases) never appear in generated share text, across both win and loss cases
      (constitution Principle IV; SC-006)

### Implementation for User Story 5

- [X] T046 [US5] Implement `lib/game/share.ts`: spoiler-free share-text generation from a puzzle's
      guess count and hint-tier pattern only, per FR-012 — never includes the answer city's name —
      makes T045 pass
- [X] T047 [US5] Add the "Deel resultaat" action shown on **mockup screens 04 & 05** to
      `components/EndScreen.tsx`, enabled only once the puzzle has ended (spec Edge Cases) —
      depends on T046, T031

**Checkpoint**: User Stories 1–5 all work independently.

---

## Phase 8: User Story 6 - View World Stats (Priority: P4)

**Goal**: A player can see today's aggregate stats (players, % correct, average guesses, most
common first guess, fastest solve) computed only from analytics-opted-in players.

**Independent Test**: Simulate a pool of opted-in players' completed puzzles for a given day and
confirm the displayed aggregate numbers match that pool exactly, independent of any player who has
not opted in.

**Mockup screen**: 10 (Over Stadje).

### Tests for User Story 6

- [X] T048 [P] [US6] Integration test in `tests/integration/world-stats.test.ts` confirming a
      declined-consent player's completion never affects `GET /api/world-stats`'s counters for
      that date (FR-024; SC-008)

### Implementation for User Story 6

- [X] T049 [US6] Implement `POST /api/world-stats` in `app/api/world-stats/route.ts` per
      contracts/api.md — increments `world_stats_daily`'s counters (`players_count`,
      `correct_count`, `guesses_sum`, `fastest_solve_guesses`, `first_guess_tally`); 400 for an
      invalid date or `guessCount` outside 1–6 — depends on T021
- [X] T050 [US6] Implement `GET /api/world-stats` in `app/api/world-stats/route.ts` (same file as
      T049) per contracts/api.md — returns the aggregate, or `{date, insufficientData: true}` below
      a small player-count threshold rather than a misleading 0%/empty average — depends on T049;
      makes T048 pass
- [X] T051 [US6] Wire a `POST /api/world-stats` call on puzzle completion, only when
      `consent.analyticsOptIn === true` (US2's gate), sending `{date, won, guessCount,
      firstGuessCityId}` only — never a player identifier (FR-024) — depends on T037, T049
- [X] T052 [US6] Build `app/about/page.tsx` per **mockup screen 10 (Over Stadje)**: the "Elke dag
      één Nederlands stadje" description, "Iedereen speelt hetzelfde stadje, van middernacht tot
      middernacht" note, and the "VANDAAG WERELDWIJD" tile row (players / % geraden / gemiddeld
      guesses / most-chosen-first-guess / fastest-solve / total cities in game), including the
      "not enough data" empty state (spec acceptance scenario 3) — depends on T050

**Checkpoint**: All 6 user stories are independently functional.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Remaining constitutional/legal requirements and cross-cutting quality that don't
belong to a single user story.

**Mockup screens**: 06 (Hoe werkt het), 11 (Instellingen), 12 (Privacy & voorwaarden).

- [X] T053 [P] Build `app/privacy/page.tsx` per **mockup screen 12 (Privacy & voorwaarden)**: "Wat
      Stadje opslaat" with its Op je apparaat / Statistieken / Lettertypen / Bronnen /
      Aansprakelijkheid / Contact sections — the approximations disclaimer, data source and year,
      and the data controller's identity and contact — "Pascal Roose, pascalroose@outlook.com" per
      FR-019, FR-022
- [X] T054 [P] Build `app/terms/page.tsx` (Terms of Service, "Voorwaarden" per **mockup screens 11
      & 12**'s links), linked from the same places as the Privacy Policy (FR-025, SC-009)
- [X] T055 [P] Build `components/HowItWorks.tsx` per **mockup screen 06 (Hoe werkt het)**: "Elke
      dag één Nederlandse stad... zes pogingen... Na elke gok krijg je drie aanwijzingen" with the
      three worked hint examples (Provincie / Inwoners / Richting + afstand) and the "Alle steden en
      grotere dorpen van Nederland zitten in het spel" note — reachable by any player at any time
      via `NavMenu` (T032), not only shown once to first-time players (FR-018)
- [X] T056 [P] Add the high-contrast display toggle to `app/settings/page.tsx` per **mockup screen
      11 (Instellingen)**'s "Hoog contrast — Sterkere randen en donkerder tekst" row (FR-020) —
      depends on T038
- [X] T057 [P] Apply the mobile-first, portrait-locked layout used throughout every mockup screen
      to every page/component — desktop MUST keep the same portrait aspect ratio as mobile rather
      than a wide desktop-native layout (FR-023)
- [X] T058 [P] Add a GitHub Actions CI workflow running `pnpm biome check`, `pnpm test`, and
      `pnpm build` on Node 24 (constitution Technology Stack & Hosting; ADR 0002)
- [X] T059 Run every `quickstart.md` scenario end-to-end against a local dev build, comparing the
      running app against the mockup screens listed per phase above, and confirm each passes —
      depends on all prior tasks

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories.
- **User Stories (Phase 3–8)**: All depend on Foundational completion. They may proceed in
  parallel (if staffed) or sequentially in priority order (P1 → P2 → P3 → P3 → P4 → P4).
- **Polish (Phase 9)**: Depends on all desired user stories being complete.

### User Story Dependencies

- **US1 (P1)**: No dependency on other stories — the MVP.
- **US2 (P2)**: No dependency on other stories, though US6 later depends on US2's consent gate.
- **US3 (P3)**: Reads history that US1 produces, but is independently testable via simulated data.
- **US4 (P3)**: Reuses US1's guess UI components (T027, T029, T031) and API routes (T024–T026) —
  build US1 first in practice, even though US4 is nominally independent per the spec.
- **US5 (P4)**: Reuses US1's `EndScreen` (T031).
- **US6 (P4)**: Depends on US2's consent gate (T037) to know when it may submit data.
- **NavMenu (T032, built during US1)**: linked from every subsequent page (settings, archive,
  stats, about, privacy) — those tasks assume it already exists.

### Within Each User Story

- Foundational pure functions (Phase 2) before any route/UI that calls them.
- Tests are listed before their story's implementation tasks (constitution Principle IV, written
  first) and are expected to fail until the corresponding implementation task lands — each
  implementation task above notes which test(s) it makes pass.
- API routes before the UI components that call them.
- UI tasks cite their mockup screen(s) — build the visual layout, copy, and interaction pattern
  from the mockup, not just the functional requirement text.

### Parallel Opportunities

- Setup: T004, T005, T006 (after T001).
- Foundational: T007, T008, T009, T018 can start together; T010, T012, T014, T017, T020 (tests)
  run once their subject module exists.
- Once Foundational completes, US1–US6 can be staffed in parallel, though US4/US5 reuse US1 UI
  pieces in practice.
- Within US1: T022/T023 (tests, separate files) in parallel; T029/T030 (components) in parallel.
- Phase 9 polish tasks (T053–T058) are all independent files and can run fully in parallel.

---

## Parallel Example: Phase 2 Foundational

```bash
# Independent utility modules, once Setup is done:
Task: "Implement lib/cities.ts"
Task: "Implement lib/time.ts"
Task: "Implement lib/game/distance.ts"
Task: "Implement lib/local-storage.ts"

# Once lib/game/distance.ts exists:
Task: "Unit tests for lib/game/distance.ts in tests/unit/distance.test.ts"
```

## Parallel Example: User Story 1

```bash
# Tests, written first, separate files:
Task: "Integration test for the win path in tests/integration/puzzle-win.test.ts"
Task: "Integration test for the loss path in tests/integration/puzzle-loss.test.ts"

# Independent UI components:
Task: "Build components/GuessTable.tsx (mockup screens 02, 04, 05)"
Task: "Build components/Countdown.tsx (mockup screens 04, 05)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories).
3. Complete Phase 3: User Story 1.
4. **STOP and VALIDATE**: run `quickstart.md` Scenarios 1–4 against User Story 1 alone, comparing
   against mockup screens 01–05 and 07.
5. Deploy/demo if ready — a fully playable daily puzzle is already real product value.

### Incremental Delivery

1. Setup + Foundational → foundation ready.
2. US1 → validate independently → deploy/demo (MVP!).
3. US2 → validate (consent banner/gate) → deploy/demo.
4. US3 → US4 → each validated independently → deploy/demo.
5. US5 → US6 → each validated independently → deploy/demo.
6. Phase 9 polish (legal pages, layout, CI) → final validation via all of `quickstart.md`.

### Parallel Team Strategy

With multiple developers, once Foundational (Phase 2) is done: one developer takes US1 (and, given
the reuse noted above, US4/US5 follow naturally from the same person or right after), another takes
US2 → US6 (they share the consent gate), a third takes US3. Stories integrate independently per
their Independent Test criteria.

---

## Notes

- [P] tasks = different files, no unfinished dependency.
- [Story] label maps each task to its user story for traceability.
- Constitution Principle IV tests are NOT optional here — they're called out per foundational
  module and per story above, not deferred to a separate "if requested" pass.
- Hint-tier thresholds, the no-repeat-per-cycle invariant, and the streak "no catch-up" rule are
  quoted verbatim from the constitution/spec in their task descriptions so they aren't left to
  implementation-time discretion.
- Every UI task cites its mockup screen number(s) — re-check the design project (link at top of
  this file) directly when implementing, since Dutch copy/exact layout details live there, not
  duplicated in full here.
- Commit after each task or logical group; stop at any checkpoint to validate a story
  independently.
- Avoid: vague tasks, same-file conflicts marked [P], cross-story dependencies that break a
  story's independent testability.
