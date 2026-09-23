import { describe, expect, it } from "vitest";
import robots from "@/app/robots";
import { SITE_URL } from "@/lib/site";

describe("robots", () => {
  it("allows crawling everything except /settings and the API", () => {
    const result = robots();
    expect(result.rules).toEqual({
      userAgent: "*",
      allow: "/",
      disallow: ["/settings", "/api/"],
    });
  });

  it("points to the canonical sitemap URL", () => {
    expect(robots().sitemap).toBe(`${SITE_URL}/sitemap.xml`);
  });
});
