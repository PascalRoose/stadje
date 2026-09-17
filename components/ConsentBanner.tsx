"use client";

interface ConsentBannerProps {
  onDecide: (analyticsOptIn: boolean) => void;
}

// Mockup screen 13 (Cookiemelding) — a bottom sheet, not a centered dialog — FR-017.
export function ConsentBanner({ onDecide }: ConsentBannerProps) {
  return (
    <>
      <div className="consent-banner__scrim" />
      <div
        className="consent-banner"
        role="dialog"
        aria-label="Cookies en statistieken"
      >
        <h2>Cookies en statistieken</h2>
        <p>
          Je spelvoortgang blijft altijd op je eigen apparaat staan — daar is
          geen toestemming voor nodig. Mag Stadje daarnaast anonieme
          bezoekstatistieken bijhouden?
        </p>
        <div className="consent-banner__actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => onDecide(false)}
          >
            Weigeren
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onDecide(true)}
          >
            Accepteren
          </button>
        </div>
        <p className="consent-banner__links">
          <a href="/privacy">Privacybeleid</a> ·{" "}
          <a href="/terms">Voorwaarden</a>
        </p>
      </div>
    </>
  );
}
