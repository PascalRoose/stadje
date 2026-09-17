"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface PuzzlePhotoProps {
  imageUrl: string;
  credit: string;
  alt: string;
}

// The thumbnail crops to a flat aspect ratio (globals.css), so the full photo isn't always
// visible — the expand icon opens it uncropped, full screen, with click-to-zoom.
export function PuzzlePhoto({ imageUrl, credit, alt }: PuzzlePhotoProps) {
  const [open, setOpen] = useState(false);
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setZoomed(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function close() {
    setOpen(false);
    setZoomed(false);
  }

  return (
    <>
      <div className="puzzle-photo">
        <Image src={imageUrl} alt={alt} fill sizes="430px" />
        <p className="puzzle-photo__credit">Foto: {credit}</p>
        <button
          type="button"
          className="puzzle-photo__expand"
          onClick={() => setOpen(true)}
          aria-label="Bekijk foto op volledig scherm"
        >
          🔍
        </button>
      </div>
      {open &&
        createPortal(
          <div
            className="photo-lightbox"
            role="dialog"
            aria-modal="true"
            aria-label={alt}
            onClick={close}
            onKeyDown={(e) => {
              if (e.key === "Escape") close();
            }}
          >
            <button
              type="button"
              className="photo-lightbox__close"
              aria-label="Sluiten"
              onClick={close}
            >
              ×
            </button>
            <div className="photo-lightbox__viewport">
              <button
                type="button"
                className="photo-lightbox__img-toggle"
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomed((z) => !z);
                }}
                aria-label={zoomed ? "Zoom uit" : "Zoom in"}
              >
                {/* biome-ignore lint/performance/noImgElement: needs natural pixel size for click-to-zoom/pan, next/image's fixed layout can't do this */}
                <img
                  src={imageUrl}
                  alt={alt}
                  className={
                    zoomed
                      ? "photo-lightbox__img photo-lightbox__img--zoomed"
                      : "photo-lightbox__img"
                  }
                />
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
