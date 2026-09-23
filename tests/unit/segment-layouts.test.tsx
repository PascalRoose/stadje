// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import AboutLayout from "@/app/about/layout";
import ArchiveLayout from "@/app/archive/layout";
import StatsLayout from "@/app/stats/layout";

afterEach(cleanup);

describe.each([
  ["AboutLayout", AboutLayout],
  ["ArchiveLayout", ArchiveLayout],
  ["StatsLayout", StatsLayout],
])("%s", (_name, Layout) => {
  it("renders its children unchanged", () => {
    render(
      <Layout>
        <p>child content</p>
      </Layout>,
    );
    expect(screen.getByText("child content")).toBeTruthy();
  });
});
