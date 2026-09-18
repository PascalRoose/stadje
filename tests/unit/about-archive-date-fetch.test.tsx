// @vitest-environment jsdom
import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AboutPage from "@/app/about/page";
import ArchivePage from "@/app/archive/page";
import { emptyState, saveState } from "@/lib/local-storage";

// Both pages used to fetch the full /api/puzzle payload purely to learn today's date, then make a
// second fetch — an avoidable round trip, since today's Europe/Amsterdam date is a pure,
// client-computable value (lib/time.ts todayAmsterdam()) for this display-only use.
describe("AboutPage / ArchivePage — no fetch to /api/puzzle just for the date (perf)", () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    vi.unstubAllGlobals();
  });

  it("AboutPage only fetches /api/world-stats, never /api/puzzle", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ insufficientData: true, date: "x" }),
    });
    vi.stubGlobal("fetch", fetchSpy);

    render(<AboutPage />);

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    const calledUrls = fetchSpy.mock.calls.map((c) => String(c[0]));
    expect(calledUrls.some((u) => u.includes("/api/world-stats"))).toBe(true);
    expect(calledUrls.some((u) => u.includes("/api/puzzle"))).toBe(false);
  });

  it("ArchivePage never calls fetch at all (today comes from a pure computation)", async () => {
    saveState(emptyState());
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    render(<ArchivePage />);

    await waitFor(() => {
      expect(document.querySelector(".archive-page__list")).toBeTruthy();
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
