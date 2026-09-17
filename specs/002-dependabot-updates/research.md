# Research: Automated Dependency Updates

## Decision: Use the npm ecosystem for pnpm dependencies

**Rationale**: Dependabot identifies pnpm projects through the npm ecosystem. The repository's `package.json` and `pnpm-lock.yaml` are the supported manifest and lockfile pair, so no new package manager or update script is needed.

**Alternatives considered**: A custom scheduled workflow would add credentials, code, and maintenance without improving the native GitHub integration.

## Decision: Run version checks weekly with a two-day cooldown

**Rationale**: `schedule.interval: weekly` limits routine version-update scans to once per week. `cooldown.default-days: 2` prevents a newly released version from being proposed until at least 48 hours have passed, giving early regressions time to surface.

**Alternatives considered**: Daily checks are unnecessary for this small hobby project. A three-day default cooldown is Dependabot's current default, but the requested policy is exactly two days.

**Constraint**: Dependabot cooldown applies to version updates, not security updates. GitHub security update behavior is not disabled by this version-update schedule.

## Decision: Group updates per ecosystem where possible

**Rationale**: A wildcard group consolidates compatible updates into a reviewable proposal and reduces pull request noise. Dependabot still creates separate proposals for updates that do not match or cannot be grouped.

**Alternatives considered**: One pull request per dependency would maximize isolation but is disproportionate for a solo maintainer.

## Decision: Let Dependabot update manifests and lockfiles, then validate on Node.js 24

**Rationale**: The npm ecosystem updates `package.json` and `pnpm-lock.yaml` together when required. The existing CI workflow installs with pnpm, runs linting, type checking, tests, and builds on Node.js 24, so it is the authoritative compatibility check.

**Alternatives considered**: Adding a separate compatibility workflow would duplicate existing CI and increase maintenance.