# 0006. Testing framework: Vitest

Date: 2026-09-17

## Status

Accepted

## Context

Constitution Principle IV requires automated tests for puzzle selection, hint-tier computation,
win/loss state, and streak/statistics updates, including exact boundary cases at the hint-tier
cutoffs (10%/25% population, 25 km distance). A JavaScript/TypeScript test runner was needed. The
project owner specified Vitest directly.

## Decision

Automated tests are written with Vitest.

## Consequences

- Fast, native ESM/TypeScript support without extra transpilation config, fitting the Next.js/
  TypeScript stack ([ADR 0002](0002-application-framework-and-runtime.md), [ADR
  0008](0008-language.md)).
- Principle IV's required coverage (win path, 6-guess loss path, duplicate-guess rejection, tier
  boundaries) is implemented as Vitest test suites.
- CI ([ADR 0001](0001-source-control-and-ci-cd.md)) runs `vitest` (or `vitest run`) as a required
  check before merge/deploy.
