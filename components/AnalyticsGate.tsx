"use client";

import { Analytics } from "@vercel/analytics/react";
import { useEffect, useState } from "react";
import { hasAnalyticsConsent } from "@/lib/consent";
import { loadState } from "@/lib/local-storage";

// Vercel Analytics (constitution Principle VI / Tech Stack section) MUST stay gated behind the
// same revocable opt-in as the in-house stats beacon — re-checked on every local state change so
// toggling it off in Settings takes effect without a reload.
export function AnalyticsGate() {
  const [optedIn, setOptedIn] = useState(false);

  useEffect(() => {
    const check = () => setOptedIn(hasAnalyticsConsent(loadState()));
    check();
    window.addEventListener("stadje:state-changed", check);
    return () => window.removeEventListener("stadje:state-changed", check);
  }, []);

  if (!optedIn) return null;
  return <Analytics />;
}
