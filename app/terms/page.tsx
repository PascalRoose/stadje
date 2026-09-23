import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "Voorwaarden",
  description: "De spelregels en gebruiksvoorwaarden van Stadje.",
  alternates: { canonical: "/terms" },
};

// Terms of Service — FR-025, linked from the same places as the Privacy Policy.
export default function TermsPage() {
  return (
    <>
      <PageHeader title="Voorwaarden" />
      <div className="screen terms-page">
        <section>
          <h2>Het spel</h2>
          <p>
            Stadje is een gratis, dagelijks raadspel. Er is geen account nodig
            om te spelen; je voortgang wordt lokaal in je browser bewaard (zie{" "}
            <Link href="/privacy">Privacybeleid</Link>
            ).
          </p>
        </section>

        <section>
          <h2>Gebruik</h2>
          <p>
            Je mag Stadje gebruiken voor persoonlijk, niet-commercieel vermaak.
            Geautomatiseerd gebruik dat het spel voor andere spelers verstoort
            is niet toegestaan.
          </p>
        </section>

        <section>
          <h2>Inhoud</h2>
          <p>
            Stadsfoto's zijn gebruikt onder de licentie vermeld bij elke foto;
            inwonersaantallen komen van het CBS. Zie het{" "}
            <Link href="/privacy">privacybeleid</Link> voor volledige
            bronvermelding.
          </p>
        </section>

        <section>
          <h2>Geen garantie</h2>
          <p>
            Stadje wordt aangeboden zoals het is, zonder garanties. Afstanden en
            inwonersaantallen zijn benaderingen, niet geschikt voor officieel
            gebruik.
          </p>
        </section>

        <section>
          <h2>Contact</h2>
          <p>Vragen? pascalroose@outlook.com</p>
        </section>
      </div>
    </>
  );
}
