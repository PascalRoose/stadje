import { date, integer, jsonb, pgTable } from "drizzle-orm/pg-core";

/**
 * Pure, anonymous, aggregate-only counters (FR-024, US6) — constitution Principle VI: this table
 * carries no player identifier. Every write is an increment; see contracts/api.md's
 * POST /api/world-stats. "firstGuessTally" maps a city id to how many times it was chosen as a
 * first guess that day, used to derive "most common first guess."
 */
export const worldStatsDaily = pgTable("world_stats_daily", {
  date: date("date").primaryKey(),
  playersCount: integer("players_count").notNull().default(0),
  correctCount: integer("correct_count").notNull().default(0),
  guessesSum: integer("guesses_sum").notNull().default(0),
  fastestSolveGuesses: integer("fastest_solve_guesses"),
  firstGuessTally: jsonb("first_guess_tally")
    .notNull()
    .default({})
    .$type<Record<string, number>>(),
});
