# Stadje

[![CI](https://github.com/PascalRoose/stadje/actions/workflows/ci.yml/badge.svg)](https://github.com/PascalRoose/stadje/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/PascalRoose/stadje/graph/badge.svg)](https://codecov.io/gh/PascalRoose/stadje)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A daily, Wordle-like guessing game: one Dutch city per day, six guesses, three hints after each
one (province, population, direction + distance). Everyone plays the same city, from midnight to
midnight in Amsterdam.

## Quick start

Requires Node.js 24 and [pnpm](https://pnpm.io). Easiest path: open this repo in a
[devcontainer](https://containers.dev)-compatible tool (VS Code Dev Containers, GitHub Codespaces)
— it installs everything automatically.

```bash
pnpm install
pnpm dev
```

Opens at [http://localhost:3000](http://localhost:3000). No `DATABASE_URL` is required to play —
the daily puzzle itself needs no database (see [`data/puzzle-cycle.json`](data/puzzle-cycle.json)
and [ADR 0011](docs/adr/0011-daily-puzzle-selection-algorithm.md)). A database is only needed for
the opt-in "world stats" feature — see [`.env.example`](.env.example).

`pnpm install` also sets up local git hooks (via `simple-git-hooks`): a pre-commit hook runs
Biome + typecheck on staged files, and a pre-push hook runs the test suite.

`pnpm test:e2e` runs the [Playwright](https://playwright.dev) end-to-end suite against a real
production build (see [ADR 0014](docs/adr/0014-e2e-testing-framework.md)) — one-time setup:
`pnpm exec playwright install` to download a browser. It's not part of the pre-push hook (too slow
for a local hook) or `pnpm install` (would slow down every install for contributors who never run
it) — CI runs it on every PR.

## Scripts

| Command | Does |
|---|---|
| `pnpm dev` | Start the dev server |
| `pnpm build` | Production build |
| `pnpm test` | Run the test suite (Vitest) |
| `pnpm test:coverage` | Run the test suite and generate coverage reports |
| `pnpm test:e2e` | Run the end-to-end suite (Playwright) against a production build |
| `pnpm biome check` | Lint + format check |
| `pnpm typecheck` | Type check (`tsc --noEmit`) |
| `pnpm db:generate` | Generate a Drizzle migration from `db/schema.ts` |
| `pnpm db:push` | Push the schema to `DATABASE_URL` |
| `pnpm generate:puzzle-cycle` | Regenerate `data/puzzle-cycle.json` (extend the puzzle horizon) |

## How it's built

- **Stack**: Next.js (App Router) on Node 24, TypeScript, pnpm, Drizzle ORM + Neon Postgres,
  Vitest, Biome. Hosted on Vercel, source on GitHub. See [`docs/adr/`](docs/adr/) for the reasoning
  behind each choice.
- **Rules**: the game's non-negotiable rules (hint thresholds, daily selection, privacy
  guarantees) live in [`.specify/memory/constitution.md`](.specify/memory/constitution.md) — that
  file is the source of truth if anything else disagrees with it.
- **Privacy**: no accounts. Guesses, streaks, and stats stay in your browser's local storage.
  Anonymous visit analytics are opt-in only and never paired with ads or profiling.
- **Data**: city data in [`data/cities.json`](data/cities.json) — population figures from CBS, photos from
  Wikimedia Commons with credit/license shown in-app.

The full feature spec, implementation plan, and task breakdown are under
[`specs/001-daily-city-puzzle/`](specs/001-daily-city-puzzle/).

## Agent instructions

[`CLAUDE.md`](CLAUDE.md) is the canonical source for AI agent instructions; run
`node scripts/sync-agent-instructions.mjs` after editing it to regenerate
[`.github/copilot-instructions.md`](.github/copilot-instructions.md) — CI checks they stay in sync.

## Contributing

Bug reports, data corrections (wrong population figure, photo credit, etc.), and small focused
PRs are welcome — see [`.github/CONTRIBUTING.md`](.github/CONTRIBUTING.md).

## License

[MIT](LICENSE) for the code. City photos and population data carry their own individual
credit/license — see the license note at the end of the [`LICENSE`](LICENSE) file and
[`app/privacy`](app/privacy).

## Contact

pascalroose@outlook.com — see [`app/privacy`](app/privacy) for the full privacy policy.
