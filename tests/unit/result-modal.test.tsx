// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ResultModal, type ResultModalStats } from "@/components/ResultModal";

const STATS: ResultModalStats = {
  totalPlayed: 10,
  percentCorrect: 80,
  currentStreak: 3,
  averageGuesses: 3.5,
};

const REVEAL = {
  name: "Rotterdam",
  province: "Zuid-Holland",
  population: 609023,
  populationSource: "CBS",
  populationDate: "2026",
  imageSource: "https://example.com",
  wikipedia: "https://nl.wikipedia.org/wiki/Rotterdam",
};

function renderModal(
  overrides: Partial<Parameters<typeof ResultModal>[0]> = {},
) {
  const onClose = vi.fn();
  const utils = render(
    <ResultModal
      status="won"
      guessCount={2}
      reveal={REVEAL}
      stats={STATS}
      attemptsDistribution={{
        "1": 2,
        "2": 5,
        "3": 10,
        "4": 3,
        "5": 0,
        "6": 1,
        X: 4,
      }}
      onClose={onClose}
      {...overrides}
    />,
  );
  return { ...utils, onClose };
}

describe("ResultModal", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows the win headline and the revealed city", () => {
    renderModal({ status: "won", guessCount: 2 });
    expect(screen.getByText("GOED · 2 POGINGEN")).toBeTruthy();
    expect(screen.getByText("Rotterdam", { selector: "strong" })).toBeTruthy();
  });

  it("shows the loss headline", () => {
    renderModal({ status: "lost" });
    expect(screen.getByText("HELAAS · 6 POGINGEN OP")).toBeTruthy();
  });

  it("shows the same stats that used to live on the end screen", () => {
    const { container } = renderModal();
    const values = Array.from(
      container.querySelectorAll(".result-modal__stats dd"),
    ).map((el) => el.textContent);
    expect(values).toEqual(["10", "80%", "3", "3.5"]);
  });

  it("renders the attempts-distribution bar chart", () => {
    renderModal();
    expect(screen.getByText("Verdeling pogingen")).toBeTruthy();
    // "3" is the largest bucket (10) — its bar must fill the track, not sit empty.
    const label = screen.getByText("3", {
      selector: ".stats-page__distribution-label",
    });
    const bar = label
      .closest("li")
      ?.querySelector<HTMLElement>(".stats-page__distribution-bar");
    expect(bar?.style.width).toBe("100%");
  });

  it("closes via the close button", () => {
    const { container, onClose } = renderModal();
    const closeButton = container.querySelector(".modal-card__close");
    fireEvent.click(closeButton as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes when clicking the backdrop", () => {
    const { container, onClose } = renderModal();
    const backdrop = container.querySelector(".modal-backdrop");
    fireEvent.click(backdrop as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not close when clicking inside the modal content", () => {
    const { onClose } = renderModal();
    fireEvent.click(screen.getByText("Verdeling pogingen"));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("closes on Escape", () => {
    const { onClose } = renderModal();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
