// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { GuessTable } from "@/components/GuessTable";

function row(
  cityId: string,
  overrides: Partial<{
    provinceTier: "green" | "red";
    populationTier: "green" | "orange" | "red";
    populationDirection: "higher" | "lower" | "equal";
    distanceTier: "green" | "orange" | "red";
    distanceDirection: "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW" | null;
    distanceKm: number;
  }> = {},
) {
  return {
    cityId,
    province: {
      match: overrides.provinceTier === "green",
      tier: overrides.provinceTier ?? "red",
    },
    population: {
      direction: overrides.populationDirection ?? "higher",
      tier: overrides.populationTier ?? "red",
    },
    distance: {
      km: overrides.distanceKm ?? 42,
      // `??` would treat an explicit `null` override the same as "not provided" — check against
      // `undefined` specifically so callers can deliberately test the "no direction" case.
      direction:
        overrides.distanceDirection !== undefined
          ? overrides.distanceDirection
          : "NE",
      tier: overrides.distanceTier ?? "red",
    },
  };
}

describe("GuessTable", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders nothing for an empty, not-yet-started table with no maxGuesses", () => {
    const { container } = render(<GuessTable guesses={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the header plus a dashed placeholder row per remaining guess when empty", () => {
    render(<GuessTable guesses={[]} maxGuesses={6} />);
    expect(screen.getByText("Stad")).toBeTruthy();
    expect(screen.getByText("Provincie")).toBeTruthy();
    expect(
      document.querySelectorAll(".guess-table__row--placeholder"),
    ).toHaveLength(6);
  });

  it("shrinks the placeholder count as real guesses are added", () => {
    render(
      <GuessTable guesses={[row("rotterdam"), row("arnhem")]} maxGuesses={6} />,
    );
    expect(
      document.querySelectorAll(".guess-table__row--placeholder"),
    ).toHaveLength(4);
    expect(screen.getByText("Rotterdam")).toBeTruthy();
    expect(screen.getByText("Arnhem")).toBeTruthy();
  });

  it("abbreviates the long province names but leaves short ones as-is", () => {
    render(
      <GuessTable
        guesses={[
          row("amsterdam", { provinceTier: "green" }), // Noord-Holland
          row("rotterdam", { provinceTier: "red" }), // Zuid-Holland
          row("arnhem", { provinceTier: "green" }), // Gelderland — short, unabbreviated
        ]}
      />,
    );
    expect(screen.getByText("N-Holland")).toBeTruthy();
    expect(screen.getByText("Z-Holland")).toBeTruthy();
    expect(screen.getByText("Gelderland")).toBeTruthy();
  });

  it("marks a guess green on the Stad cell only when the distance tier is green", () => {
    render(
      <GuessTable
        guesses={[row("amsterdam", { distanceTier: "green", distanceKm: 0 })]}
      />,
    );
    const cell = screen.getByText("Amsterdam");
    expect(cell.getAttribute("data-tier")).toBe("green");
  });

  it("shows the target marker instead of a compass arrow when there is no direction", () => {
    render(
      <GuessTable
        guesses={[
          row("amsterdam", {
            distanceDirection: null,
            distanceKm: 0,
            distanceTier: "green",
          }),
        ]}
      />,
    );
    expect(screen.getByText(/◉/)).toBeTruthy();
  });

  it("formats population under 1000 without a 'k' suffix and shows no arrow when equal", () => {
    render(
      <GuessTable
        guesses={[
          row("amsterdam", { populationDirection: "equal" }),
          row("bronkhorst", { populationDirection: "equal" }),
        ]}
      />,
    );
    // Amsterdam's population is well over 1000 (the "k" branch); Bronkhorst's (129) is not.
    // Both use the "equal" direction, so neither renders a trailing arrow glyph.
    expect(screen.getByText(/^\d+k\s*$/)).toBeTruthy();
    expect(screen.getByText("129")).toBeTruthy();
  });

  it("skips a guess whose city id is unknown instead of crashing", () => {
    render(<GuessTable guesses={[row("not-a-real-city"), row("arnhem")]} />);
    expect(screen.getByText("Arnhem")).toBeTruthy();
    expect(document.querySelectorAll("tbody tr")).toHaveLength(1);
  });
});
