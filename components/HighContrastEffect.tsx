"use client";

import { useEffect } from "react";
import { loadState } from "@/lib/local-storage";

// Applies the settings.highContrast toggle (mockup screen 11 / FR-020) by flagging <html>, which
// globals.css then targets. Local-only, no server round-trip.
export function HighContrastEffect() {
  useEffect(() => {
    const apply = () => {
      document.documentElement.dataset.highContrast = String(
        loadState().settings.highContrast,
      );
    };
    apply();
    window.addEventListener("storage", apply);
    return () => window.removeEventListener("storage", apply);
  }, []);

  return null;
}
