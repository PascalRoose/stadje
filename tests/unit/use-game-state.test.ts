// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { City } from "@/lib/cities";
import { recordConsent } from "@/lib/consent";
import { useGameState } from "@/lib/hooks/useGameState";
import { emptyState, saveState } from "@/lib/local-storage";

const DATE = "2026-09-17";

function city(id: string, name = id): City {
  return {
    id,
    name,
    aliases: [],
    province: "Utrecht",
    population: 100000,
    populationSource: "CBS",
    populationDate: "2026",
    latitude: 52,
    longitude: 5,
    image: { url: "x", source: "x", owner: "x", license: "CC0" },
    wikipedia: "x",
  };
}

const GREEN_HINTS = {
  province: { match: true, tier: "green" as const },
  population: { direction: "equal" as const, tier: "green" as const },
  distance: { km: 0, direction: null, tier: "green" as const },
};

const MISS_HINTS = {
  province: { match: false, tier: "red" as const },
  population: { direction: "higher" as const, tier: "red" as const },
  distance: { km: 200, direction: "N" as const, tier: "red" as const },
};

function mockFetchSequence(handlers: Record<string, unknown>) {
  return vi.fn((url: string, init?: RequestInit) => {
    if (typeof url === "string" && url.startsWith("/api/puzzle/guess")) {
      const body = JSON.parse(String(init?.body));
      const correct = body.cityId === "utrecht";
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve(
            correct
              ? {
                  cityId: "utrecht",
                  displayName: "Utrecht",
                  correct: true,
                  hints: GREEN_HINTS,
                  reveal: { province: "Utrecht" },
                }
              : {
                  cityId: body.cityId,
                  displayName: body.cityId,
                  correct: false,
                  hints: MISS_HINTS,
                },
          ),
      });
    }
    if (typeof url === "string" && url.startsWith("/api/puzzle/reveal")) {
      return Promise.resolve({
        json: () => Promise.resolve(handlers.reveal ?? { province: "Utrecht" }),
      });
    }
    if (typeof url === "string" && url.startsWith("/api/world-stats")) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    }
    return Promise.reject(new Error(`unexpected fetch: ${url}`));
  });
}

describe("useGameState — guess/win/loss orchestration (was untested inline in PuzzlePlayer)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    window.localStorage.clear();
  });

  it("a correct guess sets status: won and is streak-eligible on the live route", async () => {
    saveState(emptyState());
    vi.stubGlobal("fetch", mockFetchSequence({}));

    const { result } = renderHook(() =>
      useGameState({ date: DATE, isArchive: false }),
    );
    await waitFor(() => expect(result.current.state).not.toBeNull());

    await act(async () => {
      await result.current.submitGuess(city("utrecht"));
    });

    expect(result.current.status).toBe("won");
    expect(result.current.state?.puzzles[DATE].streakEligible).toBe(true);
    expect(result.current.justFinished).toBe(true);
  });

  it("a win recorded via the archive route is never streak-eligible (FR-014)", async () => {
    saveState(emptyState());
    vi.stubGlobal("fetch", mockFetchSequence({}));

    const { result } = renderHook(() =>
      useGameState({ date: DATE, isArchive: true }),
    );
    await waitFor(() => expect(result.current.state).not.toBeNull());

    await act(async () => {
      await result.current.submitGuess(city("utrecht"));
    });

    expect(result.current.state?.puzzles[DATE].streakEligible).toBe(false);
  });

  it("the 6th wrong guess fetches the reveal and sets status: lost", async () => {
    saveState(emptyState());
    vi.stubGlobal("fetch", mockFetchSequence({}));

    const { result } = renderHook(() =>
      useGameState({ date: DATE, isArchive: false }),
    );
    await waitFor(() => expect(result.current.state).not.toBeNull());

    for (let i = 0; i < 6; i++) {
      await act(async () => {
        await result.current.submitGuess(city(`wrong-${i}`));
      });
    }

    expect(result.current.status).toBe("lost");
    expect(result.current.reveal).not.toBeNull();
    expect(result.current.justFinished).toBe(true);
  });

  it("a duplicate guess sets an error without calling fetch again", async () => {
    saveState(emptyState());
    const fetchSpy = mockFetchSequence({});
    vi.stubGlobal("fetch", fetchSpy);

    const { result } = renderHook(() =>
      useGameState({ date: DATE, isArchive: false }),
    );
    await waitFor(() => expect(result.current.state).not.toBeNull());

    await act(async () => {
      await result.current.submitGuess(city("wrong-1"));
    });
    const callsAfterFirst = fetchSpy.mock.calls.length;

    await act(async () => {
      await result.current.submitGuess(city("wrong-1"));
    });

    expect(result.current.error).toMatch(/al geprobeerd/);
    expect(fetchSpy.mock.calls.length).toBe(callsAfterFirst);
  });

  it("submits the world-stats beacon only when the player has opted in", async () => {
    const optedOutState = emptyState();
    saveState(optedOutState);
    const fetchSpy = mockFetchSequence({});
    vi.stubGlobal("fetch", fetchSpy);

    const { result: noConsent } = renderHook(() =>
      useGameState({ date: DATE, isArchive: false }),
    );
    await waitFor(() => expect(noConsent.current.state).not.toBeNull());
    await act(async () => {
      await noConsent.current.submitGuess(city("utrecht"));
    });
    expect(
      fetchSpy.mock.calls.some((c) =>
        String(c[0]).startsWith("/api/world-stats"),
      ),
    ).toBe(false);

    window.localStorage.clear();
    saveState(recordConsent(emptyState(), true));
    const fetchSpyOptedIn = mockFetchSequence({});
    vi.stubGlobal("fetch", fetchSpyOptedIn);

    const { result: withConsent } = renderHook(() =>
      useGameState({ date: DATE, isArchive: false }),
    );
    await waitFor(() => expect(withConsent.current.state).not.toBeNull());
    await act(async () => {
      await withConsent.current.submitGuess(city("utrecht"));
    });
    expect(
      fetchSpyOptedIn.mock.calls.some((c) =>
        String(c[0]).startsWith("/api/world-stats"),
      ),
    ).toBe(true);
  });

  it("never submits the beacon mid-game (only once the puzzle ends)", async () => {
    saveState(recordConsent(emptyState(), true));
    const fetchSpy = mockFetchSequence({});
    vi.stubGlobal("fetch", fetchSpy);

    const { result } = renderHook(() =>
      useGameState({ date: DATE, isArchive: false }),
    );
    await waitFor(() => expect(result.current.state).not.toBeNull());

    await act(async () => {
      await result.current.submitGuess(city("wrong-1"));
    });

    expect(result.current.status).toBe("in-progress");
    expect(
      fetchSpy.mock.calls.some((c) =>
        String(c[0]).startsWith("/api/world-stats"),
      ),
    ).toBe(false);
  });
});
