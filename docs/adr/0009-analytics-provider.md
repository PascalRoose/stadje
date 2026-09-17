# 0009. Analytics provider: Vercel Analytics

Date: 2026-09-17

## Status

Accepted

## Context

Constitution Principle VI (local-first privacy) permits anonymous visit analytics only if it is
opt-in, revocable, and never paired with ads or personal profiling — reflected in the app's
in-mockup cookie-consent screen. Since hosting is already on Vercel ([ADR
0003](0003-hosting-and-database.md)), the project owner decided a separate third-party analytics
provider is unnecessary: Vercel Analytics covers this need natively.

## Decision

Anonymous visit analytics use Vercel Analytics, not a separate third-party analytics provider. It
remains gated behind the same opt-in consent action required by Principle VI.

## Consequences

- No additional analytics vendor/SDK to integrate or evaluate for privacy compliance — one less
  third-party script that could otherwise leak player IPs (consistent with the font-hosting
  constraint in Principle VI).
- Analytics activation must still be wired to the app's consent banner; it is not on by default.
- Ties analytics to the Vercel hosting choice — revisiting hosting ([ADR
  0003](0003-hosting-and-database.md)) would also require revisiting analytics.
