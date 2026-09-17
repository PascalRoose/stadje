#!/usr/bin/env tsx
// Generates data/puzzle-cycle.json: the day->city assignment implementing ADR 0011
// (shuffle-once, cycle through). See docs/adr/0011-daily-puzzle-selection-algorithm.md and
// specs/001-daily-city-puzzle/research.md.
//
// Usage: pnpm generate:puzzle-cycle [horizonDays]

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getCities } from "../lib/cities";
import { mulberry32, shuffle } from "../lib/game/prng";
import { LAUNCH_DATE } from "../lib/launch-date";

export { LAUNCH_DATE };

// Fixed base seed — public (ADR 0011 explicitly accepts this), combined with the cycle number so
// each cycle gets a distinct shuffle order.
const BASE_SEED = 0x5741_4145; // "STADJE"-ish, arbitrary fixed constant

export interface PuzzleCycleEntry {
  cityId: string;
  cycleNumber: number;
  positionInCycle: number;
}

export type PuzzleCycle = Record<string, PuzzleCycleEntry>;

function addDaysUTC(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Pure generation function — testable without touching the filesystem. */
export function generatePuzzleCycle(
  cityIds: string[],
  launchDate: string,
  horizonDays: number,
): PuzzleCycle {
  const cycleLength = cityIds.length;
  if (cycleLength === 0) {
    throw new Error("Cannot generate a puzzle cycle from an empty city list");
  }

  const cycleOrders = new Map<number, string[]>();
  function orderForCycle(cycleNumber: number): string[] {
    let order = cycleOrders.get(cycleNumber);
    if (!order) {
      order = shuffle(cityIds, mulberry32(BASE_SEED + cycleNumber));
      cycleOrders.set(cycleNumber, order);
    }
    return order;
  }

  const result: PuzzleCycle = {};
  for (let dayIndex = 0; dayIndex < horizonDays; dayIndex++) {
    const cycleNumber = Math.floor(dayIndex / cycleLength);
    const positionInCycle = dayIndex % cycleLength;
    const cityId = orderForCycle(cycleNumber)[positionInCycle];
    const date = addDaysUTC(launchDate, dayIndex);
    result[date] = { cityId, cycleNumber, positionInCycle };
  }
  return result;
}

function main() {
  const horizonDays = Number(process.argv[2]) || getCities().length * 2;
  const cityIds = getCities().map((c) => c.id);
  const cycle = generatePuzzleCycle(cityIds, LAUNCH_DATE, horizonDays);

  const outPath = join(
    dirname(fileURLToPath(import.meta.url)),
    "..",
    "data",
    "puzzle-cycle.json",
  );
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(cycle, null, 2)}\n`);
  console.log(
    `[generate-puzzle-cycle] wrote ${Object.keys(cycle).length} days (from ${LAUNCH_DATE}) to ${outPath}`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
