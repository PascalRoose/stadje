import type { Metadata } from "next";
import { PuzzlePlayer } from "@/components/PuzzlePlayer";
import { puzzleNumber } from "@/lib/launch-date";
import { formatHeaderDate } from "@/lib/time";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ date: string }>;
}): Promise<Metadata> {
  const { date } = await params;
  return {
    title: `Stadje van ${formatHeaderDate(date)} · Archief`,
    description: `Raad stadje nr. ${puzzleNumber(date)} uit het Stadje-archief.`,
    alternates: { canonical: `/archive/${date}` },
  };
}

// FR-016: play/view any past date under the same rules as today's puzzle.
export default async function ArchiveDatePage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  return <PuzzlePlayer date={date} />;
}
