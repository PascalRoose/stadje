import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET as getImage } from "@/app/api/puzzle/image/route";
import { cityForDate } from "@/lib/game/selection";

// Known puzzle date from the committed data/puzzle-cycle.json — see tests/integration/archive.test.ts
// for the same "make today genuinely a known past/present date via fake timers" pattern.
const KNOWN_DATE = "2026-09-17";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(`${KNOWN_DATE}T12:00:00Z`));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function req(url: string) {
  return new NextRequest(`http://localhost${url}`);
}

describe("GET /api/puzzle/image", () => {
  it("streams the upstream image without ever exposing its origin URL", async () => {
    const city = cityForDate(KNOWN_DATE)!;
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      body: new Response("fake-image-bytes").body,
      headers: {
        get: (name: string) => (name === "content-type" ? "image/png" : null),
      },
    });
    vi.stubGlobal("fetch", fetchSpy);

    const res = await getImage(req(`/api/puzzle/image?date=${KNOWN_DATE}`));

    expect(fetchSpy).toHaveBeenCalledExactlyOnceWith(city.image.url);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/png");
    expect(res.headers.get("cache-control")).toBe("public, max-age=3600");
    await expect(res.text()).resolves.toBe("fake-image-bytes");
  });

  it("defaults content-type to image/jpeg when upstream doesn't send one", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        body: new Response("bytes").body,
        headers: { get: () => null },
      }),
    );

    const res = await getImage(req(`/api/puzzle/image?date=${KNOWN_DATE}`));

    expect(res.headers.get("content-type")).toBe("image/jpeg");
  });

  it("uses today when no date param is given", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      body: new Response("bytes").body,
      headers: { get: () => "image/png" },
    });
    vi.stubGlobal("fetch", fetchSpy);

    const res = await getImage(req("/api/puzzle/image"));

    expect(res.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledExactlyOnceWith(
      cityForDate(KNOWN_DATE)!.image.url,
    );
  });

  it("rejects a malformed date without calling upstream fetch", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const res = await getImage(req("/api/puzzle/image?date=not-a-date"));

    expect(res.status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("rejects a future date", async () => {
    const res = await getImage(req("/api/puzzle/image?date=2026-09-18"));
    expect(res.status).toBe(400);
  });

  it("rejects a date outside the generated puzzle cycle", async () => {
    const res = await getImage(req("/api/puzzle/image?date=2020-01-01"));
    expect(res.status).toBe(400);
  });

  it("returns 502 when the upstream response is not ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, body: null }),
    );

    const res = await getImage(req(`/api/puzzle/image?date=${KNOWN_DATE}`));

    expect(res.status).toBe(502);
  });

  it("returns 502 when the upstream response has no body", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, body: null }));

    const res = await getImage(req(`/api/puzzle/image?date=${KNOWN_DATE}`));

    expect(res.status).toBe(502);
  });
});
