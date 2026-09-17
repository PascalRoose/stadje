<!--
  GENERATED FILE — do not edit directly.
  Source: CLAUDE.md (repo root). After editing CLAUDE.md, regenerate this file with:
    node scripts/sync-agent-instructions.mjs
  See docs/adr/0010-dual-ai-agent-tooling-compatibility.md.
-->
# Stadje — Agent Instructions

Stadje is a daily, Wordle-like guessing game: one Dutch city per day, six guesses, hints after
each guess (province, population, direction + distance). Full non-negotiable rules live in
[`.specify/memory/constitution.md`](.specify/memory/constitution.md) — read it before making any
change to game logic, hints, or scoring. This file is the practical quick-reference; the
constitution is the source of truth if the two ever disagree.

## Non-negotiables (see the constitution for full detail)

- One city per day, identical for every player, day boundary = Europe/Amsterdam midnight.
- Exactly 6 guesses, validated against the city dataset, no repeat guesses.
- Exactly 3 hints per guess (province, population, direction+distance) with fixed tier
  thresholds — do not change 10%/25%/25 km without a constitution amendment.
- Game state (guesses/streak/stats) is local-only, no accounts; analytics are opt-in only.

## Tech stack

- Next.js, TypeScript, targeting Node.js 24.
- Package manager: pnpm (`pnpm-lock.yaml`) — do not use npm/yarn.
- Hosting: Vercel. Database: Neon Postgres via Drizzle ORM.
- Tests: Vitest. Lint/format: Biome (not ESLint/Prettier).
- Source control & CI/CD: GitHub.

See `docs/adr/` for the reasoning behind each of these choices.

@AGENTS.md

## Workflow

- Features go through the Spec Kit pipeline: `/speckit-specify` → `/speckit-plan` →
  `/speckit-tasks` → `/speckit-implement` (`/speckit-clarify`, `/speckit-analyze` as needed).
- A significant architectural/technical decision gets an ADR under `docs/adr/`
  (`NNNN-short-title.md`: status, context, decision, consequences) — see `docs/adr/README.md`.
- This file is the canonical source for shared agent instructions. After editing it, regenerate
  `.github/copilot-instructions.md` with:

  ```
  node scripts/sync-agent-instructions.mjs
  ```

  CI fails if that file is out of sync with this one (see
  `.github/workflows/agent-instructions-sync.yml`). Never hand-edit
  `.github/copilot-instructions.md` directly.
