# Tasks: Automated Dependency Updates

**Input**: Design documents from `/specs/002-dependabot-updates/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `quickstart.md`

## Phase 1: Setup

**Purpose**: Confirm the repository surfaces used by the implementation.

- [X] T001 [P] Verify the root npm manifest and pnpm lockfile paths in `package.json` and `pnpm-lock.yaml`.
- [X] T002 [P] Inventory versioned GitHub Actions under `.github/workflows/` for the `github-actions` ecosystem entry.

## Phase 2: Foundational

**Purpose**: Establish the policy constraints before writing configuration.

- [X] T003 Confirm the existing `.github/workflows/ci.yml` runs lint, type, test, and build checks on Node.js 24.
- [X] T004 Confirm ADR 0013 documents weekly scans, grouping, two-day cooldown, lockfile updates, and Node.js 24 validation in `docs/adr/0013-dependabot-dependency-updates.md`.

## Phase 3: User Story 1 - Keep dependencies current (Priority: P1) 🎯 MVP

**Goal**: Configure weekly, grouped Dependabot proposals for npm/pnpm and GitHub Actions dependencies.

**Independent Test**: Inspect `.github/dependabot.yml` and verify both ecosystems use weekly schedules, a 2-day cooldown, grouping, labels, and a five-proposal limit.

- [X] T005 [US1] Configure the npm ecosystem in `.github/dependabot.yml` for the root `package.json` and `pnpm-lock.yaml` with a weekly schedule.
- [X] T006 [US1] Configure `cooldown.default-days: 2` for npm and GitHub Actions version updates in `.github/dependabot.yml`.
- [X] T007 [US1] Add wildcard grouping, the `dependencies` label, and `open-pull-requests-limit: 5` to each ecosystem entry in `.github/dependabot.yml`.
- [X] T008 [US1] Configure the `github-actions` ecosystem in `.github/dependabot.yml` for workflow action references with a weekly schedule.
- [X] T009 [US1] Verify the final Dependabot YAML has no daily or per-commit version-update schedule and preserves lockfile discovery for pnpm.

**Checkpoint**: Dependabot policy is complete and independently reviewable.

## Phase 4: User Story 2 - Validate updates through existing project checks (Priority: P2)

**Goal**: Ensure generated dependency proposals are evaluated against the supported Node.js 24 project checks.

**Independent Test**: Run the repository CI commands locally under Node.js 24 and verify they pass against the current lockfile.

- [X] T010 [US2] Verify `.github/workflows/ci.yml` remains triggered for pull requests opened by Dependabot.
- [X] T011 [US2] Run the quickstart validation commands from `specs/002-dependabot-updates/quickstart.md` under Node.js 24.
- [X] T012 [US2] Confirm the npm policy permits Dependabot to update `pnpm-lock.yaml` alongside `package.json` when resolution changes.

**Checkpoint**: Dependency proposals have the same Node.js 24 quality gate as normal pull requests.

## Phase 5: Polish and Cross-Cutting Validation

- [X] T013 [P] Validate `.github/dependabot.yml` syntax and required keys against GitHub's Dependabot configuration reference.
- [X] T014 Run `pnpm biome check .` and `pnpm exec tsc --noEmit` after configuration changes.
- [X] T015 Run `pnpm test` and `pnpm build` as the final Node.js 24 compatibility validation.
- [X] T016 Update the ADR index in `docs/adr/README.md` if the ADR title or number changes during implementation.

## Dependencies and Execution Order

- Phase 1 has no dependencies.
- Phase 2 depends on Phase 1 and blocks user story work.
- User Story 1 depends on Phase 2 and is the MVP.
- User Story 2 depends on Phase 2 and validates the existing CI integration; it can begin after T003.
- Phase 5 depends on the completed configuration and validation tasks.

## Parallel Opportunities

- T001 and T002 can run in parallel.
- T013 and T016 can run in parallel after configuration is complete.
- T014 and T015 are sequential because T015 is the final broader validation after static checks.

## Implementation Strategy

### MVP First

1. Complete setup and foundational checks.
2. Implement User Story 1 in `.github/dependabot.yml`.
3. Validate the configuration, then proceed to the CI compatibility checks.

### Incremental Delivery

1. Land the Dependabot policy with weekly schedules, grouping, cooldown, labels, and limits.
2. Verify Dependabot pull requests use the existing Node.js 24 CI gate.
3. Run the complete local validation suite before merge.

## Notes

- Every task includes a concrete repository path.
- Dependabot configuration does not require a new application test suite; existing CI is the compatibility test.
