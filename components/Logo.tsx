/**
 * Stadje's logo mark — a pixel-art trapgevel (stepped gable) tile, one lit window as the accent.
 * Shared by the header, favicon, apple touch icon and OG image so the geometry stays in one place.
 * Colors default to the brand's --red-bg / --green-bg (app/globals.css) — same values, so the mark
 * matches the rest of the UI without importing CSS custom properties into the OG-image renderer.
 */
export function LogoMark({
  size = 28,
  ink = "#A63F2E",
  accent = "#2F6B4A",
}: {
  size?: number;
  ink?: string;
  accent?: string;
}) {
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} aria-hidden="true">
      <rect width="200" height="200" rx="44" fill={ink} />
      <path
        d="M50 170 V100 H62 V84 H74 V68 H86 V52 H94 V40 H106 V52 H114 V68 H126 V84 H138 V100 H150 V170 Z"
        fill="#FFFCF6"
      />
      <rect x="94" y="60" width="12" height="14" rx="2" fill={ink} />
      <rect x="78" y="108" width="18" height="18" rx="3" fill={ink} />
      <rect x="104" y="108" width="18" height="18" rx="3" fill={ink} />
      <rect x="78" y="134" width="18" height="18" rx="3" fill={ink} />
      <rect x="104" y="134" width="18" height="18" rx="3" fill={accent} />
    </svg>
  );
}
