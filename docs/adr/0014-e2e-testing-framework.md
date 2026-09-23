# 0014. End-to-end testing framework: Playwright

Date: 2026-09-23

## Status

Accepted

## Context

[ADR 0006](0006-testing-framework.md) committed to Vitest for Constitution Principle IV's required
coverage: win path, 6-guess loss path, duplicate-guess rejection, and hint-tier boundary cases.
That suite (230 tests, ~79.5% coverage as of this ADR) already satisfies Principle IV's literal
requirement — Vitest is not being replaced. But every one of those assertions runs against jsdom
or a directly-invoked route handler: real debounced-autocomplete timing (`GuessInput`'s 175ms
debounce), real DOM attribute rendering (`data-tier` on `GuessTable`'s cells), and real client-side
routing/navigation are all structurally outside what jsdom can exercise. No e2e/browser-automation
tooling exists in the repo at all today.

## Decision

End-to-end tests are written with Playwright (`@playwright/test`), under `tests/e2e/*.spec.ts` — a
separate subdirectory and file extension from Vitest's `tests/**/*.test.ts`, so the two runners
never collide. Initial scope is exactly the four Principle IV-mandated scenarios (win, 6-guess loss,
duplicate-guess rejection, hint-tier rendering), driven against a known, deterministic archive date
(`data/puzzle-cycle.json` via `LAUNCH_DATE`) rather than mocking system time in a real browser.

Playwright over Cypress: bundled browser binaries and auto-waiting reduce flakiness-prone manual
waits, first-class TypeScript and GitHub Actions support, and a single `@playwright/test` install
with no separate runner/dashboard dependency.

CI runs the suite against a production build (`pnpm build && pnpm start`, via Playwright's own
`webServer` option — not `next dev`) on every PR, in a dedicated `e2e` job, but it is **not** (yet)
a required branch-protection check — a deliberate, temporary trade-off while flakiness sources
(the debounced autocomplete, and the live outbound Wikimedia fetch inside
`app/api/puzzle/image/route.ts`) are characterized. Chromium only in CI, for cost/speed; other
browsers are available on demand locally via additional Playwright `projects`.

World-stats/DB-backed flows are out of e2e scope — CI has no real Neon database, and e2e is scoped
to UI/gameplay flows only; the DB-layer test harness (ADR-adjacent, see the Phase 2 test-strategy
work) already covers that path with a real Postgres engine (`pglite`) at the Vitest layer.

## Consequences

- A second test runner/tool and CI job, adding a devDependency and CI minutes — additive to, not a
  replacement for, ADR 0006's Vitest coverage.
- `pnpm test:e2e` is deliberately **not** added to the `pre-push` git hook (a full production build
  plus browser launch is too slow for a local hook, and would hit the real Wikimedia network
  dependency) — it stays CI-only, plus opt-in locally.
- One-time local browser install (`pnpm exec playwright install`) is a README note, not a
  `postinstall` script, so `pnpm install` stays fast for contributors who never run e2e locally.
- Because the `e2e` job isn't a required check yet, a red run doesn't block merges — promoting it
  to required, once flakiness is characterized, is tracked as explicit follow-up work rather than
  done here.
- Specs deliberately never assert that the proxied puzzle photo actually loads — `/api/puzzle/image`
  makes a real network call to Wikimedia Commons on every request, an external dependency none of
  the four mandated scenarios need.
