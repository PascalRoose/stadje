"use client";

import { useEffect } from "react";
import { HowItWorks } from "@/components/HowItWorks";

interface HowItWorksModalProps {
  onClose: () => void;
}

// Opened from the "?" icon on the main screen (FR-018: reachable at any time, without leaving
// the puzzle) — app/how-it-works/page.tsx still exists as a standalone page for direct links.
export function HowItWorksModal({ onClose }: HowItWorksModalProps) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <>
      <button
        type="button"
        className="modal-backdrop"
        aria-label="Sluiten"
        onClick={onClose}
      />
      <div
        className="modal-card how-it-works-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Hoe werkt Stadje?"
      >
        <button
          type="button"
          className="modal-card__close"
          aria-label="Sluiten"
          onClick={onClose}
        >
          ×
        </button>
        <h2>Hoe werkt Stadje?</h2>
        <HowItWorks />
      </div>
    </>
  );
}
