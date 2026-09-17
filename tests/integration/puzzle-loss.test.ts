import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { POST as postGuess } from "@/app/api/puzzle/guess/route";
import { GET as getReveal } from "@/app/api/puzzle/reveal/route";
import { getCities } from "@/lib/cities";
import { cityForDate } from "@/lib/game/selection";
import { LAUNCH_DATE } from "@/scripts/generate-puzzle-cycle";

describe("puzzle loss path", () => {
  it("6 incorrect guesses, then GET /api/puzzle/reveal returns the correct answer", async () => {
    const answer = cityForDate(LAUNCH_DATE)!;
    const wrongGuesses = getCities()
      .filter((c) => c.id !== answer.id)
      .slice(0, 6);
    expect(wrongGuesses).toHaveLength(6);

    for (const guess of wrongGuesses) {
      const req = new NextRequest("http://localhost/api/puzzle/guess", {
        method: "POST",
        body: JSON.stringify({ date: LAUNCH_DATE, cityId: guess.id }),
      });
      const res = await postGuess(req);
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.correct).toBe(false);
    }

    const revealReq = new NextRequest(
      `http://localhost/api/puzzle/reveal?date=${LAUNCH_DATE}`,
    );
    const revealRes = await getReveal(revealReq);
    const revealBody = await revealRes.json();

    expect(revealRes.status).toBe(200);
    expect(revealBody.name).toBe(answer.name);
    expect(revealBody.province).toBe(answer.province);
  });

  it("rejects a reveal request for a future date", async () => {
    const req = new NextRequest(
      "http://localhost/api/puzzle/reveal?date=2999-01-01",
    );
    const res = await getReveal(req);
    expect(res.status).toBe(400);
  });
});
