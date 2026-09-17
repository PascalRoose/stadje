# 0011. Daily puzzle selection algorithm: shuffle-once, cycle through

Date: 2026-09-17

## Status

Accepted

## Context

Constitution Principle I requires exactly one city per calendar day, identical for every player,
and Principle IV requires puzzle selection to be a deterministic, testable pure function — but
neither specifies the actual selection mechanism. `specs/001-daily-city-puzzle/spec.md` (FR-001)
inherited the same gap. Three approaches were considered: (a) deterministically shuffle the full
city list once and assign cities to calendar days in that fixed order, cycling and reshuffling once
exhausted; (b) derive each day's city from a formula (e.g. a hash of the date) with a "no repeat
within the last N days" rule; (c) a hand-curated calendar someone edits manually. Given the
project's simplicity principle (V) and that a hobby project doesn't need per-day editorial control,
the project owner chose the shuffle-once/cycle approach.

## Decision

The full city dataset is deterministically shuffled once into a fixed order (a "cycle"). Cities are
assigned to calendar days sequentially through that order, one per Europe/Amsterdam calendar day,
starting from the game's launch date. No city repeats as the daily answer until every city in the
dataset has appeared exactly once. Once the order is exhausted, a new deterministic shuffle is
generated and a new cycle begins.

## Consequences

- Selection is a pure function of (dataset, cycle's fixed order, calendar day index) — satisfies
  Principle IV's testability requirement directly: the whole cycle's assignment can be computed and
  asserted in a test without waiting for real time to pass.
- No city repeats within a cycle; at the current dataset size (178 cities) a cycle is ~6 months,
  growing as the dataset grows toward the ~612 target (see the constitution's deferred
  data-completeness item).
- **Predictability risk, accepted**: because this project's source is public on GitHub (ADR
  [0001](0001-source-control-and-ci-cd.md)), if the generated per-cycle order lives in the public
  repo, anyone motivated enough to read the source could compute future daily answers ahead of
  time — the same issue that famously affected Wordle's original public word list. The project
  owner has explicitly decided this is an acceptable tradeoff for a hobby project (a casual player
  can't accidentally spoil it just by playing; a motivated one reading the repo already has many
  ways to "cheat," and defending against that isn't worth the added complexity). The generated
  order is therefore committed to the repository as static data — no database storage or
  server-side-only secrecy is required for it. This is unrelated to, and does not change, the
  requirement that a given day's answer isn't handed to the client before a win or explicit reveal
  (see `/speckit-plan`'s contracts) — that's about not spoiling the *current* day's puzzle in the
  page a casual player is actually looking at, not about hiding the schedule from someone reading
  source code.
- Adding cities to the dataset mid-cycle does not reshuffle or reorder the current cycle; new
  cities join the next cycle's shuffle to avoid disrupting an already-fixed, in-progress order.
