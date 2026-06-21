import { describe, expect, it } from "vitest";
import { buildTranslationJob } from "./translation";

describe("translation job", () => {
  it("não traduz automaticamente ao habilitar locale", () => {
    expect(
      buildTranslationJob({
        enabledLocales: ["pt-BR", "en"],
        sourceLocale: "pt-BR",
        targetLocale: "en",
        triggeredByUser: false
      })
    ).toBeNull();
  });

  it("gera job explícito quando usuário pede tradução", () => {
    expect(
      buildTranslationJob({
        enabledLocales: ["pt-BR", "en"],
        sourceLocale: "pt-BR",
        targetLocale: "en",
        triggeredByUser: true
      })
    ).toEqual({
      sourceLocale: "pt-BR",
      targetLocale: "en"
    });
  });
});
