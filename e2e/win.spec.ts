import { expect, test } from "@playwright/test";
import { submitGuess } from "./fixtures/helpers";
import { ANSWER_CITY, KNOWN_URL } from "./fixtures/known-puzzle";

// Constitution Principle IV — the win path, end to end through a real browser.
test("guessing the correct city wins the puzzle", async ({ page }) => {
  await page.goto(KNOWN_URL);
  await expect(
    page.getByRole("textbox", { name: "Typ een stad" }),
  ).toBeVisible();

  await submitGuess(page, ANSWER_CITY);

  const endScreen = page.locator('.end-screen[data-status="won"]');
  await expect(endScreen).toBeVisible();
  await expect(endScreen.locator("h2")).toHaveText("GOED · 1 POGINGEN");
  await expect(endScreen.locator(".end-screen__answer strong")).toHaveText(
    ANSWER_CITY,
  );

  // ResultModal renders once, alongside EndScreen, right when the puzzle finishes.
  const modal = page.locator('.modal-card.result-modal[data-status="won"]');
  await expect(modal).toBeVisible();
  await expect(modal).toHaveAttribute("aria-label", "Goed geraden");
});
