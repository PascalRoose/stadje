export interface WorldStatsCompletionPayload {
  date: string;
  won: boolean;
  guessCount: number;
  firstGuessCityId: string;
}

/**
 * Fire-and-forget beacon for one anonymous completion (US6). The analytics-consent gate
 * (FR-024) is checked at the call site, not in here — it's a privacy-critical decision that
 * should stay visible/grep-able where the send decision is actually made.
 */
export function submitWorldStatsCompletion(
  payload: WorldStatsCompletionPayload,
): void {
  fetch("/api/world-stats", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => {
    // Fire-and-forget (research.md) — a failed submission isn't shown to the player.
  });
}
