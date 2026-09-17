# 0010. Dual AI agent tooling compatibility: Claude Code and GitHub Copilot

Date: 2026-09-17

## Status

Accepted

## Context

The project owner wants Stadje to remain usable with both Claude Code and GitHub Copilot. The two
tools have no shared native instruction location: Claude Code reads `CLAUDE.md` (repo root) plus
`.claude/` for skills, subagents, and slash commands; GitHub Copilot reads
`.github/copilot-instructions.md` for repo-wide custom instructions (and optionally
`.github/instructions/*.instructions.md` for path-scoped ones). Copilot has no equivalent of
Claude's "skills." Hand-maintaining two separate instruction documents risks silent drift between
them.

## Decision

`CLAUDE.md` is the single canonical source for shared agent instructions (general project
conventions, workflow, constraints). `.github/copilot-instructions.md` is generated/kept in sync
from `CLAUDE.md` rather than hand-maintained separately; CI fails if it is out of sync with its
source. Claude-specific automation under `.claude/` (skills, subagents, commands) stays
Claude-only, since Copilot has no equivalent construct to sync it to.

## Consequences

- Shared guidance is written once, in `CLAUDE.md`, and reaches both tools.
- A generation script and a CI drift-check need to be built (not yet implemented as of this ADR —
  see the constitution's Next Actions); until then this decision is recorded but not yet enforced.
- `.claude/` skills/subagents/commands remain a Claude-only capability surface; Copilot users of
  this repo won't have an equivalent, by design.
