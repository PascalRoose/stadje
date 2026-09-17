# Feature Specification: Daily City Puzzle

**Feature Branch**: `001-daily-city-puzzle`

**Created**: 2026-09-17

**Status**: Draft

**Input**: User description: "Stadje: a daily Wordle-like Dutch city guessing game, per the ratified constitution (.specify/memory/constitution.md) and the "Stadje UI mockups" design project (13 screens: new game, in-progress/autocomplete, duplicate-guess rejection, won+share, lost, how-it-works, menu, archive, statistics, about, settings, privacy/terms, cookie notice). Build the spec from those two sources plus the ADRs in docs/adr/."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Play Today's Puzzle (Priority: P1)

A player opens Stadje and sees a photo of an unnamed Dutch city. They type into a search box and
pick a city from suggestions. After each guess they see three hints — whether the province is
right, whether the true population is higher or lower and how close they are, and the direction
and distance to the real city. They keep guessing (up to 6 times) until they either name the city
correctly or run out of guesses, at which point the answer is revealed along with their full guess
history and a countdown to tomorrow's puzzle.

**Why this priority**: This is the entire game. Nothing else in the product has value without it.

**Independent Test**: Can be fully tested by playing a single day's puzzle start to finish (win and
lose paths) and confirming hints, guess limits, and the reveal are all correct — no other feature
needs to exist yet.

**Acceptance Scenarios**:

1. **Given** a player has not yet played today's puzzle, **When** they open the game, **Then**
   they see today's city photo (with photographer credit and license) and an empty guess input,
   with 6 guesses available.
2. **Given** a player types a partial city name, **When** matching cities exist, **Then** they see
   a list of matching cities to choose from, and typing text that matches no city does not allow a
   guess to be submitted.
3. **Given** a player selects a valid city as their guess, **When** the guess is submitted,
   **Then** the guess is added to their guess history with three hints (province match, population
   direction + accuracy tier, compass direction + distance), and their remaining guess count
   decreases by one.
4. **Given** a player's guess exactly matches today's answer, **When** the guess is submitted,
   **Then** the puzzle ends in a "won" state showing the number of guesses used, the full guess
   history, and the answer's details.
5. **Given** a player has used all 6 guesses without guessing correctly, **When** their sixth
   incorrect guess is submitted, **Then** the puzzle ends in a "lost" state revealing the answer,
   its details, and the full guess history.
6. **Given** a puzzle has ended (won or lost), **When** the player views the end screen, **Then**
   they see a countdown to the next puzzle (next Europe/Amsterdam midnight).
7. **Given** a player closes and reopens the game before finishing today's puzzle, **When** they
   return, **Then** their guesses so far are still there and they can continue.

---

### User Story 2 - Manage Privacy & Analytics Consent (Priority: P2)

A first-time visitor sees a notice explaining that their game progress stays on their own device
(no consent needed for that) and asking whether anonymous, ad-free visit statistics may also be
collected. They can accept or decline, and can change their mind later from settings.

**Why this priority**: This is a non-negotiable constitutional commitment (local-first privacy,
opt-in-only analytics) and a legal one — it must exist before any analytics collection happens, not
be retrofitted later.

**Independent Test**: Can be fully tested by loading the game as a new visitor, confirming no
analytics activity occurs before a choice is made, and confirming both "accept" and "decline" (and
later toggling the choice in settings) behave correctly — independent of whether any puzzle has
been played.

**Acceptance Scenarios**:

1. **Given** a visitor has never made a consent choice, **When** they open the game, **Then** they
   see a notice distinguishing "always-on, on-device game progress" from "optional anonymous visit
   statistics," with accept/decline actions, and no anonymous statistics are collected yet.
2. **Given** a visitor accepts anonymous statistics, **When** they continue playing, **Then**
   anonymous visit statistics collection is active and no personal profile or advertising data is
   collected alongside it.
