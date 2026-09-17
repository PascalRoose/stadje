import { PuzzlePlayer } from "@/components/PuzzlePlayer";

// FR-016: play/view any past date under the same rules as today's puzzle.
export default async function ArchiveDatePage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  return <PuzzlePlayer date={date} />;
}
