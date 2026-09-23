import { describe, expect, it } from "vitest";
import AppleIcon, { size as appleIconSize } from "@/app/apple-icon";
import Icon, { size as iconSize } from "@/app/icon";
import OgImage, { size as ogImageSize } from "@/app/opengraph-image";

describe.each([
  ["icon", Icon, iconSize],
  ["apple-icon", AppleIcon, appleIconSize],
  ["opengraph-image", OgImage, ogImageSize],
])("%s", (_name, generate, expectedSize) => {
  it(`renders a non-empty PNG at ${expectedSize.width}x${expectedSize.height}`, async () => {
    const res = generate();
    expect(res.headers.get("content-type")).toBe("image/png");
    const buf = await res.arrayBuffer();
    expect(buf.byteLength).toBeGreaterThan(0);
  });
});
