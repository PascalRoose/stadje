// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { metadata as aboutMetadata } from "@/app/about/layout";
import { metadata as archiveMetadata } from "@/app/archive/layout";
import HowItWorksPage, {
  metadata as howItWorksMetadata,
} from "@/app/how-it-works/page";
import PrivacyPage, { metadata as privacyMetadata } from "@/app/privacy/page";
import { metadata as statsMetadata } from "@/app/stats/layout";
import TermsPage, { metadata as termsMetadata } from "@/app/terms/page";

afterEach(cleanup);

describe("per-route metadata", () => {
  it("gives every route its own title and canonical path", () => {
    for (const m of [
      howItWorksMetadata,
      privacyMetadata,
      termsMetadata,
      aboutMetadata,
      archiveMetadata,
      statsMetadata,
    ]) {
      expect(typeof m.title).toBe("string");
      expect((m.title as string).length).toBeGreaterThan(0);
      expect(typeof m.description).toBe("string");
      expect(m.alternates).toHaveProperty("canonical");
    }
  });
});

describe("static content pages render", () => {
  it("HowItWorksPage shows its header and hint explanations", () => {
    render(<HowItWorksPage />);
    expect(screen.getByText("Hoe werkt Stadje?")).toBeTruthy();
    expect(screen.getByText("Provincie")).toBeTruthy();
  });

  it("PrivacyPage shows its header and sections", () => {
    render(<PrivacyPage />);
    expect(screen.getByText("Wat Stadje opslaat")).toBeTruthy();
    expect(screen.getByText("Statistieken")).toBeTruthy();
  });

  it("TermsPage shows its header and sections", () => {
    render(<TermsPage />);
    expect(screen.getByText("Het spel")).toBeTruthy();
  });
});
