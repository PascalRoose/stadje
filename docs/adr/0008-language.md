# 0008. Language: TypeScript

Date: 2026-09-17

## Status

Accepted

## Context

The stack's other choices — Drizzle ORM ([ADR 0005](0005-database-access-layer.md)), which derives
its type-safety guarantees from a TypeScript schema, and Vitest ([ADR
0006](0006-testing-framework.md)) — pay off most fully with static types. The project owner chose
TypeScript over plain JavaScript on that basis.

## Decision

The codebase is TypeScript, not plain JavaScript.

## Consequences

- Drizzle's generated types and Next.js's TypeScript support are used end-to-end (schema → query →
  route handler → UI props).
- All new source files are `.ts`/`.tsx`; Biome ([ADR 0007](0007-linting-and-formatting.md)) is
  configured for TypeScript.
- Adds a compile/type-check step to local development and CI that plain JavaScript wouldn't have.
