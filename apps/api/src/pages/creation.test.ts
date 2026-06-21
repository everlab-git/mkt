import { describe, expect, it } from "vitest";
import { buildPagePayload } from "./creation";

describe("buildPagePayload", () => {
  it("cria payload em branco sem seções", () => {
    const payload = buildPagePayload({
      strategy: "blank",
      name: "Contato",
      slug: "contato"
    });

    expect(payload).toEqual({
      content: { sections: [] },
      seo: {
        title: "",
        description: "",
        ogImage: "",
        canonical: "/contato"
      }
    });
  });

  it("duplica preservando conteúdo, seo e metadados aninhados sem mutar a origem", () => {
    const sourcePage = {
      content: {
        sections: [
          {
            id: "section-hero",
            type: "hero",
            animationPreset: { name: "reveal", options: { distance: 32 } },
            props: {
              title: "Cases"
            },
            blocks: [
              {
                id: "block-proof",
                type: "text",
                animationPreset: null,
                persuasion: { pattern: "authority", options: { badge: "Top 1" } },
                props: {
                  content: "Resultados reais"
                }
              }
            ]
          }
        ]
      },
      seo: {
        title: "Cases",
        description: "Desc",
        canonical: "/cases",
        ogImage: "https://cdn.example.com/cases-og.png"
      }
    };

    const payload = buildPagePayload({
      strategy: "duplicate",
      name: "Cases 2",
      slug: "cases-2",
      sourcePage
    });

    expect(payload.content).toEqual(sourcePage.content);
    expect(payload.seo).toEqual(sourcePage.seo);

    payload.content.sections[0]!.props.title = "Mudou";

    expect(sourcePage.content.sections[0]!.props.title).toBe("Cases");
  });

  it("cria template institucional mínimo reaproveitando starter existente", () => {
    const payload = buildPagePayload({
      strategy: "template",
      name: "Serviços",
      slug: "servicos",
      templateKey: "services"
    });

    expect(payload.content.sections).toEqual([
      {
        id: "services-hero",
        type: "hero",
        animationPreset: null,
        props: {
          title: "Serviços",
          description: "Liste os principais serviços ou entregas com descrições curtas."
        },
        blocks: []
      }
    ]);
    expect(payload.seo).toEqual({
      title: "",
      description: "",
      ogImage: "",
      canonical: "/servicos"
    });
  });
});
