# 0001. Source control and CI/CD on GitHub

Date: 2026-09-17

## Status

Accepted

## Context

Stadje needs a system of record for source control and a place to run CI/CD (tests, lint,
deploy gating) before code reaches production. As a solo hobby project, the owner wanted a
single, low-friction platform rather than stitching together separate tools for hosting the repo
and running pipelines.

## Decision

GitHub is the system of record for source control. CI/CD runs on GitHub itself (e.g. GitHub
Actions), gating merges and deploys.

## Consequences

- Repo hosting, PRs/issues, and CI/CD live in one place with no extra integration work.
- Vercel's GitHub integration (see [ADR 0003](0003-hosting-and-database.md)) deploys directly from
  this repo without a separate CI-to-hosting handoff.
- Any future move off GitHub would also require re-plumbing CI/CD, not just the repo host.
