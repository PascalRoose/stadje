import { describe, expect, it } from "vitest";
import { hasAnalyticsConsent, recordConsent } from "@/lib/consent";
import { emptyState } from "@/lib/local-storage";

// US2: no analytics/world-stats submission may happen before an explicit consent choice, and
// none after a decline. lib/consent.ts's hasAnalyticsConsent is the single gate every future
// analytics call (US6's POST /api/world-stats) MUST check before firing.
describe("analytics consent gate", () => {
  it("is false for a first-time visitor who has made no choice yet (FR-017, SC-004)", () => {
    const state = emptyState();
    expect(state.consent).toBeNull();
    expect(hasAnalyticsConsent(state)).toBe(false);
  });

  it("stays false after an explicit decline", () => {
    const declined = recordConsent(emptyState(), false);
    expect(declined.consent?.analyticsOptIn).toBe(false);
    expect(hasAnalyticsConsent(declined)).toBe(false);
  });

  it("is true only after an explicit accept", () => {
    const accepted = recordConsent(emptyState(), true);
    expect(hasAnalyticsConsent(accepted)).toBe(true);
  });

  it("can be changed later (settings toggle, FR-017 acceptance scenario 4)", () => {
    const accepted = recordConsent(emptyState(), true);
    const declinedLater = recordConsent(accepted, false);
    expect(hasAnalyticsConsent(declinedLater)).toBe(false);
  });

  it("records when the choice was made", () => {
    const before = Date.now();
    const state = recordConsent(emptyState(), true);
    expect(new Date(state.consent!.decidedAt).getTime()).toBeGreaterThanOrEqual(
      before,
    );
  });
});
