# ADR 0013: Automated dependency updates with Dependabot

**Status**: Accepted

**Date**: 2026-09-17

## Context

Stadje depends on npm packages and GitHub Actions that receive security and maintenance updates. The project is maintained as a small hobby application, so manually checking every dependency is costly and easy to overlook. The repository already has a CI workflow that validates linting, types, tests, and builds on pull requests.

We need a low-maintenance way to discover updates while keeping the maintainer in control of merges and avoiding a large stream of noisy pull requests.

## Decision

Use GitHub Dependabot configuration to check the npm-compatible project dependencies and GitHub Actions dependencies once per week. Apply a 2-day cooldown so proposed versions are at least 48 hours old, group updates where possible, keep updates that cannot be safely grouped separately reviewable, label update pull requests as dependencies, and cap the number of open Dependabot pull requests at five.

Dependabot pull requests will update the package lockfile alongside the package manifest and rely on the existing GitHub Actions CI workflow, which runs on Node.js 24, for compatibility validation. No runtime dependency, application code, or additional update service will be introduced.

## Consequences

### Positive

- Security and maintenance updates are surfaced automatically.
- Existing CI remains the single validation path for proposed dependency changes.
- Grouping and the open pull request limit reduce review noise for a solo maintainer.
- Dependabot is native to GitHub and adds no application runtime or hosting cost.
- The cooldown avoids proposing versions before they have had two days to surface early regressions.

### Negative

- Weekly update pull requests still require human review and merge decisions.
- Grouped routine updates can make it less obvious which individual package caused a failure.
- Major updates may require manual compatibility work before they can be merged.
- Updates are intentionally delayed by 48 hours rather than proposed immediately after release.

### Operational Notes

- Update behavior is configured in `.github/dependabot.yml`.
- Changes to the update schedule, grouping policy, or open pull request limit should update this ADR or supersede it with a replacement decision.