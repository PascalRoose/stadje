import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { POST as postGuess } from "@/app/api/puzzle/guess/route";
import { GET as getPuzzle } from "@/app/api/puzzle/route";
import { getCityById } from "@/lib/cities";
import { cityForDate } from "@/lib/game/selection";
import { LAUNCH_DATE } from "@/scripts/generate-puzzle-cycle";

describe("puzzle win path", () => {
  it("GET /api/puzzle never includes the answer's cityId or name", async () => {
    const req = new NextRequest(
      `http://localhost/api/puzzle?date=${LAUNCH_DATE}`,
    );
    const res = await getPuzzle(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.date).toBe(LAUNCH_DATE);
    expect(body.imageUrl).toBeTypeOf("string");
    expect(body).not.toHaveProperty("cityId");
    expect(body).not.toHaveProperty("name");
    expect(JSON.stringify(body)).not.toContain(cityForDate(LAUNCH_DATE)!.name);
  });

  it("POST /api/puzzle/guess with the correct city returns correct:true plus a reveal", async () => {
    const answer = cityForDate(LAUNCH_DATE)!;
    const req = new NextRequest("http://localhost/api/puzzle/guess", {
      method: "POST",
      body: JSON.stringify({ date: LAUNCH_DATE, cityId: answer.id }),
    });
    const res = await postGuess(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.correct).toBe(true);
    expect(body.reveal).toMatchObject({
      name: answer.name,
      province: answer.province,
      population: answer.population,
    });
    expect(body.hints.province.tier).toBe("green");
    expect(body.hints.population.tier).toBe("green");
    expect(body.hints.distance.tier).toBe("green");
    expect(body.hints.distance.km).toBe(0);
  });

  it("POST /api/puzzle/guess with an incorrect city returns correct:false and no reveal", async () => {
    const answer = cityForDate(LAUNCH_DATE)!;
    const other =
      getCityById("utrecht")?.id === answer.id
        ? getCityById("rotterdam")!
        : getCityById("utrecht")!;
    const req = new NextRequest("http://localhost/api/puzzle/guess", {
      method: "POST",
      body: JSON.stringify({ date: LAUNCH_DATE, cityId: other.id }),
    });
    const res = await postGuess(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.correct).toBe(false);
    expect(body).not.toHaveProperty("reveal");
  });

  it("POST /api/puzzle/guess rejects an unknown cityId", async () => {
    const req = new NextRequest("http://localhost/api/puzzle/guess", {
      method: "POST",
      body: JSON.stringify({ date: LAUNCH_DATE, cityId: "not-a-real-city" }),
    });
    const res = await postGuess(req);
    expect(res.status).toBe(400);
  });
});
