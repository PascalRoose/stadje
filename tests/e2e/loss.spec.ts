import { expect, test } from "@playwright/test";
import { submitGuess } from "./fixtures/helpers";
import {
  ANSWER_CITY,
  KNOWN_URL,
  WRONG_GUESSES_FOR_LOSS,
} from "./fixtures/known-puzzle";

// Constitution Principle IV — the 6-guess loss path, end to end through a real browser.
test("six wrong guesses lose the puzzle and reveal the correct answer", async ({
  page,
}) => {
  await page.goto(KNOWN_URL);

  for (const [i, city] of WRONG_GUESSES_FOR_LOSS.entries()) {
    await submitGuess(page, city);
    // The 6th guess ends the puzzle — PuzzlePlayer swaps to EndScreen immediately, so
    // .guess-input__count (part of the in-progress view) no longer exists to assert against.
    if (i < WRONG_GUESSES_FOR_LOSS.length - 1) {
      await expect(page.locator(".guess-input__count")).toHaveText(
        `${i + 1}/6`,
      );
    }
  }

  const endScreen = page.locator('.end-screen[data-status="lost"]');
  await expect(endScreen).toBeVisible();
  await expect(endScreen.locator("h2")).toHaveText("HELAAS · 6 POGINGEN OP");
  await expect(endScreen.locator(".end-screen__answer strong")).toHaveText(
    ANSWER_CITY,
  );
});
