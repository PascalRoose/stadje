import { afterEach, describe, expect, it, vi } from "vitest";
import { submitWorldStatsCompletion } from "@/lib/world-stats-client";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("submitWorldStatsCompletion", () => {
  it("POSTs the exact payload to /api/world-stats", () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchSpy);

    const payload = {
      date: "2026-09-17",
      won: true,
      guessCount: 3,
      firstGuessCityId: "veendam",
    };
    submitWorldStatsCompletion(payload);

    expect(fetchSpy).toHaveBeenCalledExactlyOnceWith("/api/world-stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  });

  it("swallows a failed submission — fire-and-forget, no throw, no unhandled rejection", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down")),
    );

    expect(() =>
      submitWorldStatsCompletion({
        date: "2026-09-17",
        won: false,
        guessCount: 6,
        firstGuessCityId: "veendam",
      }),
    ).not.toThrow();

    // Let the rejected promise's .catch() microtask flush before the test ends, so a missing
    // .catch() would surface as an unhandled rejection rather than passing silently.
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
});
