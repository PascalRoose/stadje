const AMSTERDAM_TZ = "Europe/Amsterdam";

const amsterdamFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: AMSTERDAM_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/**
 * The current calendar date in Europe/Amsterdam, as "YYYY-MM-DD" — the shared day boundary for
 * every player, regardless of their own device time zone (constitution Principle I, FR-001).
 * MUST be resolved server-side; never trust a client-supplied "today" (research.md).
 */
export function todayAmsterdam(date: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD directly.
  return amsterdamFormatter.format(date);
}

export function isFutureDate(dateStr: string): boolean {
  return dateStr > todayAmsterdam();
}

export function isValidDateString(dateStr: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
}

const DUTCH_MONTHS = [
  "JAN",
  "FEB",
  "MRT",
  "APR",
  "MEI",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OKT",
  "NOV",
  "DEC",
];

/** "16 SEP" style label for the header — mockup screens 01–05, 08–10, 13. */
export function formatHeaderDate(dateStr: string): string {
  const [, month, day] = dateStr.split("-").map(Number);
  return `${day} ${DUTCH_MONTHS[month - 1]}`;
}

/** Milliseconds until the next Europe/Amsterdam midnight, for the end-screen countdown (FR-011). */
export function msUntilNextAmsterdamMidnight(now: Date = new Date()): number {
  const today = todayAmsterdam(now);
  // Binary-search-free approach: step forward in 1-hour chunks from "now" until the Amsterdam
  // calendar date changes, then refine to the minute. Simpler and robust across DST changes.
  let probe = new Date(now.getTime());
  while (todayAmsterdam(probe) === today) {
    probe = new Date(probe.getTime() + 15 * 60 * 1000);
  }
  // probe is now within 15 minutes after the boundary; step back by the minute to find it exactly.
  while (todayAmsterdam(new Date(probe.getTime() - 60 * 1000)) !== today) {
    probe = new Date(probe.getTime() - 60 * 1000);
  }
  return probe.getTime() - now.getTime();
}

/**
 * Resolves and validates a `date` request param against the cross-cutting rule shared by every
 * puzzle endpoint (contracts/api.md): defaults to server-resolved today, rejects a malformed or
 * future date. Does NOT check the date is a known puzzle day — callers combine this with
 * `lib/game/selection.ts`'s `isKnownPuzzleDate` for that.
 */
export function resolvePuzzleDate(dateParam: string | null): string | null {
  const date = dateParam ?? todayAmsterdam();
  if (!isValidDateString(date)) return null;
  if (isFutureDate(date)) return null;
  return date;
}
