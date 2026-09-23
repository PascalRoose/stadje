import { expect, test } from "@playwright/test";
import { submitGuess } from "./fixtures/helpers";
import { KNOWN_URL, ORANGE_TIER_GUESS } from "./fixtures/known-puzzle";

// Constitution Principle IV — duplicate-guess rejection. useGameState.ts checks
// guessedCityIds.has(city.id) synchronously, client-side, before any fetch — no new row, no
// count increment, just an error message.
test("guessing the same city twice is rejected without adding a second guess", async ({
  page,
}) => {
  await page.goto(KNOWN_URL);

  // Scoped to the game's own error message — Next.js's built-in accessibility route announcer
  // also has role="alert" and is present on every page, so a bare getByRole("alert") is not
  // specific enough.
  const gameError = page.locator("p.error[role='alert']");

  await submitGuess(page, ORANGE_TIER_GUESS);
  await expect(page.locator(".guess-input__count")).toHaveText("1/6");
  await expect(gameError).toHaveCount(0);

  await submitGuess(page, ORANGE_TIER_GUESS);
  await expect(gameError).toHaveText(
    `Je hebt ${ORANGE_TIER_GUESS} al geprobeerd — kies een ander stadje.`,
  );
  await expect(page.locator(".guess-input__count")).toHaveText("1/6");
  await expect(
    page.locator(
      "table.guess-table tbody tr.guess-table__row:not(.guess-table__row--placeholder)",
    ),
  ).toHaveCount(1);
});
