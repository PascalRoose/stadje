import type { Metadata, Viewport } from "next";
import { Archivo, JetBrains_Mono, Newsreader } from "next/font/google";
import { AnalyticsGate } from "@/components/AnalyticsGate";
import { HighContrastEffect } from "@/components/HighContrastEffect";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

// Self-hosted at build time (constitution Principle VI: no third-party font CDN at runtime).
const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-serif",
  display: "swap",
});
const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
  display: "swap",
});

const title = "Stadje — dagelijks Nederlands stadjesraadspel";
const description =
  "Stadje is een dagelijks raadspel: je ziet een foto van een Nederlandse stad of groter dorp " +
  "en hebt zes pogingen. Na elke gok zie je de provincie, het aantal inwoners en de afstand tot " +
  "het juiste stadje. Iedereen speelt hetzelfde stadje, van middernacht tot middernacht.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: title, template: "%s · Stadje" },
  description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "nl_NL",
    siteName: "Stadje",
    url: "/",
    title,
    description,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export const viewport: Viewport = {
  themeColor: "#e8e2d6",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Stadje",
  url: SITE_URL,
  description,
  inLanguage: "nl-NL",
};

export default function RootLayout({
  children,
}: {
  children: import("react").ReactNode;
}) {
  return (
    <html
      lang="nl"
      className={`${newsreader.variable} ${archivo.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <HighContrastEffect />
        <div id="app-frame">
          <div id="app-phone">{children}</div>
        </div>
        <AnalyticsGate />
        <script
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: static JSON-LD, no user input
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
