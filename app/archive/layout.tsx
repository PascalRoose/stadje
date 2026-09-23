import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Archief",
  description: "Speel of bekijk elk eerder Stadje, van de eerste dag tot nu.",
  alternates: { canonical: "/archive" },
};

export default function ArchiveLayout({
  children,
}: {
  children: import("react").ReactNode;
}) {
  return <>{children}</>;
}
