# 0004. Package manager: pnpm

Date: 2026-09-17

## Status

Accepted

## Context

A JavaScript/TypeScript package manager was needed for dependency installation and script running
in CI ([ADR 0001](0001-source-control-and-ci-cd.md)) and locally. Options considered: npm (Node's
bundled default, no setup), pnpm (fast, disk-efficient, strict `node_modules`, first-class Vercel
and GitHub Actions support), Yarn Berry, and Bun. Bun was set aside as riskier given its rougher
Node-compat and Vitest interop against the project's Node 22/24 target ([ADR
0002](0002-application-framework-and-runtime.md)). npm was offered as the zero-setup default; the
project owner chose pnpm instead.

## Decision

pnpm is the package manager. The lockfile is `pnpm-lock.yaml`.

## Consequences

- Faster, more disk-efficient installs than npm, with native support in both Vercel and GitHub
  Actions.
- All contributors and CI steps must use `pnpm` rather than `npm`/`yarn` commands.
- `pnpm-lock.yaml` is the single source of truth for resolved dependency versions and must be
  committed.