3. **Given** a visitor declines, **When** they continue playing, **Then** no anonymous statistics
   are collected, and the game (including saved local progress) works exactly the same.
4. **Given** a player previously made a consent choice, **When** they open settings, **Then** they
   can view and change that choice at any time.

---

### User Story 3 - View Personal Statistics (Priority: P3)

A player who has completed several daily puzzles opens a statistics screen and sees how many
puzzles they've played, their win rate, current and longest streaks, a breakdown of how many
guesses their wins typically took, and which provinces they're strongest and weakest at guessing.

**Why this priority**: Turns a one-off game into a habit by showing players their own progress;
depends on User Story 1 having produced history to summarize.

**Independent Test**: Can be fully tested by simulating a local history of completed puzzles (wins,
losses, varying guess counts and provinces) and confirming the statistics screen summarizes that
history correctly, independent of the archive or sharing features.

**Acceptance Scenarios**:

1. **Given** a player has completed at least one puzzle, **When** they open statistics, **Then**
   they see total played, percentage guessed correctly, current streak, longest streak, and a
   distribution of attempts-to-win.
2. **Given** a player has completed puzzles across multiple provinces, **When** they view
   statistics, **Then** they see their strongest and weakest province by guess accuracy.
3. **Given** a player has never completed a puzzle, **When** they open statistics, **Then** they
   see a clear empty state rather than errors or misleading zeros presented as real data.

---

### User Story 4 - Browse Archive & Play Past Puzzles (Priority: P3)

A player opens an archive of every previous daily puzzle, filterable to all puzzles, puzzles they
guessed correctly, or puzzles they missed. Any past puzzle they haven't played yet, they can play
using the same rules as today's puzzle.

**Why this priority**: Lets players catch up after missing days and extends the game's replay
value; depends on a history of past puzzles existing, but is independent of statistics or sharing.

**Independent Test**: Can be fully tested by simulating several past days' puzzle outcomes
(including some never played) and confirming the archive list, its filters, and playing an
unplayed past puzzle all behave correctly.

**Acceptance Scenarios**:

1. **Given** the game has existed for multiple days, **When** a player opens the archive, **Then**
   they see every past day listed with its outcome (attempts used, or not-yet-played).
2. **Given** a player filters the archive, **When** they choose "guessed" or "missed," **Then**
   only matching days are shown.
3. **Given** a player selects a past puzzle they have not played, **When** they start it, **Then**
   they play it under the same 6-guess/hint rules as the current day's puzzle, and it does not
   affect today's puzzle.
4. **Given** a player selects a past puzzle they already completed, **When** they view it, **Then**
   they see that day's result and full guess history rather than being able to play it again.

---

### User Story 5 - Share a Result (Priority: P4)

After finishing a puzzle (win or lose), a player generates a short summary of their attempt — how
many guesses it took and the pattern of how close each guess was — that they can share with others
without spoiling the answer for people who haven't played yet.

**Why this priority**: A virality/engagement feature layered on top of a completed puzzle; the game
is fully playable and useful without it.

**Independent Test**: Can be fully tested by completing a puzzle (win or lose) and confirming the
generated share content reflects that specific attempt's pattern without containing the answer
city's name.

**Acceptance Scenarios**:

1. **Given** a player has won or lost today's puzzle, **When** they choose to share their result,
   **Then** they receive a summary reflecting their guess count and hint pattern, containing no
   mention of the answer city.
2. **Given** a player generates a share summary, **When** someone who hasn't played today reads
   it, **Then** nothing in it reveals which city was the answer.

---

### User Story 6 - View World Stats (Priority: P4)

A player opens an "About" screen and sees today's aggregate numbers from other players who have
opted in to analytics: how many have played today, what percentage guessed correctly, the average
number of guesses, the most commonly chosen first guess, and the fastest solve of the day.

**Why this priority**: Purely informational, adds social-proof flavor on top of a fully playable
game; meaningless with very few opted-in players, so it trails behind the core loop and personal
stats in priority.

