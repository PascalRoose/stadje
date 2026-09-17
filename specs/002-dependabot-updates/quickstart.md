# Quickstart: Validate Dependabot Configuration

## Prerequisites

- A GitHub repository with Dependabot version updates enabled.
- Node.js 24 and pnpm 12 available locally.

## Static configuration checks

1. Confirm `.github/dependabot.yml` contains exactly two update entries: `npm` and `github-actions`.
2. Confirm both entries use `schedule.interval: weekly`.
3. Confirm both entries use `cooldown.default-days: 2`, grouping, labels, and an open pull request limit.
4. Confirm the npm entry targets `/` so it discovers `package.json` and `pnpm-lock.yaml`.

## Local CI validation

Run the same checks used by the repository workflow:

```sh
pnpm install --frozen-lockfile
pnpm biome check .
pnpm exec tsc --noEmit
pnpm test
pnpm build
```

Expected result: all commands exit successfully under Node.js 24, demonstrating that a Dependabot manifest and lockfile update is evaluated against the supported runtime.

## GitHub validation

After the configuration is available on the default branch, use GitHub's Dependabot update log or wait for the next weekly run. Verify that any generated proposal has the `dependencies` label, includes lockfile changes when npm resolution changes, is grouped where possible, and has the existing CI checks attached.