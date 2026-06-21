import { describe, expect, it } from "vitest";
import { blockRegistry, hasBlockRenderer } from "./registry";

describe("blockRegistry", () => {
  it("expõe os nove tipos de bloco desta rodada", () => {
    expect(Object.keys(blockRegistry).sort()).toEqual([
      "button",
      "card",
      "chart",
      "form",
      "gallery",
      "image",
      "table",
      "text",
      "video"
    ]);
  });

  it("resolve gallery como tipo suportado", () => {
    expect(hasBlockRenderer("gallery")).toBe(true);
    expect(hasBlockRenderer("unknown")).toBe(false);
  });
});
