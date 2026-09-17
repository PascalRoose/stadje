import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";

// Mockup screen 12 (Privacy & voorwaarden) — FR-019, FR-022.
export default function PrivacyPage() {
  return (
    <>
      <PageHeader title="Privacy" />
      <div className="screen privacy-page">
        <h1>Wat Stadje opslaat</h1>
        <p className="privacy-page__updated">BIJGEWERKT 1 SEP 2026</p>

        <section>
          <h2>Op je apparaat</h2>
          <p>
            Je gokken, reeks en statistieken staan in de opslag van je browser.
            Ze verlaten je apparaat niet en er hoort geen account bij.
          </p>
        </section>

        <section>
          <h2>Statistieken</h2>
          <p>
            Alleen met jouw toestemming: anonieme bezoekcijfers zonder profielen
            of advertenties. Je kunt dit altijd intrekken in het menu.
          </p>
        </section>

        <section>
          <h2>Lettertypen</h2>
          <p>
            Lettertypen worden vanaf onze eigen server geladen, zodat je
            IP-adres niet naar derden gaat.
          </p>
        </section>

        <section>
          <h2>Bronnen</h2>
          <p>
            Inwonersaantallen: CBS (2026). Foto's: rechthebbende en licentie
            staan onder elke foto.
          </p>
        </section>

        <section>
          <h2>Aansprakelijkheid</h2>
          <p>
            Stadje is een spel. Afstanden en inwonersaantallen zijn benaderingen
            en niet geschikt voor officieel gebruik.
          </p>
        </section>

        <section>
          <h2>Contact</h2>
          <p>
            pascalroose@outlook.com — verwerkingsverantwoordelijke is Pascal
            Roose, particulier.
          </p>
        </section>

        <Link href="/terms">Voorwaarden →</Link>
      </div>
    </>
  );
}
