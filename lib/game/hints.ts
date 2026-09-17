import type { City } from "@/lib/cities";
import { type CompassDirection, compassBearing, distanceKm } from "./distance";

export type Tier = "green" | "orange" | "red";
export type PopulationDirection = "higher" | "lower" | "equal";

export interface ProvinceHint {
  match: boolean;
  tier: "green" | "red"; // no orange tier for province (constitution Principle III)
}

export interface PopulationHint {
  direction: PopulationDirection;
  tier: Tier;
}

export interface DistanceHint {
  km: number;
  direction: CompassDirection | null;
  /**
   * green ONLY at exactly 0 km (the correct city) — never for any other closeness, however
   * near. See constitution Principle III.
   */
  tier: Tier;
}

export interface GuessHints {
  province: ProvinceHint;
  population: PopulationHint;
  distance: DistanceHint;
}

const GREEN_POPULATION_PCT = 0.1;
const ORANGE_POPULATION_PCT = 0.25;
const ORANGE_DISTANCE_KM = 25;

/**
 * Computes all three hints for a guessed city against the day's real answer (FR-006/FR-007).
 * Each hint is classified independently — constitution Principle III, amended v2.0.0 — not
 * combined into one verdict for the guess. A guess is only ever fully green (all three hints)
 * when it is the correct city: province and population trivially match, and distance is 0 km.
 */
export function computeHints(guessed: City, answer: City): GuessHints {
  const provinceMatch = guessed.province === answer.province;

  const populationDiff = answer.population - guessed.population;
  const populationPct = Math.abs(populationDiff) / answer.population;
  const populationDirection: PopulationDirection =
    populationDiff > 0 ? "higher" : populationDiff < 0 ? "lower" : "equal";
  const populationTier: Tier =
    populationPct <= GREEN_POPULATION_PCT
      ? "green"
      : populationPct <= ORANGE_POPULATION_PCT
        ? "orange"
        : "red";

  const km = distanceKm(guessed, answer);
  const bearing = km === 0 ? null : compassBearing(guessed, answer);
  const distanceTier: Tier =
    km === 0 ? "green" : km <= ORANGE_DISTANCE_KM ? "orange" : "red";

  return {
    province: { match: provinceMatch, tier: provinceMatch ? "green" : "red" },
    population: { direction: populationDirection, tier: populationTier },
    distance: { km, direction: bearing, tier: distanceTier },
  };
}
