import { expect, test } from "@playwright/test";
import { guessTableRow, submitGuess } from "./fixtures/helpers";
import {
  KNOWN_URL,
  ORANGE_TIER_GUESS,
  RED_TIER_GUESS,
} from "./fixtures/known-puzzle";

// Constitution Principle III — rendered hint tiers, proven against the real DOM (data-tier
// attributes on GuessTable's <td>s), not just the pure computeHints() function (already covered
// by tests/unit/hints.test.ts). Distance-green is exclusive to the correct city and is already
// exercised by win.spec.ts; province is only ever green/red, never orange (see lib/game/hints.ts).
test("wrong guesses render the correct orange and red hint tiers", async ({
  page,
}) => {
  await page.goto(KNOWN_URL);

  await submitGuess(page, ORANGE_TIER_GUESS);
  const row1 = guessTableRow(page, 0);
  await expect(row1.locator("td").nth(1)).toHaveAttribute("data-tier", "green"); // Provincie
  await expect(row1.locator("td").nth(2)).toHaveAttribute(
    "data-tier",
    "orange",
  ); // Inwoners
  await expect(row1.locator("td").nth(3)).toHaveAttribute(
    "data-tier",
    "orange",
  ); // Afstand

  await submitGuess(page, RED_TIER_GUESS);
  const row2 = guessTableRow(page, 1);
  await expect(row2.locator("td").nth(1)).toHaveAttribute("data-tier", "red");
  await expect(row2.locator("td").nth(2)).toHaveAttribute("data-tier", "red");
  await expect(row2.locator("td").nth(3)).toHaveAttribute("data-tier", "red");
});
