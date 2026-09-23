import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import { LAUNCH_DATE } from "@/lib/launch-date";
import { SITE_URL } from "@/lib/site";
import { todayAmsterdam } from "@/lib/time";

describe("sitemap", () => {
  it("covers every day from launch up to (not including) today, with no gaps or duplicates", () => {
    const entries = sitemap();
    const archiveDates = entries
      .map((e) => e.url.match(/\/archive\/(\d{4}-\d{2}-\d{2})$/)?.[1])
      .filter((d): d is string => d !== undefined)
      .sort();

    const expected: string[] = [];
    for (let d = LAUNCH_DATE; d < todayAmsterdam(); ) {
      expected.push(d);
      const [y, m, day] = d.split("-").map(Number);
      const dt = new Date(Date.UTC(y, m - 1, day));
      dt.setUTCDate(dt.getUTCDate() + 1);
      d = dt.toISOString().slice(0, 10);
    }

    expect(archiveDates).toEqual(expected);
    expect(archiveDates).not.toContain(todayAmsterdam());
  });

  it("prefixes every URL with the canonical site URL", () => {
    for (const entry of sitemap()) {
      expect(entry.url.startsWith(SITE_URL)).toBe(true);
    }
  });
});
