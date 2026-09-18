import { describe, expect, it } from "vitest";
import { getCities } from "@/lib/cities";
import type { Tier } from "@/lib/game/hints";
import { generateShareText } from "@/lib/game/share";

function row(province: Tier, population: Tier, distance: Tier) {
  return {
    province: {
      match: province === "green",
      tier: province as "green" | "red",
    },
    population: { direction: "equal" as const, tier: population },
    distance: {
      km: distance === "green" ? 0 : 50,
      direction: null,
      tier: distance,
    },
  };
}

describe("generateShareText", () => {
  it("never contains any known city name or alias, win case", () => {
    const text = generateShareText({
      date: "2026-09-17",
      status: "won",
      guessCount: 4,
      guesses: [
        row("red", "red", "red"),
        row("red", "orange", "orange"),
        row("green", "orange", "orange"),
        row("green", "green", "green"),
      ],
    });
    for (const city of getCities()) {
      expect(text).not.toContain(city.name);
      for (const alias of city.aliases) {
        expect(text).not.toContain(alias);
      }
    }
  });

  it("never contains any known city name or alias, loss case", () => {
    const text = generateShareText({
      date: "2026-09-17",
      status: "lost",
      guessCount: 6,
      guesses: Array.from({ length: 6 }, () => row("red", "red", "red")),
    });
    for (const city of getCities()) {
      expect(text).not.toContain(city.name);
    }
  });

  it("shows the result as N/6 on a win", () => {
    const text = generateShareText({
      date: "2026-09-17",
      status: "won",
      guessCount: 3,
      guesses: [],
    });
    expect(text).toContain("3/6");
  });

  it("shows the result as X/6 on a loss", () => {
    const text = generateShareText({
      date: "2026-09-17",
      status: "lost",
      guessCount: 6,
      guesses: [],
    });
    expect(text).toContain("X/6");
  });

  it("renders three emoji per guess (province/population/distance), one line per guess", () => {
    const text = generateShareText({
      date: "2026-09-17",
      status: "won",
      guessCount: 2,
      guesses: [row("red", "orange", "red"), row("green", "green", "green")],
    });
    expect(text).toContain("🟥🟧🟥\n🟩🟩🟩");
  });

  it("ends with a link to the game", () => {
    const text = generateShareText({
      date: "2026-09-17",
      status: "won",
      guessCount: 3,
      guesses: [],
    });
    const lines = text.trimEnd().split("\n");
    expect(lines[lines.length - 1]).toBe("https://stadje.vercel.app/");
  });
});
