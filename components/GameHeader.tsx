"use client";

import { useState } from "react";
import { HowItWorksModal } from "@/components/HowItWorksModal";
import { NavMenu } from "@/components/NavMenu";
import { puzzleNumber } from "@/lib/launch-date";
import { formatHeaderDate } from "@/lib/time";

interface GameHeaderProps {
  date?: string;
}

/** The in-game header: puzzle number/date, the "how it works" trigger, and the nav menu. */
export function GameHeader({ date }: GameHeaderProps) {
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);

  return (
    <header className="app-header">
      <button
        type="button"
        className="icon-button"
        aria-label="Hoe werkt Stadje?"
        onClick={() => setHowItWorksOpen(true)}
      >
        ?
      </button>
      {howItWorksOpen && (
        <HowItWorksModal onClose={() => setHowItWorksOpen(false)} />
      )}
      <div className="app-header__title">
        <span>Stadje</span>
        {date && (
          <span className="app-header__date">
            NR. {puzzleNumber(date)} · {formatHeaderDate(date)}
          </span>
        )}
      </div>
      <NavMenu />
    </header>
  );
}
