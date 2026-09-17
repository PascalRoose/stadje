# Architecture Decision Records

This directory records significant architectural and technical decisions for Stadje, per the
Development Workflow section of [`.specify/memory/constitution.md`](../../.specify/memory/constitution.md).

Each ADR is a single file, `NNNN-short-title.md`, numbered sequentially, stating its Status
(Proposed / Accepted / Superseded), Context, Decision, and Consequences. An ADR that reverses or
replaces an earlier one marks the earlier ADR Superseded and links to its replacement rather than
being deleted.

ADRs record *why* a technical decision was made. They are distinct from the constitution, which
fixes the game's non-negotiable rules — an ADR cannot justify deviating from a Core Principle.

## Index

| ADR | Title | Status |
| --- | --- | --- |
| [0001](0001-source-control-and-ci-cd.md) | Source control and CI/CD on GitHub | Accepted |
| [0002](0002-application-framework-and-runtime.md) | Application framework and runtime: Next.js on Node 24 | Accepted |
| [0003](0003-hosting-and-database.md) | Hosting and database: Vercel with Neon Postgres | Accepted |
| [0004](0004-package-manager.md) | Package manager: pnpm | Accepted |
| [0005](0005-database-access-layer.md) | Database access layer: Drizzle ORM | Accepted |
| [0006](0006-testing-framework.md) | Testing framework: Vitest | Accepted |
| [0007](0007-linting-and-formatting.md) | Linting and formatting: Biome | Accepted |
| [0008](0008-language.md) | Language: TypeScript | Accepted |
| [0009](0009-analytics-provider.md) | Analytics provider: Vercel Analytics | Accepted |
| [0010](0010-dual-ai-agent-tooling-compatibility.md) | Dual AI agent tooling compatibility: Claude Code and GitHub Copilot | Accepted |
| [0011](0011-daily-puzzle-selection-algorithm.md) | Daily puzzle selection algorithm: shuffle-once, cycle through | Accepted |
| [0012](0012-devcontainer.md) | Development environment: devcontainer | Accepted |
| [0013](0013-dependabot-dependency-updates.md) | Automated dependency updates with Dependabot | Accepted |
