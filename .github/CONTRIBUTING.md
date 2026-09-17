# Contributing to Stadje

Thanks for taking a look. This is a solo hobby project, so keep expectations modest — but bug
reports, data corrections, and small focused PRs are genuinely welcome.

## Before you start

- For anything beyond a small fix, open an issue first so we're aligned before you spend time on
  it.
- Read [`.specify/memory/constitution.md`](../.specify/memory/constitution.md) before touching
  game logic (hint tiers, daily selection, streaks) — those rules are treated as non-negotiable,
  and changing one is a constitution amendment, not just a code change.
- A real architectural or technical decision (new dependency, new service, changed data flow)
  gets an ADR under [`docs/adr/`](../docs/adr/) — see [`docs/adr/README.md`](../docs/adr/README.md).

## Local setup

```bash
pnpm install
pnpm dev
```

No `DATABASE_URL` is needed to play locally — see the [README](../README.md#quick-start).
Installing dependencies also sets up local git hooks (pre-commit lint/typecheck, pre-push tests)
via `simple-git-hooks`.

## Before opening a PR

```bash
pnpm biome check .
pnpm exec tsc --noEmit
pnpm test
pnpm build
```

All four run in CI and must pass. Biome (not ESLint/Prettier) is the linter/formatter — run
`pnpm format` to auto-fix formatting.

## Style

- Keep the stack small — see constitution Principle V ("Simplicity & Minimal Dependencies")
  before adding a dependency.
- Follow existing patterns in the codebase; this project doesn't use a separate style guide.
