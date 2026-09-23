// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LogoMark } from "@/components/Logo";

afterEach(cleanup);

describe("LogoMark", () => {
  it("renders an svg at the requested size with brand-default colors", () => {
    const { container } = render(<LogoMark size={40} />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("width")).toBe("40");
    expect(svg?.getAttribute("height")).toBe("40");
    expect(container.querySelector('rect[fill="#A63F2E"]')).toBeTruthy();
    expect(container.querySelector('rect[fill="#2F6B4A"]')).toBeTruthy();
  });

  it("accepts custom colors", () => {
    const { container } = render(<LogoMark ink="#000000" accent="#ffffff" />);
    expect(container.querySelector('rect[fill="#000000"]')).toBeTruthy();
    expect(container.querySelector('rect[fill="#ffffff"]')).toBeTruthy();
  });
});
