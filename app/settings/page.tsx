"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { hasAnalyticsConsent, recordConsent } from "@/lib/consent";
import { type LocalGameState, loadState, saveState } from "@/lib/local-storage";

// Mockup screen 11 (Instellingen) — FR-017 acceptance scenario 4, FR-020.
export default function SettingsPage() {
  const [state, setState] = useState<LocalGameState | null>(null);

  useEffect(() => {
    setState(loadState());
  }, []);

  if (!state) return <p className="loading">Laden…</p>;

  function update(next: LocalGameState) {
    saveState(next);
    setState(next);
    document.documentElement.dataset.highContrast = String(
      next.settings.highContrast,
    );
  }

  return (
    <>
      <PageHeader title="Instellingen" />
      <div className="screen settings-page">
        <label className="settings-page__toggle">
          <span className="settings-page__toggle-label">
            <span>Hoog contrast</span>
            <span className="settings-page__hint">
              Sterkere randen en donkerder tekst
            </span>
          </span>
          <input
            type="checkbox"
            checked={state.settings.highContrast}
            onChange={(e) =>
              update({
                ...state,
                settings: { ...state.settings, highContrast: e.target.checked },
              })
            }
          />
        </label>

        <label className="settings-page__toggle">
          <span className="settings-page__toggle-label">
            <span>Bezoekstatistieken</span>
            <span className="settings-page__hint">
              Anoniem, geen advertenties
            </span>
          </span>
          <input
            type="checkbox"
            checked={hasAnalyticsConsent(state)}
            onChange={(e) => update(recordConsent(state, e.target.checked))}
          />
        </label>

        <p className="settings-page__info">
          <strong>Dagwisseling</strong>
          <br />
          Om 00:00 in Amsterdam, waar je ook bent
        </p>

        <p className="settings-page__info">
          <strong>Afstand in</strong>
          <br />
          Afgerond op hele kilometers
        </p>

        <nav className="settings-page__links">
          <Link href="/privacy">Privacybeleid →</Link>
          <Link href="/terms">Voorwaarden →</Link>
        </nav>
      </div>
    </>
  );
}
