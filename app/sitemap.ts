import type { MetadataRoute } from "next";
import { LAUNCH_DATE } from "@/lib/launch-date";
import { SITE_URL } from "@/lib/site";
import { todayAmsterdam } from "@/lib/time";

function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

const staticRoutes: MetadataRoute.Sitemap = [
  { url: "/", changeFrequency: "daily", priority: 1 },
  { url: "/about", changeFrequency: "yearly", priority: 0.3 },
  { url: "/archive", changeFrequency: "daily", priority: 0.5 },
  { url: "/how-it-works", changeFrequency: "yearly", priority: 0.3 },
  { url: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  { url: "/stats", changeFrequency: "daily", priority: 0.3 },
  { url: "/terms", changeFrequency: "yearly", priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const today = todayAmsterdam();
  const archiveDates: MetadataRoute.Sitemap = [];
  for (let d = LAUNCH_DATE; d < today; d = addDays(d, 1)) {
    archiveDates.push({
      url: `/archive/${d}`,
      changeFrequency: "monthly",
      priority: 0.5,
    });
  }

  return [...staticRoutes, ...archiveDates].map((entry) => ({
    ...entry,
    url: `${SITE_URL}${entry.url}`,
  }));
}
