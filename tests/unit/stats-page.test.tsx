// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import StatsPage from "@/app/stats/page";
import {
  emptyState,
  type LocalGameState,
  type StoredStats,
  saveState,
} from "@/lib/local-storage";

const GLOBALS_CSS = readFileSync(
  join(process.cwd(), "app/globals.css"),
  "utf-8",
);

// Extracts a single top-level CSS rule's declaration block by selector, e.g. ".foo { a: b; }" ->
// "a: b;". Good enough for globals.css's flat (non-nested) rules.
function ruleBody(selector: string): string {
  const escaped = selector.replace(/[.#[\]]/g, (c) => `\\${c}`);
  const match = GLOBALS_CSS.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`));
  if (!match) throw new Error(`no CSS rule found for "${selector}"`);
  return match[1];
}

function stateWithDistribution(
  attemptsDistribution: StoredStats["attemptsDistribution"],
): LocalGameState {
  const state = emptyState();
  const totalPlayed = Object.values(attemptsDistribution).reduce(
    (sum, n) => sum + n,
    0,
  );
  state.stats = {
    totalPlayed,
    currentStreak: 0,
    longestStreak: 0,
    attemptsDistribution,
    provinceAccuracy: {},
  };
  return state;
}

// Finds the bar element for a given "1".."6"/"X" distribution row, by walking from its label
// span to the bar rendered alongside it — mirrors app/stats/page.tsx's markup.
function barElFor(key: string): HTMLElement {
  const label = screen.getByText(key, {
    selector: ".stats-page__distribution-label",
  });
  const row = label.closest("li");
  if (!row) throw new Error(`no <li> found for distribution key "${key}"`);
  const bar = row.querySelector<HTMLElement>(".stats-page__distribution-bar");
  if (!bar) throw new Error(`no bar rendered for distribution key "${key}"`);
  return bar;
}

function barWidthFor(key: string): number {
  return Number(barElFor(key).style.width.replace("%", ""));
}

describe("StatsPage — guess distribution bars", () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  it("shows the empty state instead of a distribution when nothing has been played", () => {
    saveState(emptyState());
    render(<StatsPage />);

    expect(screen.getByText(/nog geen stadje gespeeld/i)).toBeTruthy();
    expect(screen.queryByText("Verdeling pogingen")).toBeNull();
  });

  it("renders every bucket's own count, not just the winning one", () => {
    saveState(
      stateWithDistribution({
        "1": 2,
        "2": 5,
        "3": 10,
        "4": 3,
        "5": 0,
        "6": 1,
        X: 4,
      }),
    );
    render(<StatsPage />);

    for (const [key, count] of Object.entries({
      "1": 2,
      "2": 5,
      "3": 10,
      "4": 3,
      "5": 0,
      "6": 1,
      X: 4,
    })) {
      const label = screen.getByText(key, {
        selector: ".stats-page__distribution-label",
      });
      const row = label.closest("li");
      expect(row).toBeTruthy();
      expect(
        row?.querySelector(".stats-page__distribution-count")?.textContent,
      ).toBe(String(count));
    }
  });

  it("scales each bar relative to the largest bucket, with the largest at 100%", () => {
    saveState(
      stateWithDistribution({
        "1": 2,
        "2": 5,
        "3": 10,
        "4": 3,
        "5": 0,
        "6": 1,
        X: 4,
      }),
    );
    render(<StatsPage />);

    // "3" has the highest count (10) — it must fill the full track, not sit empty.
    expect(barWidthFor("3")).toBe(100);
    // Every other non-zero bucket must be strictly narrower than the max, but still visible.
    expect(barWidthFor("2")).toBe(50);
    expect(barWidthFor("X")).toBe(40);
    expect(barWidthFor("4")).toBe(30);
    expect(barWidthFor("1")).toBe(20);
    // A small non-zero count still gets a readable minimum-width bar rather than looking empty.
    expect(barWidthFor("6")).toBeGreaterThanOrEqual(8);
    // Only a genuinely unplayed bucket renders as empty.
    expect(barWidthFor("5")).toBe(0);
  });

  it("fills every bar to 100% when all buckets are tied", () => {
    saveState(
      stateWithDistribution({
        "1": 3,
        "2": 3,
        "3": 3,
        "4": 3,
        "5": 3,
        "6": 3,
        X: 3,
      }),
    );
    render(<StatsPage />);

    for (const key of ["1", "2", "3", "4", "5", "6", "X"]) {
      expect(barWidthFor(key)).toBe(100);
    }
  });

  it("gives the single played bucket a full bar and leaves the rest empty", () => {
    saveState(
      stateWithDistribution({
        "1": 0,
        "2": 0,
        "3": 1,
        "4": 0,
        "5": 0,
        "6": 0,
        X: 0,
      }),
    );
    render(<StatsPage />);

    expect(barWidthFor("3")).toBe(100);
    for (const key of ["1", "2", "4", "5", "6", "X"]) {
      expect(barWidthFor(key)).toBe(0);
    }
  });

  it("marks only the X (not guessed correctly) bar as a miss, not the winning buckets", () => {
    saveState(
      stateWithDistribution({
        "1": 1,
        "2": 1,
        "3": 1,
        "4": 1,
        "5": 1,
        "6": 1,
        X: 1,
      }),
    );
    render(<StatsPage />);

    for (const key of ["1", "2", "3", "4", "5", "6"]) {
      expect(
        barElFor(key).classList.contains("stats-page__distribution-bar--miss"),
      ).toBe(false);
    }
    expect(
      barElFor("X").classList.contains("stats-page__distribution-bar--miss"),
    ).toBe(true);
  });

  // Regression guard, same reasoning as the display:block check below: jsdom can't tell us
  // whether a class actually paints green/red, only that it's present. This reads the real
  // stylesheet to make sure the miss modifier still overrides the base bar to red, and the base
  // bar itself is green.
  it("colors winning-bucket bars green and the miss bar red", () => {
    expect(ruleBody(".stats-page__distribution-bar")).toMatch(
      /background:\s*var\(--green-bg\)/,
    );
    expect(ruleBody(".stats-page__distribution-bar--miss")).toMatch(
      /background:\s*var\(--red-bg\)/,
    );
  });

  // Regression guard for the actual bug: jsdom has no layout engine, so the tests above (which
  // only read back the `width` style we set) would all still pass even if the bars never
  // rendered visibly — which is exactly what happened. `width`/`height` are no-ops on an element
  // with the default `display: inline` (a bare <span> here), so the bar silently collapsed to
  // zero size in the browser regardless of its width percentage. This reads the real stylesheet
  // text to make sure that can't silently regress again.
  it("keeps the bar element block-level, so its width style actually renders", () => {
    const body = ruleBody(".stats-page__distribution-bar");
    expect(body).toMatch(/display:\s*(block|inline-block|flex|grid)\b/);
  });
});
