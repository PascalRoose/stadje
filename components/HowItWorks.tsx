// Mockup screen 06 (Hoe werkt het) — FR-018: reachable by any player, at any time, not only
// shown once to first-time players (hence a standalone page linked from NavMenu, not a
// one-time-only modal).
export function HowItWorks() {
  return (
    <div className="how-it-works">
      <p>
        Elke dag één Nederlandse stad. Je ziet een foto en hebt{" "}
        <strong>zes pogingen</strong>. Na elke gok krijg je drie aanwijzingen.
      </p>

      <section className="how-it-works__row">
        <div>
          <h2>Provincie</h2>
          <p>Groen als die klopt, rood als niet.</p>
        </div>
        <span className="how-it-works__example" data-tier="green">
          Zuid-Holland
        </span>
      </section>

      <section className="how-it-works__row">
        <div>
          <h2>Inwoners</h2>
          <p>De pijl wijst naar het juiste aantal.</p>
        </div>
        <span className="how-it-works__example" data-tier="orange">
          942k ↓
        </span>
      </section>

      <section className="how-it-works__row">
        <div>
          <h2>Richting + afstand</h2>
          <p>Waar en hoe ver het stadje ligt.</p>
        </div>
        <span className="how-it-works__example" data-tier="red">
          ↘ 180 km
        </span>
      </section>

      <p>
        Alle steden en grotere dorpen van Nederland zitten in het spel — typ en
        kies uit de lijst.
      </p>
    </div>
  );
}