**Independent Test**: Can be fully tested by simulating a pool of opted-in players' completed
puzzles for a given day and confirming the displayed aggregate numbers match that pool exactly,
independent of any player who has not opted in.

**Acceptance Scenarios**:

1. **Given** several players have opted in to analytics and completed today's puzzle, **When** a
   player opens the About screen, **Then** they see today's player count, percentage correct,
   average guesses, most common first guess, and fastest solve, computed only from opted-in
   players.
2. **Given** a player has not opted in to analytics, **When** they complete today's puzzle,
   **Then** their result is not included in the aggregate numbers shown to anyone.
3. **Given** no players (or very few) have opted in and completed today's puzzle yet, **When** the
   About screen is viewed, **Then** it shows a clear "not enough data yet" state rather than a
   misleading number like 0% or an empty average.

---

### Edge Cases

- A player's local guess is exactly at a hint-tier boundary (population exactly 10% or 25% off,
  distance exactly 25 km) — the boundary value itself counts as the closer tier (e.g., exactly 25
  km counts as "warm," not "red"), per the constitution's inclusive (`≤`) thresholds.
- A player is in a timezone far from the Netherlands — their "today" is still defined by
  Europe/Amsterdam midnight, so the puzzle may change mid-afternoon or mid-morning their local
  time; the countdown shown to them must reflect this correctly, not their local midnight.
- A player tries to guess a city already guessed earlier in the same puzzle — the guess is
  rejected and does not consume an attempt.
- A player types a name that matches no city in the dataset — no guess can be submitted.
- A player has cleared their browser storage (or is on a new device) — they start with no history,
  no streak, and no consent choice recorded, exactly as a first-time visitor would.
- A player opens the archive or statistics screen having never played — both must show a clear
  empty state, not an error.
- The current day's puzzle is still open (unfinished) when the next Europe/Amsterdam midnight
  passes — the unfinished puzzle becomes a "missed" day in the archive, and a new puzzle begins;
  an in-progress, unfinished guess history is not lost and remains viewable in the archive. It
  immediately counts toward "total played" in statistics without affecting the streak. The player
  may still complete it later via the archive (FR-016); if they go on to win it there, it updates
  their overall percentage-correct, but never affects the streak — only completing the current
  calendar day's puzzle, on that day, can start or extend a streak.
- Very few or no players have opted in to analytics on a given day — the About screen's world
  stats show a clear "not enough data" state rather than a misleading percentage or average.
- A player requests to share a result before finishing today's puzzle — sharing is only available
  after the puzzle has ended (won or lost).
- Every city in the dataset has now appeared once as a daily answer — the next day's puzzle starts
  a new no-repeat cycle rather than running out of cities.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST select exactly one city as the day's puzzle for every calendar day,
  identical for every player, with the day boundary at midnight in the Europe/Amsterdam time zone
  regardless of a player's own location or device time zone. No city MUST repeat as the daily
  answer until every city in the dataset has appeared exactly once; once every city has appeared,
  selection MUST begin a new such no-repeat cycle.
- **FR-002**: System MUST display a photograph of the day's city, together with its photographer
  or rights-holder credit and license, before the player's first guess.
- **FR-003**: Players MUST enter guesses by typing and selecting a city from a suggestion list
  drawn from the game's city dataset; text that does not match a known city MUST NOT be accepted as
  a guess. The guessable dataset and the pool the daily answer is drawn from MUST be the same
  single list of cities — there is no separate, broader "guessable-only" set. Matching MUST work
  against a city's display name and any of its known aliases; regardless of whether a player typed
  the display name or an alias, the suggestion and the resulting guess MUST be shown using the
  city's display name.
- **FR-004**: System MUST reject a guess that repeats a city already guessed earlier in the same
  day's puzzle, informing the player, without consuming one of their guesses.
