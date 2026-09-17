import { getCityById } from "@/lib/cities";
import type { CompassDirection } from "@/lib/game/distance";
import type { GuessHints, PopulationDirection } from "@/lib/game/hints";

export interface GuessRow extends GuessHints {
  cityId: string;
}

const COMPASS_ARROWS: Record<CompassDirection, string> = {
  N: "↑",
  NE: "↗",
  E: "→",
  SE: "↘",
  S: "↓",
  SW: "↙",
  W: "←",
  NW: "↖",
};

function formatPopulation(n: number): string {
  return n >= 1000 ? `${Math.round(n / 1000)}k` : String(n);
}

const POPULATION_ARROW: Record<PopulationDirection, string> = {
  higher: "↑",
  lower: "↓",
  equal: "",
};

// Mockup screens 02, 04, 05: Stad / Provincie / Inwoners / Afstand, as a CSS grid (not a
// <table>, matching the mockup). Each of the three hint cells is colored INDEPENDENTLY
// (constitution Principle III, v2.0.0) — a guess is only ever green across all three when it's
// the correct city.
export function GuessTable({ guesses }: { guesses: GuessRow[] }) {
  if (guesses.length === 0) return null;

  return (
    <table className="guess-table">
      <thead>
        <tr className="guess-table__row guess-table__row--header">
          <th scope="col">Stad</th>
          <th scope="col">Provincie</th>
          <th scope="col">Inwoners</th>
          <th scope="col">Afstand</th>
        </tr>
      </thead>
      <tbody>
        {guesses.map((guess) => {
          const city = getCityById(guess.cityId);
          if (!city) return null;
          const correct = guess.distance.tier === "green";
          return (
            <tr className="guess-table__row" key={guess.cityId}>
              <td data-tier={correct ? "green" : undefined}>{city.name}</td>
              <td data-tier={guess.province.tier}>{city.province}</td>
              <td data-tier={guess.population.tier}>
                {formatPopulation(city.population)}{" "}
                {POPULATION_ARROW[guess.population.direction]}
              </td>
              <td data-tier={guess.distance.tier}>
                {guess.distance.direction
                  ? COMPASS_ARROWS[guess.distance.direction]
                  : "◉"}{" "}
                {guess.distance.km} km
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
