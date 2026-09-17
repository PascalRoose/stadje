// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PuzzlePlayer } from "@/components/PuzzlePlayer";

// next/image needs the full Next.js runtime (image optimization config, request context) that
// isn't present under a plain jsdom test — swap it for a bare <img> so PuzzlePlayer can render.
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

const PUZZLE_RESPONSE = {
  date: "2026-09-17",
  imageUrl: "/puzzle.jpg",
  imageCredit: { owner: "Test", license: "CC0" },
};

describe("PuzzlePlayer — consent must never gate gameplay (US2, spec.md)", () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    vi.unstubAllGlobals();
  });

  it("leaves the guess input enabled for a first-time visitor who hasn't decided on consent yet", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(PUZZLE_RESPONSE),
      }),
    );

    render(<PuzzlePlayer />);

    const input = (await screen.findByLabelText(
      "Typ een stad",
    )) as HTMLInputElement;
    expect(input.disabled).toBe(false);

    // The consent banner itself is still shown (US2's notice), but purely as informational
    // chrome — it must not block play (see components/ConsentBanner.tsx's non-blocking scrim).
    await waitFor(() => {
      expect(
        screen.getByRole("dialog", { name: "Cookies en statistieken" }),
      ).toBeTruthy();
    });
    expect(input.disabled).toBe(false);
  });

  it("recording a consent decision dismisses the banner and leaves the input enabled", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(PUZZLE_RESPONSE),
      }),
    );

    render(<PuzzlePlayer />);
    await screen.findByLabelText("Typ een stad");

    fireEvent.click(screen.getByRole("button", { name: "Accepteren" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
    const input = (await screen.findByLabelText(
      "Typ een stad",
    )) as HTMLInputElement;
    expect(input.disabled).toBe(false);
    expect(
      JSON.parse(window.localStorage.getItem("stadje:v1") ?? "{}").consent
        .analyticsOptIn,
    ).toBe(true);
  });
});
