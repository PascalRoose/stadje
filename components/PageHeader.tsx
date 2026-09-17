import Link from "next/link";

// Shared header for every non-puzzle screen (archive, stats, about, settings, privacy, terms,
// how-it-works) — mockup screens 06/08/09/10/11/12: "←" back icon + centered serif title.
export function PageHeader({ title }: { title: string }) {
  return (
    <header className="app-header">
      <Link href="/" className="icon-button" aria-label="Terug">
        ←
      </Link>
      <div className="app-header__title">
        <span>{title}</span>
      </div>
      <span />
    </header>
  );
}
