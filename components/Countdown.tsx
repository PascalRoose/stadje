"use client";

import { useEffect, useState } from "react";
import { msUntilNextAmsterdamMidnight } from "@/lib/time";

function format(ms: number): string {
  const totalMinutes = Math.max(0, Math.floor(ms / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}:${String(minutes).padStart(2, "0")}`;
}

// Mockup screens 04 & 05: "Volgend stadje over H:MM uur" (FR-011).
export function Countdown() {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    function tick() {
      setRemaining(msUntilNextAmsterdamMidnight());
    }
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  if (remaining === null) return null;

  return (
    <p className="countdown">Volgend stadje over {format(remaining)} uur</p>
  );
}
