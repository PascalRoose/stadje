import { useEffect, useState } from "react";

export interface PuzzleResponse {
  date: string;
  imageUrl: string;
  imageCredit: { owner: string; license: string };
}

/** Fetches today's puzzle, or a specific past date's (archive replay, FR-016). */
export function usePuzzleData(date?: string): {
  puzzle: PuzzleResponse | null;
} {
  const [puzzle, setPuzzle] = useState<PuzzleResponse | null>(null);

  useEffect(() => {
    setPuzzle(null);
    const url = date ? `/api/puzzle?date=${date}` : "/api/puzzle";
    fetch(url)
      .then((r) => r.json())
      .then((data: PuzzleResponse) => setPuzzle(data));
  }, [date]);

  return { puzzle };
}