- **FR-005**: Players MUST be limited to a maximum of 6 guesses per daily puzzle.
- **FR-006**: After each accepted guess, system MUST show three hints for that guess: (a) whether
  the guessed city's province matches the answer's province, (b) whether the true population is
  higher or lower than the guessed city's population, plus an accuracy tier, and (c) the compass
  direction and distance in whole kilometers from the guessed city to the answer city.
- **FR-007**: System MUST classify each guess's hints into exactly one of three accuracy tiers —
  green, orange ("warm"), or red — using these fixed thresholds: green when the province matches OR
  population is within 10% of the true value; orange when distance is 25 km or less OR population
  is within 25% of the true value; red otherwise.
- **FR-008**: System MUST end a puzzle in a "won" state the moment a player's guess names the
  correct city, recording the number of guesses used.
- **FR-009**: System MUST end a puzzle in a "lost" state once a player has used 6 guesses without
  naming the correct city.
- **FR-010**: On both win and loss, system MUST reveal the answer city's name, province,
  population (with source and year), and the player's full guess history for that puzzle.
- **FR-011**: System MUST show a countdown to the next daily puzzle once the player's current
  puzzle has ended.
- **FR-012**: System MUST let a player generate a shareable summary of a completed puzzle (win or
  loss) that conveys their guess count and the hint-tier pattern of each guess, without revealing
  the answer city's name to a reader who has not played.
- **FR-013**: System MUST persist each player's guesses, streaks, and statistics only on that
  player's own device, and MUST NOT require account creation or sign-in to play.
- **FR-014**: System MUST show players their own statistics: total puzzles played, percentage
  guessed correctly, current streak, longest streak, a distribution of attempts-to-win, and
  accuracy broken down by province. A streak counts consecutive calendar days on which the player
  guessed correctly on that puzzle's own calendar day; a loss or a skipped day resets the current
  streak to zero. A puzzle counts toward "total played" as soon as it is won, lost, or left
  unfinished at day rollover; percentage guessed correctly is wins divided by total played, and is
  recalculated if a previously unfinished/missed puzzle is later won via the archive — but
  completing any puzzle via the archive (FR-016), including a previously rolled-over one, MUST
  NEVER start, extend, or restore a streak. There is no streak "catch-up."
- **FR-015**: System MUST let players browse an archive of past daily puzzles, showing each day's
  outcome (attempts used, or not-yet-played), filterable to all days, days guessed correctly, or
  days missed.
- **FR-016**: System MUST let a player play any past daily puzzle they have not yet completed,
  under the same 6-guess/hint rules as the current day's puzzle, without affecting today's puzzle.
- **FR-017**: System MUST NOT collect anonymous visit analytics unless a player has explicitly
  opted in via a consent action, and that choice MUST remain changeable at any time from settings.
- **FR-018**: System MUST make an explanation of how the game works (the rules and what each hint
  means) available to any player at any time, not only shown once to first-time players.
- **FR-019**: System MUST display a persistent disclaimer that population and distance figures are
  approximations not suitable for official use, along with the data's source and year.
- **FR-020**: System MUST offer a high-contrast display option that a player can toggle in
  settings.
- **FR-021**: When a player selects a suggested city from the autocomplete list, system MUST
  submit it as a guess immediately — consuming one of their 6 guesses at the moment of selection,
  with no separate confirmation step.
- **FR-022**: System MUST display, within its privacy policy, the identity and contact email of
  the data controller: Pascal Roose, pascalroose@outlook.com.
- **FR-023**: System MUST present a mobile-first, portrait-oriented layout at every viewport size.
  On desktop, the game MUST keep the same portrait aspect ratio as on mobile rather than expanding
  into a wide, desktop-native layout.
- **FR-024**: System MUST compute today's aggregate world statistics (players who completed today's
  puzzle, percentage who guessed correctly, average guesses, most common first guess, fastest
  solve) using only results from players who have opted in to analytics (FR-017); a player who has
  not opted in MUST NOT be counted in or contribute to these aggregates.
