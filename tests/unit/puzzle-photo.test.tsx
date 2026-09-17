// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PuzzlePhoto } from "@/components/PuzzlePhoto";

// next/image needs the full Next.js runtime (image optimization config, request context) that
// isn't present under a plain jsdom test — swap it for a bare <img> so PuzzlePhoto can render.
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

const EXPAND_LABEL = "Bekijk foto op volledig scherm";

describe("PuzzlePhoto", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the thumbnail with its credit and an expand affordance, lightbox closed", () => {
    render(
      <PuzzlePhoto
        imageUrl="/photo.jpg"
        credit="Jan de Vries"
        alt="Test stad"
      />,
    );
    expect(screen.getByText("Foto: Jan de Vries")).toBeTruthy();
    expect(screen.getByRole("button", { name: EXPAND_LABEL })).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opens a full-screen lightbox (via a portal to the document body) when expanded", () => {
    render(
      <PuzzlePhoto
        imageUrl="/photo.jpg"
        credit="Jan de Vries"
        alt="Test stad"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: EXPAND_LABEL }));

    const dialog = screen.getByRole("dialog", { name: "Test stad" });
    expect(dialog).toBeTruthy();
    expect(dialog.parentElement).toBe(document.body);
  });

  it("toggles zoom on the photo without closing the lightbox", () => {
    render(
      <PuzzlePhoto
        imageUrl="/photo.jpg"
        credit="Jan de Vries"
        alt="Test stad"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: EXPAND_LABEL }));

    const zoomToggle = screen.getByRole("button", { name: "Zoom in" });
    fireEvent.click(zoomToggle);
    expect(screen.getByRole("button", { name: "Zoom uit" })).toBeTruthy();
    expect(screen.getByRole("dialog")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Zoom uit" }));
    expect(screen.getByRole("button", { name: "Zoom in" })).toBeTruthy();
  });

  it("closes via the close button and resets zoom for next time", () => {
    render(
      <PuzzlePhoto
        imageUrl="/photo.jpg"
        credit="Jan de Vries"
        alt="Test stad"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: EXPAND_LABEL }));
    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    fireEvent.click(screen.getByRole("button", { name: "Sluiten" }));

    expect(screen.queryByRole("dialog")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: EXPAND_LABEL }));
    expect(screen.getByRole("button", { name: "Zoom in" })).toBeTruthy();
  });

  it("closes when clicking the backdrop", () => {
    render(
      <PuzzlePhoto
        imageUrl="/photo.jpg"
        credit="Jan de Vries"
        alt="Test stad"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: EXPAND_LABEL }));
    fireEvent.click(screen.getByRole("dialog"));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("closes on Escape", () => {
    render(
      <PuzzlePhoto
        imageUrl="/photo.jpg"
        credit="Jan de Vries"
        alt="Test stad"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: EXPAND_LABEL }));
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
