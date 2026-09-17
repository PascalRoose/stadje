// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConsentBannerBoundary } from "@/components/ConsentBannerBoundary";

function Bomb(): never {
  throw new Error("simulated DOM-reconciliation crash");
}

describe("ConsentBannerBoundary", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders its children normally when nothing throws", () => {
    render(
      <ConsentBannerBoundary>
        <p>banner content</p>
      </ConsentBannerBoundary>,
    );
    expect(screen.getByText("banner content")).toBeTruthy();
  });

  it("swallows a render error instead of letting it crash the rest of the app", () => {
    // React logs the caught error to console.error — expected noise for this test, not a failure.
    vi.spyOn(console, "error").mockImplementation(() => {});

    const { container } = render(
      <ConsentBannerBoundary>
        <Bomb />
      </ConsentBannerBoundary>,
    );

    expect(container.innerHTML).toBe("");
  });
});
