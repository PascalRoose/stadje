# Implementation Plan: Automated Dependency Updates

**Branch**: `002-dependabot-updates` | **Date**: 2026-09-17 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/002-dependabot-updates/spec.md`

## Summary

Configure GitHub Dependabot to inspect npm/pnpm and GitHub Actions dependencies once per week, wait two days before proposing newly released versions, group updates where possible, update `pnpm-lock.yaml` with package manifest changes, and rely on the existing Node.js 24 CI workflow as the compatibility gate.

## Technical Context

**Language/Version**: YAML repository configuration; Node.js 24 is the supported runtime

**Primary Dependencies**: GitHub Dependabot; existing pnpm and GitHub Actions workflows

**Storage**: N/A

**Testing**: Existing CI checks: Biome, TypeScript, Vitest, and Next.js build on Node.js 24

**Target Platform**: GitHub repository metadata and GitHub Actions

**Project Type**: Next.js web application with repository automation

**Performance Goals**: One scheduled version-update scan per week; no application runtime impact

**Constraints**: Preserve pnpm lockfile integrity, wait at least 48 hours after release, and do not merge updates that fail Node.js 24 CI

**Scale/Scope**: Root `package.json`/`pnpm-lock.yaml` and all versioned actions under `.github/workflows/`

## Constitution Check

**Gate: PASS.** The change preserves the mandated TypeScript, Node.js 24, pnpm, Biome, Vitest, GitHub CI, and devcontainer stack. It adds no runtime dependency or service, and ADR 0013 records the repository automation decision. Node.js 24 compatibility is validated by the existing CI workflow rather than by a second package manager or custom update service.

## Project Structure

### Documentation

```text
specs/002-dependabot-updates/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── tasks.md
```

### Repository Changes

```text
.github/
├── dependabot.yml
└── workflows/
    └── ci.yml
docs/adr/
├── README.md
└── 0013-dependabot-dependency-updates.md
```

**Structure Decision**: Keep the implementation in repository metadata: update `.github/dependabot.yml`, retain the existing `.github/workflows/ci.yml` as the validation gate, and document the choice in ADR 0013. No application source or dependency manifest changes are needed.

## Design Decisions

- Use `package-ecosystem: npm` for the pnpm project; Dependabot discovers `package.json` and `pnpm-lock.yaml` from the root directory.
- Use `schedule.interval: weekly` for both npm and GitHub Actions entries.
- Use `cooldown.default-days: 2` for a 48-hour version-release grace period.
- Group wildcard dependency updates separately for npm and GitHub Actions where possible.
- Set the open version-update pull request limit to five and apply the `dependencies` label.
- Allow the existing Node.js 24 CI workflow to reject incompatible updates rather than adding custom engine-resolution logic.

## Complexity Tracking

No constitution violations. The feature uses existing repository automation and CI surfaces.
