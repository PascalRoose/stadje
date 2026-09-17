import type { Metadata } from "next";
import { Archivo, JetBrains_Mono, Newsreader } from "next/font/google";
import { HighContrastEffect } from "@/components/HighContrastEffect";
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

export const metadata: Metadata = {
  title: "Stadje",
  description:
    "Een dagelijks raadspel: raad de Nederlandse stad aan de hand van een foto.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
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
      </body>
    </html>
  );
}
