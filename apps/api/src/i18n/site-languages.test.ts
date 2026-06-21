import { describe, expect, it } from "vitest";
import { normalizeSiteLanguages } from "./site-languages";

describe("normalizeSiteLanguages", () => {
  it("site novo nasce só com locale padrão", () => {
    expect(normalizeSiteLanguages()).toEqual({
      default: "pt-BR",
      enabled: ["pt-BR"]
    });
  });

  it("garante que o locale padrão esteja em enabled", () => {
    expect(
      normalizeSiteLanguages({
        default: "en",
        enabled: ["pt-BR"]
      })
    ).toEqual({
      default: "en",
      enabled: ["en", "pt-BR"]
    });
  });
});
