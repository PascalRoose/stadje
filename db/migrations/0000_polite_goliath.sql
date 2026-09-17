CREATE TABLE "world_stats_daily" (
	"date" date PRIMARY KEY NOT NULL,
	"players_count" integer DEFAULT 0 NOT NULL,
	"correct_count" integer DEFAULT 0 NOT NULL,
	"guesses_sum" integer DEFAULT 0 NOT NULL,
	"fastest_solve_guesses" integer,
	"first_guess_tally" jsonb DEFAULT '{}'::jsonb NOT NULL
);
