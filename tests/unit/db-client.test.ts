import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// db/client.ts caches its Drizzle instance in module-level state, so each case needs a fresh
// module instance (vi.resetModules + dynamic re-import) rather than sharing the singleton.
const ORIGINAL_DATABASE_URL = process.env.DATABASE_URL;

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  if (ORIGINAL_DATABASE_URL === undefined) {
    delete process.env.DATABASE_URL;
  } else {
    process.env.DATABASE_URL = ORIGINAL_DATABASE_URL;
  }
});

describe("getDb", () => {
  it("throws a clear error when DATABASE_URL is unset — importing the module itself must not throw", async () => {
    delete process.env.DATABASE_URL;
    const { getDb } = await import("@/db/client");
    expect(() => getDb()).toThrowError(
      "DATABASE_URL is not set — see .env.example",
    );
  });

  it("does not throw when DATABASE_URL is set, and caches the instance", async () => {
    process.env.DATABASE_URL = "postgres://user:pass@fake-host/db";
    const { getDb } = await import("@/db/client");
    expect(() => getDb()).not.toThrow();
    expect(getDb()).toBe(getDb());
  });
});
