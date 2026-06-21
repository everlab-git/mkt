// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ThemeProvider } from "../../theme/ThemeContext";
import { SectionRenderer } from "./SectionRenderer";

describe("SectionRenderer", () => {
  it("renderiza os blocos da seção cases", () => {
    render(
      <ThemeProvider>
        <SectionRenderer
          section={{
            id: "section-cases",
            type: "cases",
            animationPreset: null,
            props: { title: "Cases" },
            blocks: [
              {
                id: "block-gallery",
                type: "gallery",
                animationPreset: null,
                persuasion: null,
                props: {
                  layout: "grid",
                  images: [{ url: "/demo/editorial-scene-960.svg", alt: "case image" }]
                }
              }
            ]
          }}
        />
      </ThemeProvider>
    );

    expect(screen.getByText("Cases")).toBeTruthy();
    expect(screen.getByAltText("case image")).toBeTruthy();
  });
});
