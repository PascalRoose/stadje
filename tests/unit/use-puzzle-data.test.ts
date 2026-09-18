// @vitest-environment jsdom
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { usePuzzleData } from "@/lib/hooks/usePuzzleData";

const PUZZLE_RESPONSE = {
  date: "2026-09-17",
  imageUrl: "/puzzle.jpg",
  imageCredit: { owner: "Test", license: "CC0" },
};

describe("usePuzzleData", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches the undated /api/puzzle when no date is given", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(PUZZLE_RESPONSE),
    });
    vi.stubGlobal("fetch", fetchSpy);

    const { result } = renderHook(() => usePuzzleData());

    await waitFor(() => expect(result.current.puzzle).not.toBeNull());
    expect(fetchSpy).toHaveBeenCalledWith("/api/puzzle");
    expect(result.current.puzzle).toEqual(PUZZLE_RESPONSE);
  });

  it("fetches the dated /api/puzzle?date=X for archive replay", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(PUZZLE_RESPONSE),
    });
    vi.stubGlobal("fetch", fetchSpy);

    const { result } = renderHook(() => usePuzzleData("2026-09-17"));

    await waitFor(() => expect(result.current.puzzle).not.toBeNull());
    expect(fetchSpy).toHaveBeenCalledWith("/api/puzzle?date=2026-09-17");
  });

  it("re-fetches and resets to null when the date changes", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(PUZZLE_RESPONSE),
    });
    vi.stubGlobal("fetch", fetchSpy);

    const { result, rerender } = renderHook(({ date }) => usePuzzleData(date), {
      initialProps: { date: "2026-09-17" },
    });
    await waitFor(() => expect(result.current.puzzle).not.toBeNull());

    rerender({ date: "2026-09-16" });
    expect(result.current.puzzle).toBeNull();
    await waitFor(() => expect(result.current.puzzle).not.toBeNull());
    expect(fetchSpy).toHaveBeenLastCalledWith("/api/puzzle?date=2026-09-16");
  });
});
