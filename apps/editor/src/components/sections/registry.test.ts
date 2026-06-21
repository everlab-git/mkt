import { describe, expect, it } from "vitest";
import { hasSectionRenderer, sectionRegistry } from "./registry";

describe("sectionRegistry", () => {
  it("expõe ao menos hero e cases para o builder atual", () => {
    expect(Object.keys(sectionRegistry).sort()).toEqual(["cases", "hero"]);
  });

  it("resolve hero como tipo suportado", () => {
    expect(hasSectionRenderer("hero")).toBe(true);
    expect(hasSectionRenderer("custom")).toBe(false);
  });
});
