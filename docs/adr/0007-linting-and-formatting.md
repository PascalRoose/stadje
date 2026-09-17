# 0007. Linting and formatting: Biome

Date: 2026-09-17

## Status

Accepted

## Context

The project needs consistent code style and lint checks enforced in CI. Options considered: the
traditional ESLint + Prettier pair (mature, widest plugin ecosystem, including `eslint-config-next`
for Next.js-specific rules) versus Biome (a single Rust-based tool doing both linting and
formatting, near-zero config, avoids ESLint/Prettier rule-conflict issues). Per constitution
Principle V (simplicity, minimal dependencies) and since the stack doesn't otherwise depend on
`eslint-config-next`'s Next-aware rules, Biome was recommended and the project owner chose it.

## Decision

Linting and formatting use Biome, not a separate ESLint + Prettier setup. Biome is enforced in CI.

## Consequences

- One tool and one config file instead of two, with no ESLint/Prettier conflict surface.
- Loses `eslint-config-next`'s Next.js-specific lint rules; if a Next-specific lint gap becomes a
  real problem, revisit via a new ADR rather than silently adding ESLint alongside Biome.
- CI ([ADR 0001](0001-source-control-and-ci-cd.md)) runs Biome's check as a required gate.
