import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Over Stadje",
  description:
    "Stadje is een dagelijks raadspel: raad de Nederlandse stad aan de hand van een foto, in zes pogingen.",
  alternates: { canonical: "/about" },
};

export default function AboutLayout({
  children,
}: {
  children: import("react").ReactNode;
}) {
  return <>{children}</>;
}
