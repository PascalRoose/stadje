<!--
Sync Impact Report
- Version change: 2.0.0 → 2.1.0 (MINOR — additive guidance, no principle redefined or removed:
  Technology Stack & Hosting now explicitly permits Playwright for real-browser end-to-end
  coverage, alongside Vitest which remains required for Principle IV's mandated coverage)
- Modified principles: none
- Modified sections:
  - Technology Stack & Hosting — added a sentence permitting Playwright as additive e2e coverage
    of Principle IV's mandated scenarios, on top of (not instead of) Vitest. See ADR 0014
    (docs/adr/0014-e2e-testing-framework.md), which added `@playwright/test` and `e2e/*.spec.ts`
    covering the win path, 6-guess loss path, duplicate-guess rejection, and hint-tier rendering
    through a real browser against a production build.
- Added/removed sections: none
- Deferred items: none
- Note: this HTML comment is scratch material for human review and should be removed before the
  amended constitution is committed.
-->

# Stadje Constitution
<!-- Stadje: a daily Wordle-like guessing game built on real Dutch city/town data. -->

## Core Principles

### I. Shared Daily Puzzle (NON-NEGOTIABLE)
Exactly one Dutch city MUST be selected per calendar day, chosen deterministically, and MUST be
identical for every player worldwide — there is no per-player or per-session randomization. The
day boundary MUST be local midnight in Europe/Amsterdam, regardless of the playing device's own
timezone.
**Rationale**: the shared daily answer is the entire premise of a Wordle-like game — it's what
makes results comparable and shareable. Getting the puzzle boundary or selection wrong breaks that
premise for every player at once.

### II. Validated, Non-Repeating Guesses
A guess MUST resolve to a real entry in the game's city dataset, selected via autocomplete — free
text that doesn't match a known city is not a valid guess. A city already guessed earlier in the
same day's puzzle MUST be rejected rather than consumed as a new attempt.
**Rationale**: every hint (province, population, direction/distance) depends on the guess being a
real, known place; unvalidated input can't be scored, and re-accepting a repeat guess would let a
player burn attempts without gaining information, which isn't how the game is meant to work.

### III. Fixed, Fair Hint Rules (NON-NEGOTIABLE)
Every guess MUST yield exactly three hints, each independently classified — not one combined
verdict for the guess — using thresholds that are part of this constitution, not a runtime-tunable
setting:
1. **Province**: green if it matches the answer's province, red otherwise. There is no orange tier
   for province.
2. **Population**: direction toward the true value (higher/lower/equal), plus a tier — green
   within 10% of the true value, orange ("warm") within 25%, red otherwise.
3. **Distance** (compass direction and whole kilometers to the true city): a tier — green ONLY
   when the guess is the correct city (0 km); orange when 25 km or less; red otherwise. Distance
   MUST NOT be green for any other reason, however close — green here means "correct," not "very
   close."

Because every one of the three hints is green exactly when a guess is the correct city (matching
province, matching population, and 0 km all coincide only on the correct city), a winning guess's
row is green across all three hints simultaneously — this is intentional, not a coincidence to
special-case away.

Changing these thresholds, or the set of hints given, requires a constitutional amendment — not a
routine code change.
**Rationale**: these thresholds define what "close" means to every player simultaneously; silently
tuning them would change the game's difficulty and fairness without anyone agreeing to it.
Independent per-hint tiers (rather than one blended verdict) match the shipped UI design, where
each hint cell is colored on its own — a player should be able to tell exactly which of the three
signals is close and which isn't, not just an overall temperature.

### IV. Deterministic, Testable Game Logic (NON-NEGOTIABLE)
Puzzle selection, hint-tier computation, win/loss state, and streak/statistics updates MUST be
pure functions of (the day's puzzle, the guess history) — no hidden state, wall-clock quirks, or
client-only assumptions the logic can't be replayed from. Automated tests MUST cover, at minimum:
the win path, the 6-guess loss path, duplicate-guess rejection, and the exact tier boundaries
(10% and 25% population, 25 km distance) on both sides of each cutoff, including that distance is
green only at 0 km and never for any other close-but-not-exact value.
**Rationale**: hint tiers have hard-coded cutoffs (Principle III); an off-by-one at a boundary is
invisible in normal play but directly changes whether a guess reads as green, orange, or red.

### V. Simplicity & Minimal Dependencies
Stadje is a hobby project. Prefer the smallest stack that ships a playable game over adding
frameworks, build tooling, or infrastructure "for later." Every new dependency or service MUST be
justified by a concrete, current need, not a hypothetical future one. Start with plain, well
understood tools; add complexity only when a specific limitation is actually hit.
**Rationale**: keeps the project fun and finishable for a solo/small hobby effort, and keeps the
barrier to running it locally low.

### VI. Local-First Privacy (NON-NEGOTIABLE)
Game state — guesses, streaks, statistics — MUST be stored only on the player's own device; the
game MUST NOT require an account or maintain a server-side player profile. Anonymous visit
analytics MUST be opt-in via an explicit, revocable consent action, MUST NOT be paired with ads or
personal profiling, and MUST remain revocable at any time from the app's settings/menu. Fonts and
other static assets MUST be self-hosted rather than pulled from third-party CDNs that would expose
a player's IP address to those third parties.
**Rationale**: this is a direct, stated commitment to players (see the in-app privacy screen) and
a legal one (Pascal Roose is the data controller as a private individual) — it constrains
architecture choices (no auth system, no third-party analytics SDKs, no third-party font CDNs) from
day one rather than being bolted on later.

## Data & Content Standards

All game content ultimately traces back to `data/cities.json` (or its successor). Any tool or script
that modifies this file MUST preserve the existing per-city schema (`name`, `aliases`, `province`,
`population`, `populationSource`, `populationDate`, `image.{url,source,owner,license}`,
`wikipedia`) and MUST NOT silently drop or overwrite attribution fields. Bulk edits (e.g. refreshing
population figures) MUST update `populationDate` alongside `population`.

Population figures MUST cite a source and year (currently CBS, 2026, matching `data/cities.json`'s
`populationSource`/`populationDate` fields). Every city photo MUST display its rights holder and
license. The app MUST keep a visible disclaimer that distances and population figures are
approximations, not suitable for official use.

## Technology Stack & Hosting

GitHub MUST be the system of record for source control, and CI/CD MUST run on GitHub (e.g. GitHub
Actions) gating merges and deploys. The application MUST be built on Next.js, targeting Node.js 24
only. Hosting MUST be on Vercel, including its Neon-backed Postgres integration for any
persistent server-side storage the game needs. Automated tests (required by Principle IV) MUST be
written with Vitest. Playwright MAY additionally be used for real-browser end-to-end coverage of
Principle IV's mandated scenarios (see ADR 0014) — it is additive to, and never a substitute for,
Vitest's required coverage. pnpm MUST be the package manager (lockfile: `pnpm-lock.yaml`). Anonymous
visit analytics (Principle VI) MUST use Vercel Analytics rather than a separate third-party
provider, gated behind the same opt-in consent action. Database access to Neon MUST go through
Drizzle ORM rather than raw SQL or a separate query builder/ORM. Linting and formatting MUST use
Biome rather than a separate ESLint + Prettier setup, enforced in CI. The codebase MUST be
TypeScript, not plain JavaScript. The project MUST ship a devcontainer (`.devcontainer/`) so a
contributor can get a working Node 24 + pnpm environment without manual setup.
**Rationale**: pinning this stack removes an entire category of recurring decisions from a solo
hobby project (reinforcing Principle V's simplicity goal) and keeps CI/deploys predictable.
Changing any part of this stack is exactly the kind of costly-to-reverse decision the ADR
requirement below exists to capture — it MUST NOT happen as an incidental side effect of an
unrelated feature.

The project MUST remain usable with both Claude Code and GitHub Copilot. `CLAUDE.md` (repo root)
is the single canonical source for shared agent instructions — general project conventions,
workflow, and constraints an AI coding agent needs regardless of tool.
`.github/copilot-instructions.md` MUST be generated/kept in sync from `CLAUDE.md` rather than
hand-maintained as a separate, potentially-diverging document; CI MUST fail if it is out of sync
with its source. Claude-specific automation (skills, subagents, and slash commands under
`.claude/`) has no Copilot equivalent and stays Claude-only — only the shared instructions get
synced.
**Rationale**: Copilot has no mechanism for reading `.claude/` or `CLAUDE.md`, and Claude Code has
no equivalent of Copilot's instruction file, so genuine dual-tool support requires two native
files; keeping one as the generated source prevents them silently drifting apart.

## Development Workflow

Features flow through the Spec Kit pipeline: `/speckit-specify` → `/speckit-plan` →
`/speckit-tasks` → `/speckit-implement`, with `/speckit-clarify` and `/speckit-analyze` used when a
spec is ambiguous or artifacts drift out of sync. Before implementation work begins on a feature
that touches puzzle selection, hint computation, or win/loss/streak logic, its plan MUST identify
which tests from Principle IV will be added. As a solo/hobby project, formal PR review is not
required, but every plan or task list MUST be checked against this constitution before
implementation starts.

A significant architectural or technical decision (e.g. choice of storage/hosting, the
puzzle-selection mechanism, adopting or dropping a framework/library, or anything that would be
costly to reverse) MUST be recorded as an Architecture Decision Record (ADR) under `docs/adr/`,
one file per decision, named `NNNN-short-title.md` with sequential numbering. Each ADR MUST state
its status (Proposed / Accepted / Superseded), the context, the decision, and its consequences. An
ADR that reverses or replaces an earlier one MUST mark the earlier ADR Superseded and link to its
replacement rather than deleting it. ADRs record *why* a technical decision was made; they are
distinct from this constitution, which fixes the game's non-negotiable rules — a plan MUST NOT cite
an ADR as justification for deviating from a Core Principle above.

## Governance

This constitution supersedes ad-hoc practice for Stadje. Amendments are made via
`/speckit-constitution` and MUST update the Sync Impact Report, version, and `Last Amended` date in
the same change. Versioning follows semantic versioning: MAJOR for backward-incompatible principle
removals or redefinitions, MINOR for new principles or materially expanded guidance, PATCH for
wording/clarification fixes. Every `/speckit-plan` run MUST verify its approach against the Core
Principles above and note any justified deviation before proceeding to tasks.

**Version**: 2.1.0 | **Ratified**: 2026-09-17 | **Last Amended**: 2026-09-23
