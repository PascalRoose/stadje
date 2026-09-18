import type { StoredStats } from "@/lib/local-storage";

const KEYS = ["1", "2", "3", "4", "5", "6", "X"] as const;

interface AttemptsDistributionProps {
  attemptsDistribution: StoredStats["attemptsDistribution"];
}

// The 1-6/X guess-count histogram — shared by app/stats/page.tsx and ResultModal, so both stay
// in sync. Bar widths are relative to the largest bucket, with a floor so a small non-zero count
// still reads as a visible bar rather than looking empty.
export function AttemptsDistribution({
  attemptsDistribution,
}: AttemptsDistributionProps) {
  const maxAttempts = Math.max(...Object.values(attemptsDistribution));

  return (
    <ul className="stats-page__distribution">
      {KEYS.map((key) => {
        const count = attemptsDistribution[key];
        const widthPct =
          count === 0
            ? 0
            : Math.max(8, Math.round((count / maxAttempts) * 100));
        return (
          <li key={key}>
            <span className="stats-page__distribution-label">{key}</span>
            <span className="stats-page__distribution-track">
              <span
                className={
                  key === "X"
                    ? "stats-page__distribution-bar stats-page__distribution-bar--miss"
                    : "stats-page__distribution-bar"
                }
                style={{ width: `${widthPct}%` }}
              />
            </span>
            <span className="stats-page__distribution-count">{count}</span>
          </li>
        );
      })}
    </ul>
  );
}
