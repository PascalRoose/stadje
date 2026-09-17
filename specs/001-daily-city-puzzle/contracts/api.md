# API Contract: Daily City Puzzle

These are the only server interfaces this feature exposes — the app's own `app/api/*` route
handlers (see `plan.md`'s Project Structure). There is no authentication anywhere (constitution
Principle VI: no accounts). Every request/response body is JSON.

**Cross-cutting rule**: no endpoint ever accepts a client-supplied "today" for the *live* puzzle —
the server always resolves Europe/Amsterdam "today" itself (research.md). A `date` path/query
param may reference any date from the game's launch date up to and including server-resolved
today; a future date is rejected (`400`).

## `GET /api/puzzle?date=YYYY-MM-DD`

Fetches what's needed to display a puzzle's photo — never the answer's identity.

- `date` optional, defaults to server-resolved Europe/Amsterdam today.
- **200**:
  ```json
  { "date": "2026-09-17", "imageUrl": "/api/puzzle/image?date=2026-09-17", "imageCredit": { "owner": "...", "license": "..." } }
  ```
- **400**: `date` is in the future, or before the game's launch date.

Implements FR-002. Deliberately excludes `cityId`/`name` — see research.md's server-side-hints
decision. `imageUrl` is always this app's own proxy path (below), never the origin Wikimedia URL,
and `imageCredit` omits the `source` link pre-guess — both the origin URL's filename and the
Commons file-page URL routinely embed the place name (e.g. `Veendam_105.JPG`), which would leak
the answer before any guess. `source` is included in the win/loss reveal instead (see below).

## `GET /api/puzzle/image?date=YYYY-MM-DD`

Streams the day's photo through this app's own origin, so the client never sees the upstream
Wikimedia URL (whose filename would leak the answer — see above). Not "re-hosting" in the storage
sense (research.md's `next/image` decision still holds): nothing is stored, each request streams
the upstream image through directly.

- **200**: the image bytes, with the upstream `Content-Type`.
- **400**: `date` invalid per the cross-cutting rule.
- **502**: the upstream image couldn't be fetched.

## `POST /api/puzzle/guess`

Checks one candidate guess against a date's real answer and returns its hints. Stateless — see
research.md's "no server-side per-player guess state" decision; the client enforces the 6-guess
limit and duplicate rejection itself (FR-004, FR-005) before ever calling this.

- **Request**:
  ```json
  { "date": "2026-09-17", "cityId": "utrecht" }
  ```
- **200** (incorrect guess):
  ```json
  {
    "cityId": "utrecht",
    "displayName": "Utrecht",
    "correct": false,
    "hints": {
      "province": { "match": false, "tier": "red" },
      "population": { "direction": "lower", "tier": "orange" },
      "distance": { "km": 49, "direction": "SW", "tier": "red" }
    }
  }
  ```
- **200** (correct guess) — same shape, `"correct": true`, plus a `reveal` object:
  ```json
  {
    "cityId": "dordrecht",
    "displayName": "Dordrecht",
    "correct": true,
    "hints": {
      "province": { "match": true, "tier": "green" },
      "population": { "direction": "equal", "tier": "green" },
      "distance": { "km": 0, "direction": null, "tier": "green" }
    },
    "reveal": { "name": "Dordrecht", "province": "Zuid-Holland", "population": 119115, "populationSource": "CBS", "populationDate": "2026", "imageSource": "https://commons.wikimedia.org/wiki/File:..." }
  }
  ```
- **400**: `cityId` doesn't resolve to a known city, or `date` invalid per the cross-cutting rule.

Implements FR-006, FR-007, FR-008 (win path — the `reveal` here is exactly FR-010's reveal on a
win). Constitution Principle III (v2.0.0): `province`, `population`, and `distance` are each
classified independently, not combined into one verdict — `province.tier` is only ever `green` or
`red` (no orange), and `distance.tier` is `green` only when `km === 0` (the correct city), never
for any other closeness. A guess is green across all three only when it's the correct city.

## `GET /api/puzzle/reveal?date=YYYY-MM-DD`

Explicit reveal for the **loss** path (FR-009/FR-010) — the client calls this only once its own
local guess count for that date has reached 6 without a correct guess. Not called automatically or
pre-fetched (that would spoil the game for anyone who merely loaded the page).

- **200**:
  ```json
  { "name": "Dordrecht", "province": "Zuid-Holland", "population": 119115, "populationSource": "CBS", "populationDate": "2026", "imageSource": "https://commons.wikimedia.org/wiki/File:..." }
  ```
- **400**: `date` invalid per the cross-cutting rule.

There is no server-side check that the caller "really" used 6 guesses (stateless server, per
research.md) — a player could call this early and spoil the game for themselves, which is their own
choice and not a security concern this API needs to prevent.

## `GET /api/world-stats?date=YYYY-MM-DD`

Reads today's (or a past date's) opted-in aggregate stats (FR-024, US6).

- **200** (enough data):
  ```json
  {
    "date": "2026-09-17",
    "playersCount": 8412,
    "correctPercentage": 71,
    "averageGuesses": 4.1,
    "mostCommonFirstGuess": { "cityId": "utrecht", "displayName": "Utrecht" },
    "fastestSolveGuesses": 1
  }
  ```
- **200** (not enough data — spec edge case):
  ```json
  { "date": "2026-09-17", "insufficientData": true }
  ```
  Returned when `playersCount` is below a small minimum threshold (implementation detail, not a
  spec-level number) rather than showing a misleading 0%/empty average.

## `POST /api/world-stats`

Submits one anonymous, opt-in-only completed-puzzle result to increment that date's aggregate
counters (FR-024). Only ever called by a client whose stored `consent.analyticsOptIn` is `true`
(FR-017) — never called otherwise, and never includes any player identifier.

- **Request**:
  ```json
  { "date": "2026-09-17", "won": true, "guessCount": 4, "firstGuessCityId": "utrecht" }
  ```
- **204**: counters incremented.
- **400**: `date` invalid, or `guessCount` outside 1–6.

No response body — this is fire-and-forget from the client's perspective, matching the "pure
aggregate counters, no per-completion rows" decision in research.md.
