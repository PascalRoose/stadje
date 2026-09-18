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
            </div>
            <div className="nav-menu__footer">
              <div className="nav-menu__legal">
                <Link href="/privacy" onClick={() => setOpen(false)}>
                  Privacybeleid
                </Link>
                <Link href="/terms" onClick={() => setOpen(false)}>
                  Voorwaarden
                </Link>
              </div>
            </div>
          </nav>
        </>
      )}
    </>
  );
}