- **FR-025**: System MUST provide a Terms of Service page, alongside and linked from the same
  places as the Privacy Policy (e.g. settings/menu).

### Key Entities *(include if feature involves data)*

- **Daily Puzzle**: One calendar day's game instance — its date (Europe/Amsterdam), the target
  city for that day, and its overall outcome once finished (won in N guesses, or lost).
- **City**: A place in the game's dataset — a display name (the first/primary name field), known
  aliases, province, population (with source and year), geographic coordinates, a credited/licensed
  photo, and a reference link. Every city in the dataset is both guessable and eligible to be a
  daily answer. A guess entered via an alias resolves to, and is always displayed as, the city's
  display name.
- **Guess**: One attempt within a specific daily puzzle — which city was guessed, its order (1st
  through 6th), and the three resulting hint tiers (province, population, direction/distance)
  computed against that puzzle's answer.
- **Player Statistics**: A player's own locally-held summary across all their completed
  puzzles — total played, win rate, current streak, longest streak, attempts-to-win distribution,
  and per-province accuracy.
- **Consent Preference**: A player's locally-held choice of whether anonymous visit analytics may
  be collected, and when that choice was made or last changed.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time player can submit their first guess and correctly interpret all three of
  its hints without leaving the game to seek outside help.
- **SC-002**: Every player who finishes a daily puzzle (win or loss) can see the revealed answer
  and their complete guess history on a single screen, with no further navigation required.
- **SC-003**: A player's displayed current streak always matches what their own local guess history
  implies, with no discrepancies reported.
- **SC-004**: Zero anonymous visit-analytics activity occurs for any player before they have made
  an explicit consent choice.
- **SC-005**: A player can find and start any of the last 30 days' unplayed puzzles from the
  archive in 3 actions (taps/clicks) or fewer from the archive screen.
- **SC-006**: Shared result summaries never contain the answer city's name, across all completed
  puzzles, win or lose.
- **SC-007**: A returning player who left a puzzle mid-guess and comes back later sees their prior
  guesses for that puzzle exactly as they left them.
- **SC-008**: World statistics displayed for any given day contain zero contribution from players
  who did not opt in to analytics, across all displayed days.
- **SC-009**: A Terms of Service page is reachable from the same places as the Privacy Policy on
  100% of screens where the Privacy Policy is linked.

## Assumptions

- The city dataset (currently 178 entries, with the design implying growth toward roughly 612
  "cities and larger villages") is treated as a given input to this feature. Growing the dataset is
  tracked separately (see the constitution's deferred data-completeness item) and is out of scope
  here.
- Players are anonymous and unauthenticated; there is no cross-device sync of a player's progress,
  consistent with the constitution's local-first privacy principle.
- The archive's practical range starts at the game's own launch date — there is no puzzle to browse
  from before Stadje existed.
- Only one active daily puzzle variant exists; alternate difficulty modes or multiple puzzles per
  day are out of scope for this feature.
- The archive's "missed" filter includes both puzzles the player lost and puzzles they never
  played, since both represent days without a correct guess; this can be revisited if it proves
  confusing in practice.
- Data quality of the underlying city dataset (sourcing, licensing, schema) is governed by the
  constitution's existing Data & Content Standards and is not re-specified here.
- There is no separate, wide desktop-optimized layout in scope for this feature — desktop users
  see the same mobile-sized, portrait-oriented game frame as mobile users (e.g. centered on the
  page with surrounding empty space, rather than reflowing to use the extra width).
- World statistics (FR-024) reuse the same consent flag as anonymous visit analytics (FR-017) —
  there is no separate, second consent action just for gameplay-outcome aggregation.
- Streaks are strictly "today's puzzle, on that day" — completing any puzzle through the archive
  never affects the streak, even though it does retroactively affect total-played/percentage
  statistics if it changes a puzzle from missed to won.
