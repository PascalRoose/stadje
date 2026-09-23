import { defineConfig, devices } from "@playwright/test";

// ADR 0014: real-browser coverage of the Constitution Principle IV scenarios that the Vitest
// suite (ADR 0006) can only exercise against jsdom — real debounced-autocomplete timing, real
// DOM attribute rendering, real navigation. Chromium only for now (cost/speed); other browsers
// are available on demand locally via `--project=firefox` etc.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["html", { open: "never" }], ["list"]] : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  expect: {
    // A little headroom above the 5s default for the debounced (175ms) autocomplete flow.
    timeout: 7_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // A production build, not `next dev` — catches build-time issues a dev server would mask,
    // and matches what's actually deployed.
    command: "pnpm build && pnpm start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
