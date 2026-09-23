import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Statistieken",
  description: "Je reeks, gemiddelde en verdeling van gokken bij Stadje.",
  alternates: { canonical: "/stats" },
};

export default function StatsLayout({
  children,
}: {
  children: import("react").ReactNode;
}) {
  return <>{children}</>;
}
