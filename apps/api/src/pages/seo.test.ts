import { describe, expect, it } from "vitest";
import { canPublishPage, normalizeSeoPayload } from "./seo";

describe("page seo", () => {
  it("normaliza payload com trim e canonical de fallback", () => {
    expect(
      normalizeSeoPayload(
        {
          title: "  Página inicial  ",
          description: "  Hero e CTA  ",
          ogImage: "  https://cdn.example.com/og.png  ",
          canonical: "   "
        },
        "/home"
      )
    ).toEqual({
      title: "Página inicial",
      description: "Hero e CTA",
      ogImage: "https://cdn.example.com/og.png",
      canonical: "/home"
    });
  });

  it("permite salvar draft sem SEO preenchido", () => {
    expect(
      canPublishPage("draft", {
        title: "",
        description: ""
      })
    ).toEqual({ ok: true });
  });

  it("bloqueia publicação sem title e description", () => {
    expect(
      canPublishPage("published", {
        title: "",
        description: ""
      })
    ).toEqual({
      ok: false,
      message: "Preencha SEO title e SEO description antes de publicar."
    });
  });
});
