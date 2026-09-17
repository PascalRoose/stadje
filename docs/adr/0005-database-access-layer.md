# 0005. Database access layer: Drizzle ORM

Date: 2026-09-17

## Status

Accepted

## Context

With Postgres on Neon chosen for server-side storage ([ADR
0003](0003-hosting-and-database.md)), the app needs a way to query it from TypeScript code. Options
considered: raw SQL via the `pg` driver or Neon's serverless driver (full control, no type safety),
a query builder, or a full ORM (Prisma). Prisma offers more scaffolding (generated client,
migrations) but adds a build step and engine binary; Drizzle is TypeScript-first, generates
inspectable SQL, has a lighter runtime, and has first-class documented support for Neon's
serverless driver. Given the constitution's Principle V (simplicity, minimal dependencies), Drizzle
was recommended and the project owner chose it.

## Decision

All database access to Neon goes through Drizzle ORM, not raw SQL, a separate query builder, or
another ORM (e.g. Prisma).

## Consequences

- Type-safe queries derived from a TypeScript schema, without Prisma's separate codegen step or
  engine binary.
- Requires TypeScript ([ADR 0008](0008-language.md)) to get Drizzle's type-safety benefit.
- Schema migrations are managed through Drizzle's own tooling (e.g. `drizzle-kit`).
