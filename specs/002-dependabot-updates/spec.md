# Feature Specification: Automated Dependency Updates

**Feature Branch**: `002-dependabot-updates`

**Created**: 2026-09-17

**Status**: Draft

**Input**: User description: "Let's set up Dependabot for this repo. Help me create an ADR and implement using speckit"

## User Scenarios & Testing

### User Story 1 - Keep dependencies current (Priority: P1)

As a repository maintainer, I want automated update proposals for application and GitHub Actions dependencies so that security fixes and routine updates are visible without manually checking every dependency.

**Why this priority**: Keeping dependencies current reduces avoidable security exposure and maintenance effort while preserving maintainer control over what is merged.

**Independent Test**: Inspect the repository configuration and verify that supported dependency manifests and workflow action references are covered by a recurring update schedule and produce reviewable pull requests.

**Acceptance Scenarios**:

1. **Given** the repository has dependencies in its package manifest and lockfile, **When** the scheduled update check runs, **Then** Dependabot can create pull requests for available dependency updates.
2. **Given** the repository has versioned GitHub Actions in workflow files, **When** an action update is available, **Then** Dependabot can create a pull request for that action update.
3. **Given** multiple updates are available for the same dependency category, **When** the weekly check creates proposals, **Then** updates are grouped where possible to limit review noise while incompatible or major updates remain individually reviewable.

### User Story 2 - Validate updates through existing project checks (Priority: P2)

As a repository maintainer, I want dependency update proposals to use the repository's existing automated checks so that updates are not merged without the same quality validation as other changes.

**Why this priority**: Automated proposals are only useful if their impact can be evaluated consistently before merging.

**Independent Test**: Open a generated dependency update pull request and verify that the repository's CI workflow is triggered and reports its checks on the pull request.

**Acceptance Scenarios**:

1. **Given** a Dependabot pull request is opened, **When** GitHub processes the pull request, **Then** the existing CI checks run against the proposed dependency changes.
2. **Given** a dependency update causes a lint, type, test, or build failure, **When** the checks complete, **Then** the pull request remains visibly failed for maintainer review rather than being silently accepted.

### Edge Cases

- Dependabot performs version update checks only on the configured weekly schedule; no daily or per-commit version update scan is configured.
- A version released less than 48 hours ago is not proposed during a scheduled check.
- If no updates are available during a scheduled check, no empty or meaningless pull request is created.
- If an update cannot be applied cleanly to the lockfile, Dependabot reports the update failure without modifying application source files.
- If an update pull request exceeds the configured open pull request limit, later proposals wait until an existing proposal is merged or closed.
- Major updates remain distinguishable from grouped routine updates so maintainers can review compatibility risk separately.

## Requirements

### Functional Requirements

- **FR-001**: The repository MUST request automated update proposals for its npm-compatible package manifest and lockfile.
- **FR-002**: The repository MUST request automated update proposals for GitHub Actions referenced by repository workflows.
- **FR-003**: Dependency checks MUST run on a recurring weekly schedule.
- **FR-004**: Dependency updates MUST be grouped where possible to reduce pull request noise.
- **FR-005**: Updates that cannot be safely grouped, including incompatible or major updates, MUST remain reviewable as separate proposals.
- **FR-006**: The update service MUST limit the number of simultaneously open proposals to a bounded value appropriate for a small hobby project.
- **FR-007**: Dependency update pull requests MUST be labeled so maintainers can identify them quickly.
- **FR-008**: Dependency update pull requests MUST use the repository's existing CI checks before they can be considered ready for merge.
- **FR-009**: The update configuration MUST cover both direct project dependencies and dependencies declared in GitHub workflow action references.
- **FR-010**: npm dependency update proposals MUST update the package lockfile together with the package manifest when dependency versions change.
- **FR-011**: Dependency update proposals MUST be validated against the repository's supported Node.js 24 runtime by the existing CI checks before merge.
- **FR-012**: The update policy MUST apply a 2-day cooldown so that a version is at least 48 hours old before it is proposed.

## Key Entities

- **Dependency source**: A package manifest/lockfile or GitHub Actions workflow that declares a versioned dependency.
- **Dependency update proposal**: A reviewable pull request containing one or more compatible dependency changes and the associated validation results.
- **Update policy**: The schedule, grouping, labeling, and concurrency rules that govern proposals.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Within one weekly cycle, every supported dependency source has been checked for available updates.
- **SC-002**: Every generated dependency update proposal is associated with the repository's existing CI checks before merge review.
- **SC-003**: Updates for the same dependency source are grouped where possible so that one weekly cycle creates no more than five open routine proposals.
- **SC-004**: A maintainer can identify dependency update proposals from their labels and update titles without opening the changed files.
- **SC-005**: No dependency update can be merged through the normal pull request process when the Node.js 24 CI validation fails.
- **SC-006**: No generated update proposal targets a package version released fewer than 48 hours before the weekly check.

## Assumptions

- Dependabot is available as a native GitHub repository feature and requires no application runtime dependency.
- The existing CI workflow remains the source of truth for linting, type checking, tests, and builds.
- Weekly version updates are frequent enough for this small repository.
- A maximum of five open proposals is a reasonable default that avoids overwhelming a solo maintainer while allowing several independent updates.
- Dependabot configuration is repository metadata and does not require a new application test suite; existing CI validates Node.js 24 compatibility.
- A 2-day release cooldown is acceptable because the repository prioritizes stable, reviewed updates over immediate version adoption.