"use client";

import Link from "next/link";
import { useState } from "react";

// Mockup screen 07 (Menu) — slide-over drawer with a dimmed scrim, the "≡" header icon shared
// by nearly every screen.
export function NavMenu() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="icon-button"
        aria-label={open ? "Sluit menu" : "Open menu"}
        onClick={() => setOpen((o) => !o)}
      >
        {open ? "×" : "≡"}
      </button>
      {open && (
        <>
          <button
            type="button"
            className="nav-menu__scrim"
            aria-label="Sluit menu"
            onClick={() => setOpen(false)}
          />
          <nav className="nav-menu__panel">
            <div className="nav-menu__links">
              <Link href="/how-it-works" onClick={() => setOpen(false)}>
                Hoe werkt Stadje?
              </Link>
              <Link href="/archive" onClick={() => setOpen(false)}>
                Archief
              </Link>
              <Link href="/stats" onClick={() => setOpen(false)}>
                Statistieken
              </Link>
              <Link href="/about" onClick={() => setOpen(false)}>
                Over Stadje
              </Link>
              <Link href="/settings" onClick={() => setOpen(false)}>
                Instellingen
              </Link>
              <Link href="/privacy" onClick={() => setOpen(false)}>
                Privacybeleid
              </Link>
              <Link href="/terms" onClick={() => setOpen(false)}>
                Voorwaarden
              </Link>
            </div>
            <div className="nav-menu__footer">
              <p className="nav-menu__credit">Made with ❤️ by Pascal</p>
              <a
                href="https://github.com/PascalRoose/stadje"
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline nav-menu__github"
              >
                <svg
                  aria-hidden="true"
                  className="nav-menu__github-icon"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="currentColor"
                    d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.74.08-.74 1.2.08 1.84 1.23 1.84 1.23 1.07 1.83 2.8 1.3 3.49.99.11-.77.42-1.3.76-1.6-2.67-.3-5.47-1.34-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.6-2.8 5.62-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.69.83.57A12 12 0 0 0 12 .5"
                  />
                </svg>
                View on GitHub
              </a>
            </div>
          </nav>
        </>
      )}
    </>
  );
}
