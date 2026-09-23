import { describe, expect, it } from "vitest";
import { generateMetadata } from "@/app/archive/[date]/page";
import { puzzleNumber } from "@/lib/launch-date";

describe("generateMetadata for /archive/[date]", () => {
  it("includes the formatted date and puzzle number, never the answer city", async () => {
    const date = "2026-09-17";
    const metadata = await generateMetadata({
      params: Promise.resolve({ date }),
    });
    expect(metadata.title).toBe("Stadje van 17 SEP · Archief");
    expect(metadata.description).toBe(
      `Raad stadje nr. ${puzzleNumber(date)} uit het Stadje-archief.`,
    );
    expect(metadata.alternates).toEqual({ canonical: `/archive/${date}` });
  });
});
