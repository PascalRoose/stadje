import type { Locator, Page } from "@playwright/test";

/**
 * Types a city name into the guess input and clicks the matching suggestion — FR-021, selecting
 * a suggestion submits immediately, there's no separate confirm step (components/GuessInput.tsx).
 */
export async function submitGuess(page: Page, cityName: string): Promise<void> {
  const input = page.getByRole("textbox", { name: "Typ een stad" });
  await input.fill(cityName);
  await page.getByRole("listbox").waitFor();
  // .filter({ hasText }) rather than getByRole("option", { name }) — the option's accessible
  // name concatenates the city + province spans, so an exact-name match is brittle.
  await page.getByRole("option").filter({ hasText: cityName }).click();
}

export function guessTableRow(page: Page, index: number): Locator {
  return page.locator("table.guess-table tbody tr.guess-table__row").nth(index);
}
