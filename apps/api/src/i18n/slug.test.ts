import { describe, expect, it } from "vitest";
import { migrateSlugToLocales, normalizeLocalizedSlug } from "./slug";

describe("localized slug", () => {
  it("migra slug string para objeto por locale padrão", () => {
    expect(migrateSlugToLocales("servicos", "pt-BR")).toEqual({
      "pt-BR": "servicos"
    });
  });

  it("normaliza slug por locale preservando objeto existente", () => {
    expect(
      normalizeLocalizedSlug(
        { "pt-BR": "servicos", en: "services" },
        "pt-BR"
      )
    ).toEqual({
      "pt-BR": "servicos",
      en: "services"
    });
  });
});
