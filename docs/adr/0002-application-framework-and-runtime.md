# 0002. Application framework and runtime: Next.js on Node 24

Date: 2026-09-17

## Status

Accepted

## Context

Stadje needs a web application framework capable of serving a daily-puzzle game with server-side
logic (puzzle selection, hint computation) and a client UI, deployed on Vercel ([ADR
0003](0003-hosting-and-database.md)). The project owner specified Next.js directly. The runtime
target was initially both Node.js 22 and Node.js 24, then narrowed to Node.js 24 only before
implementation started — recorded directly here rather than as a separate superseding ADR, since
nothing had been built against the dual-version requirement yet.

## Decision

The application is built on Next.js, targeting Node.js 24 only.

## Consequences

- Next.js's tight integration with Vercel (same vendor) simplifies deployment and hosting
  configuration.
- Server-side game logic (Principle IV of the constitution: deterministic, testable game logic)
  can live in Next.js route handlers / server components without a separate backend service.
- No dual-version compatibility constraint — any Node 24 API is fine to use; there is no Node 22
  matrix to keep green in CI.
