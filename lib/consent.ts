import type { LocalGameState } from "./local-storage";

/** True only once a player has explicitly opted in — never before a choice is made (FR-017). */
export function hasAnalyticsConsent(state: LocalGameState): boolean {
  return state.consent?.analyticsOptIn === true;
}

export function recordConsent(
  state: LocalGameState,
  analyticsOptIn: boolean,
): LocalGameState {
  return {
    ...state,
    consent: { analyticsOptIn, decidedAt: new Date().toISOString() },
  };
}
