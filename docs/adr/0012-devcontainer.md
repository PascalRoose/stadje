# 0012. Development environment: devcontainer

Date: 2026-09-17

## Status

Accepted

## Context

The stack (Next.js on Node 24, pnpm, Drizzle, Vitest, Biome, TypeScript — ADRs
[0002](0002-application-framework-and-runtime.md), [0004](0004-package-manager.md)–
[0008](0008-language.md)) requires a specific toolchain to work locally. As a solo/hobby project
that may still pick up contributors or be set up on a new machine, the project owner wanted a
zero-manual-setup way to get a working environment, rather than relying on a README's list of
"install X, then Y."

## Decision

The project ships a devcontainer under `.devcontainer/`, providing a ready-to-use Node 24 + pnpm
environment (usable with GitHub Codespaces, VS Code Dev Containers, or any other devcontainer-
compatible tool). It uses Microsoft's prebuilt `javascript-node:24-bookworm` image directly rather
than a custom `Dockerfile` — nothing about this project's toolchain needs image-level
customization beyond enabling `pnpm` via `corepack` (Principle V: no infrastructure beyond what's
actually needed).

## Consequences

- A contributor (or the project owner, on a new machine) can get a working environment by opening
  the repo in a devcontainer-compatible tool, with no manual Node/pnpm install steps.
- The devcontainer's base image and Node version need to be kept in sync with ADR
  [0002](0002-application-framework-and-runtime.md)'s Node 24 requirement as that requirement
  evolves.
- Built as `.devcontainer/devcontainer.json` — `postCreateCommand` runs `corepack enable` +
  `pnpm install` automatically; the Biome VS Code extension and format-on-save are preconfigured
  since ADR [0007](0007-linting-and-formatting.md) doesn't have a separate ESLint/Prettier
  extension to conflict with.
