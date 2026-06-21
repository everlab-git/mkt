import { describe, expect, it } from "vitest";
import { suggestVisualPattern } from "./visual-pattern";

describe("suggestVisualPattern", () => {
  it("retorna a sequência mais frequente entre páginas publicadas", () => {
    const suggestion = suggestVisualPattern([
      ["hero", "cards", "cta"],
      ["hero", "cards", "cta"],
      ["hero", "gallery"]
    ]);

    expect(suggestion).toEqual(["hero", "cards", "cta"]);
  });
});
