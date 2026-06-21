import { describe, expect, it } from "vitest";
import { migrateContentToI18n, setLocaleContentReviewed } from "./content";

describe("content i18n", () => {
  it("migra texto monolíngue para i18n no locale padrão mantendo o bloco", () => {
    const content = migrateContentToI18n(
      {
        sections: [
          {
            id: "section-1",
            type: "hero",
            animationPreset: null,
            props: {},
            blocks: [
              {
                id: "block-1",
                type: "text",
                animationPreset: null,
                persuasion: null,
                props: { as: "h1", content: "Olá" }
              }
            ]
          }
        ]
      },
      "pt-BR"
    );

    expect(content).toEqual({
      sections: [
        {
          id: "section-1",
          type: "hero",
          animationPreset: null,
          props: {},
          blocks: [
            {
              id: "block-1",
              type: "text",
              animationPreset: null,
              persuasion: null,
              props: { as: "h1" },
              i18n: {
                "pt-BR": {
                  content: "Olá",
                  ai_generated: false
                }
              }
            }
          ]
        }
      ]
    });
  });

  it("ao editar manualmente remove ai_generated no locale", () => {
    expect(
      setLocaleContentReviewed({
        content: "Hello",
        ai_generated: true
      })
    ).toEqual({
      content: "Hello",
      ai_generated: false
    });
  });
});
