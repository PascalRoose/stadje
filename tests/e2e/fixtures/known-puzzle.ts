// Single source of truth for the e2e specs' deterministic puzzle date — LAUNCH_DATE
// (data/puzzle-cycle.json) maps to Veendam, and archive dates never roll over, so this is
// 100%-reproducible without mocking system time in a real browser (see lib/launch-date.ts).
export const KNOWN_DATE = "2026-09-17";
export const KNOWN_URL = `/archive/${KNOWN_DATE}`;
export const ANSWER_CITY = "Veendam";

// Real, verified-wrong cities from data/cities.json, all in Groningen (Veendam's own province,
// so the province hint is always green here) with hand-computed hint tiers against Veendam —
// see the PR description / ADR 0014 for how these were derived.
export const WRONG_GUESSES_FOR_LOSS = [
  "Hoogezand-Sappemeer",
  "Stadskanaal",
  "Winschoten",
  "Groningen",
  "Appingedam",
  "Delfzijl",
] as const;

// province: green, population: orange (12.8% off), distance: orange (13 km)
export const ORANGE_TIER_GUESS = "Stadskanaal";

// province: red (Drenthe, not Groningen), population: red (170.9% off), distance: red (37 km)
export const RED_TIER_GUESS = "Emmen";
