// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ThemeProvider } from "../../theme/ThemeContext";
import { BlockRenderer } from "./BlockRenderer";

describe("BlockRenderer", () => {
  it("renderiza um bloco gallery com as imagens configuradas", () => {
    render(
      <ThemeProvider>
        <BlockRenderer
          block={{
            id: "gallery-1",
            type: "gallery",
            animationPreset: null,
            persuasion: null,
            props: {
              layout: "grid",
              images: [
                { url: "/demo/editorial-scene-960.svg", alt: "demo gallery item" },
                { url: "/demo/editorial-scene-1600.svg", alt: "demo gallery item 2" }
              ]
            }
          }}
        />
      </ThemeProvider>
    );

    expect(screen.getByAltText("demo gallery item")).toBeTruthy();
    expect(screen.getByAltText("demo gallery item 2")).toBeTruthy();
    expect(screen.getByTestId("block-gallery")).toBeTruthy();
  });

  it("aplica o resultado de persuasão no container do bloco", () => {
    render(
      <ThemeProvider>
        <BlockRenderer
          block={{
            id: "card-1",
            type: "card",
            animationPreset: null,
            persuasion: {
              pattern: "anchoring",
              options: {
                recommended: true
              }
            },
            props: {
              title: "Plano recomendado",
              description: "Mais contexto para a oferta",
              href: "/planos/pro"
            }
          }}
        />
      </ThemeProvider>
    );

    expect(screen.getByTestId("block-card").getAttribute("data-highlighted")).toBe("true");
  });
});
