import { describe, expect, it } from "vitest";
import { animationRegistry, hasAnimationPreset } from "./registry";

describe("animationRegistry", () => {
  it("expõe os cinco presets do Prompt 2", () => {
    expect(Object.keys(animationRegistry).sort()).toEqual([
      "marquee",
      "parallax",
      "pinScrub",
      "reveal",
      "splitText"
    ]);
  });

  it("identifica corretamente se um preset existe", () => {
    expect(hasAnimationPreset("reveal")).toBe(true);
    expect(hasAnimationPreset("nao-existe")).toBe(false);
  });
});
