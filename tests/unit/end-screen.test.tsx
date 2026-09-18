// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EndScreen } from "@/components/EndScreen";

// next/image needs the full Next.js runtime (image optimization config, request context) that
// isn't present under a plain jsdom test — swap it for a bare <img> so EndScreen can render.
vi.mock("next/image", () => ({
  default: ({
    fill: _fill,
    sizes: _sizes,
    ...rest
  }: {
    fill?: boolean;
    sizes?: string;
    src: string;
    alt: string;
    // biome-ignore lint/performance/noImgElement: test-only stand-in for next/image
    // biome-ignore lint/a11y/useAltText: alt is passed through via {...rest} from real props
  }) => <img {...rest} />,
}));

const GUESSES = [
  {
    cityId: "rotterdam",
    province: { match: true, tier: "green" as const },
    population: { direction: "equal" as const, tier: "green" as const },
    distance: { km: 0, direction: null, tier: "green" as const },
  },
];

function renderEndScreen(
  overrides: Partial<Parameters<typeof EndScreen>[0]> = {},
) {
  return render(
    <EndScreen
      date="2026-09-17"
      imageUrl="/photo.jpg"
      imageCredit={{ owner: "Jan de Vries", license: "CC0" }}
      status="won"
      guessCount={1}
      guesses={GUESSES}
      reveal={{
        name: "Rotterdam",
        province: "Zuid-Holland",
        population: 609023,
        populationSource: "CBS",
        populationDate: "2026",
        imageSource: "https://example.com",
        wikipedia: "https://nl.wikipedia.org/wiki/Rotterdam",
      }}
      {...overrides}
    />,
  );
}

describe("EndScreen", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("shows the win headline and the answer, but no 'lost' lead-in", () => {
    renderEndScreen({ status: "won", guessCount: 2 });
    expect(screen.getByText("GOED · 2 POGINGEN")).toBeTruthy();
    expect(screen.queryByText("Het stadje van vandaag was")).toBeNull();
    expect(screen.getByText("Rotterdam", { selector: "strong" })).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Bekijk op Wikipedia" }),
    ).toBeTruthy();
  });

  it("shows the loss headline and the 'lost' lead-in", () => {
    renderEndScreen({ status: "lost" });
    expect(screen.getByText("HELAAS · 6 POGINGEN OP")).toBeTruthy();
    expect(screen.getByText("Het stadje van vandaag was")).toBeTruthy();
  });

  it("shares via the Web Share API when available", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { share });

    renderEndScreen();
    fireEvent.click(screen.getByRole("button", { name: "Deel resultaat" }));

    await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
    expect(share.mock.calls[0][0].text).toContain("Stadje 2026-09-17");
  });

  it("falls back to the clipboard and shows a confirmation when Web Share is unavailable", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    renderEndScreen();
    fireEvent.click(screen.getByRole("button", { name: "Deel resultaat" }));

    expect(
      await screen.findByRole("button", { name: "Gekopieerd!" }),
    ).toBeTruthy();
    expect(writeText).toHaveBeenCalledTimes(1);
  });

  it("doesn't crash if the share sheet is cancelled", async () => {
    const share = vi
      .fn()
      .mockRejectedValue(new DOMException("cancelled", "AbortError"));
    vi.stubGlobal("navigator", { share });

    renderEndScreen();
    fireEvent.click(screen.getByRole("button", { name: "Deel resultaat" }));

    await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("button", { name: "Deel resultaat" })).toBeTruthy();
  });
});
