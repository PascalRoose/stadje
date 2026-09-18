// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GuessInput } from "@/components/GuessInput";
import * as citiesModule from "@/lib/cities";

describe("GuessInput — debounced search (perf: avoid a searchCities() call per keystroke)", () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("does not call searchCities synchronously while typing", () => {
    vi.useFakeTimers();
    const searchSpy = vi.spyOn(citiesModule, "searchCities");
    render(<GuessInput onSelect={() => {}} guessCount={0} maxGuesses={6} />);

    fireEvent.change(screen.getByLabelText("Typ een stad"), {
      target: { value: "utr" },
    });

    expect(searchSpy).not.toHaveBeenCalled();
  });

  it("shows suggestions only after the debounce delay elapses", () => {
    vi.useFakeTimers();
    render(<GuessInput onSelect={() => {}} guessCount={0} maxGuesses={6} />);

    fireEvent.change(screen.getByLabelText("Typ een stad"), {
      target: { value: "utrecht" },
    });
    expect(screen.queryByRole("listbox")).toBeNull();

    act(() => vi.advanceTimersByTime(200));
    expect(screen.getByRole("listbox")).toBeTruthy();
  });

  it("coalesces rapid keystrokes into a single search for the final query", () => {
    vi.useFakeTimers();
    const searchSpy = vi.spyOn(citiesModule, "searchCities");
    render(<GuessInput onSelect={() => {}} guessCount={0} maxGuesses={6} />);

    const input = screen.getByLabelText("Typ een stad");
    fireEvent.change(input, { target: { value: "u" } });
    act(() => vi.advanceTimersByTime(50));
    fireEvent.change(input, { target: { value: "ut" } });
    act(() => vi.advanceTimersByTime(50));
    fireEvent.change(input, { target: { value: "utr" } });
    act(() => vi.advanceTimersByTime(200));

    expect(searchSpy).toHaveBeenCalledTimes(1);
    expect(searchSpy).toHaveBeenCalledWith("utr");
  });

  it("clears suggestions immediately when the query is cleared", () => {
    vi.useFakeTimers();
    render(<GuessInput onSelect={() => {}} guessCount={0} maxGuesses={6} />);

    const input = screen.getByLabelText("Typ een stad");
    fireEvent.change(input, { target: { value: "utrecht" } });
    act(() => vi.advanceTimersByTime(200));
    expect(screen.getByRole("listbox")).toBeTruthy();

    fireEvent.change(input, { target: { value: "" } });
    expect(screen.queryByRole("listbox")).toBeNull();
  });
});
