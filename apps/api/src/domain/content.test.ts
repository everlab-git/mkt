import { describe, expect, it } from "vitest";
import { collectBlockTypes, normalizePageContent, sanitizeRichText } from "./content";

describe("normalizePageContent", () => {
  it("mantém conteúdo novo com sections/blocks", () => {
    const content = normalizePageContent({
      sections: [
        {
          id: "s1",
          type: "hero",
          animationPreset: { name: "reveal", options: {} },
          props: {},
          blocks: [
            {
              id: "b1",
              type: "text",
              animationPreset: { name: "splitText", options: {} },
              persuasion: { pattern: "authority", options: {} },
              props: { content: "Olá", as: "h1" }
            }
          ]
        }
      ]
    });

    expect(content.sections).toHaveLength(1);
    expect(content.sections[0]?.blocks[0]?.type).toBe("text");
  });

  it("cria fallback aditivo para conteúdo legado sem blocks", () => {
    const content = normalizePageContent({
      headline: "Legado",
      body: "<b>Texto</b>"
    });

    expect(content.sections).toHaveLength(1);
    expect(content.sections[0]?.type).toBe("custom");
    expect(content.sections[0]?.blocks[0]?.type).toBe("text");
  });
});

describe("collectBlockTypes", () => {
  it("extrai tipos únicos dos blocos do conteúdo", () => {
    const blockTypes = collectBlockTypes({
      sections: [
        {
          id: "s1",
          type: "hero",
          animationPreset: { name: "reveal", options: {} },
          props: {},
          blocks: [
            { id: "b1", type: "text", props: {}, animationPreset: null, persuasion: null },
            { id: "b2", type: "image", props: {}, animationPreset: null, persuasion: null },
            { id: "b3", type: "text", props: {}, animationPreset: null, persuasion: null }
          ]
        }
      ]
    });

    expect(blockTypes).toEqual(["image", "text"]);
  });
});

describe("sanitizeRichText", () => {
  it("remove tags perigosas de texto livre", () => {
    expect(sanitizeRichText("<script>alert(1)</script><p>ok</p>")).toBe("<p>ok</p>");
  });
});

