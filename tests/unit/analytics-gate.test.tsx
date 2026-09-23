// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AnalyticsGate } from "@/components/AnalyticsGate";
import { recordConsent } from "@/lib/consent";
import { emptyState, saveState } from "@/lib/local-storage";

// The real component injects Vercel's tracking script — stub it so the test only asserts the
// consent gate's own render decision, not @vercel/analytics's internals.
vi.mock("@vercel/analytics/react", () => ({
  Analytics: () => <div data-testid="vercel-analytics" />,
}));

describe("AnalyticsGate", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders nothing before any consent decision has been made", () => {
    render(<AnalyticsGate />);
    expect(screen.queryByTestId("vercel-analytics")).toBeNull();
  });

  it("renders nothing when analytics consent was explicitly declined", () => {
    saveState(recordConsent(emptyState(), false));
    render(<AnalyticsGate />);
    expect(screen.queryByTestId("vercel-analytics")).toBeNull();
  });

  it("renders Vercel Analytics once analytics consent is already stored", () => {
    saveState(recordConsent(emptyState(), true));
    render(<AnalyticsGate />);
    expect(screen.getByTestId("vercel-analytics")).toBeTruthy();
  });

  it("starts tracking live when consent is granted after the gate is already mounted (Settings toggle, FR-020 revocability)", () => {
    render(<AnalyticsGate />);
    expect(screen.queryByTestId("vercel-analytics")).toBeNull();

    act(() => {
      saveState(recordConsent(emptyState(), true));
    });

    expect(screen.getByTestId("vercel-analytics")).toBeTruthy();
  });

  it("stops tracking live when consent is revoked after being granted", () => {
    saveState(recordConsent(emptyState(), true));
    render(<AnalyticsGate />);
    expect(screen.getByTestId("vercel-analytics")).toBeTruthy();

    act(() => {
      saveState(recordConsent(emptyState(), false));
    });

    expect(screen.queryByTestId("vercel-analytics")).toBeNull();
  });
});
