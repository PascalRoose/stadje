import { describe, expect, it } from "vitest";
import { mulberry32, shuffle } from "@/lib/game/prng";

describe("mulberry32", () => {
  it("produces an identical sequence from independent instances given the same seed", () => {
    const a = mulberry32(1);
    const b = mulberry32(1);
    const seqA = [a(), a(), a()];
    const seqB = [b(), b(), b()];
    expect(seqA).toEqual(seqB);
  });

  it("matches a known sequence for seed 1 (regression snapshot)", () => {
    const gen = mulberry32(1);
    expect([gen(), gen(), gen()]).toEqual([
      0.6270739405881613, 0.002735721180215478, 0.5274470399599522,
    ]);
  });

  it("produces different sequences for different seeds", () => {
    const a = mulberry32(1)();
    const b = mulberry32(2)();
    expect(a).not.toBe(b);
  });

  it("always stays within [0, 1)", () => {
    const gen = mulberry32(999);
    for (let i = 0; i < 500; i++) {
      const value = gen();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe("shuffle", () => {
  const items = [1, 2, 3, 4, 5, 6, 7, 8];

  it("is deterministic given a fresh generator with the same seed", () => {
    expect(shuffle(items, mulberry32(123))).toEqual(
      shuffle(items, mulberry32(123)),
    );
  });

  it("matches a known ordering for seed 123 (regression snapshot, ADR 0011)", () => {
    expect(shuffle(items, mulberry32(123))).toEqual([1, 4, 6, 5, 8, 3, 2, 7]);
  });

  it("does not mutate the input array", () => {
    const original = [...items];
    shuffle(items, mulberry32(1));
    expect(items).toEqual(original);
  });

  it("returns a true permutation — same elements, same length, no duplicates or drops", () => {
    const result = shuffle(items, mulberry32(7));
    expect(result).toHaveLength(items.length);
    expect([...result].sort()).toEqual([...items].sort());
  });
});
