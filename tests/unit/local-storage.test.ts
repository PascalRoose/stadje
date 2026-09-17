import { afterEach, describe, expect, it, vi } from "vitest";
import { emptyState, loadState, saveState } from "@/lib/local-storage";

// vitest.config.ts runs this suite under environment "node", so `window` is undefined by
// default — that already exercises loadState/saveState's SSR no-op path. These tests stub
// `window` in to cover the browser paths, including the SecurityError case that motivated the
// fix in lib/local-storage.ts (blocked cookies/site data throw on merely reading
// window.localStorage, not just on calling its methods).
describe("local-storage — window.localStorage unavailable (SSR)", () => {
  it("loadState returns emptyState() when window is undefined", () => {
    expect(loadState()).toEqual(emptyState());
  });

  it("saveState is a silent no-op when window is undefined", () => {
    expect(() => saveState(emptyState())).not.toThrow();
  });
});

function fakeStorage(overrides: Partial<Storage> = {}): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
    key: () => null,
    get length() {
      return store.size;
    },
    ...overrides,
  } as Storage;
}

describe("local-storage — cookies/site data blocked", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loadState() returns emptyState() when reading window.localStorage throws (Safari 'Block All Cookies')", () => {
    vi.stubGlobal(
      "window",
      Object.defineProperty({}, "localStorage", {
        get() {
          throw new DOMException("blocked", "SecurityError");
        },
      }),
    );
    expect(loadState()).toEqual(emptyState());
  });

  it("saveState() silently drops the write when reading window.localStorage throws", () => {
    vi.stubGlobal(
      "window",
      Object.defineProperty({}, "localStorage", {
        get() {
          throw new DOMException("blocked", "SecurityError");
        },
      }),
    );
    expect(() => saveState(emptyState())).not.toThrow();
  });
});

describe("local-storage — normal round trip", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("saveState() then loadState() returns the same state", () => {
    vi.stubGlobal("window", { localStorage: fakeStorage() });
    const state = {
      ...emptyState(),
      consent: { analyticsOptIn: true, decidedAt: "now" },
    };
    saveState(state);
    expect(loadState()).toEqual(state);
  });

  it("loadState() returns emptyState() for corrupted JSON", () => {
    const storage = fakeStorage();
    storage.setItem("stadje:v1", "{not valid json");
    vi.stubGlobal("window", { localStorage: storage });
    expect(loadState()).toEqual(emptyState());
  });

  it("loadState() resets to emptyState() on a schema version mismatch", () => {
    const storage = fakeStorage();
    storage.setItem(
      "stadje:v1",
      JSON.stringify({ ...emptyState(), schemaVersion: 1 }),
    );
    vi.stubGlobal("window", { localStorage: storage });
    expect(loadState()).toEqual(emptyState());
  });

  it("saveState() swallows a quota-exceeded error instead of throwing", () => {
    const storage = fakeStorage({
      setItem: () => {
        throw new DOMException("quota exceeded", "QuotaExceededError");
      },
    });
    vi.stubGlobal("window", { localStorage: storage });
    expect(() => saveState(emptyState())).not.toThrow();
  });
});
