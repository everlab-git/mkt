import { describe, expect, it } from "vitest";
import { initialBuilderState } from "./initial";
import { builderReducer } from "./reducer";

describe("builderReducer", () => {
  it("expõe view, selectedSectionId e selectedBlockId no estado inicial", () => {
    expect(initialBuilderState.view).toBe("pages");
    expect(initialBuilderState.activePageId).toBe("page-home");
    expect(initialBuilderState.publishValidationMessage).toBeNull();
    expect(initialBuilderState.selectedSectionId).toBe("section-hero");
    expect(initialBuilderState.selectedBlockId).toBe("block-hero-heading");
  });

  it("cria uma nova página em branco e a torna a página ativa", () => {
    const next = builderReducer(initialBuilderState, {
      type: "CREATE_PAGE",
      page: {
        name: "Contato",
        strategy: "blank",
        templateKey: null,
        sourcePageId: null,
        followVisualModel: true
      }
    });

    const page = next.pages.find((item) => item.slug === "/contato");

    expect(page).toMatchObject({
      name: "Contato",
      status: "draft",
      followVisualModel: true
    });
    expect(next.activePageId).toBe(page?.id);
    expect(next.sections).toEqual([]);
    expect(next.selectedSectionId).toBeNull();
  });

  it("bloqueia publish sem SEO mínimo e guarda a mensagem inline", () => {
    const next = builderReducer(initialBuilderState, {
      type: "PUBLISH_PAGE",
      pageId: "page-home"
    });

    expect(next.pages.find((item) => item.id === "page-home")?.status).toBe("draft");
    expect(next.publishValidationMessage).toBe(
      "Preencha SEO title e SEO description antes de publicar."
    );
  });

  it("publica a página quando seo.title e seo.description estão preenchidos", () => {
    const withSeo = builderReducer(initialBuilderState, {
      type: "UPDATE_PAGE_SEO",
      pageId: "page-home",
      seo: {
        title: "Home",
        description: "Página inicial pronta para publicação"
      }
    });

    const next = builderReducer(withSeo, {
      type: "PUBLISH_PAGE",
      pageId: "page-home"
    });

    expect(next.pages.find((item) => item.id === "page-home")?.status).toBe("published");
    expect(next.publishValidationMessage).toBeNull();
  });

  it("adiciona um bloco gallery dentro da seção cases", () => {
    const state = builderReducer(initialBuilderState, {
      type: "ADD_BLOCK",
      sectionId: "section-cases",
      block: {
        type: "gallery",
        props: {
          layout: "grid",
          images: [{ url: "/demo/editorial-scene-960.svg", alt: "gallery item" }]
        }
      }
    });

    const section = state.sections.find((item) => item.id === "section-cases");
    expect(section?.blocks).toHaveLength(1);
    expect(section?.blocks[0]?.type).toBe("gallery");
    expect(state.selectedSectionId).toBe("section-cases");
    expect(state.selectedBlockId).toBe(section?.blocks[0]?.id);
  });

  it("seleciona um bloco específico e sincroniza a seção ativa", () => {
    const state = builderReducer(initialBuilderState, {
      type: "SELECT_BLOCK",
      sectionId: "section-hero",
      blockId: "block-hero-cta"
    });

    expect(state.selectedSectionId).toBe("section-hero");
    expect(state.selectedBlockId).toBe("block-hero-cta");
  });

  it("permite selecionar uma seção sem selecionar bloco", () => {
    const next = builderReducer(initialBuilderState, {
      type: "SELECT_SECTION",
      sectionId: "section-cases"
    });

    expect(next.selectedSectionId).toBe("section-cases");
    expect(next.selectedBlockId).toBeNull();
  });

  it("permite mudar a view do builder", () => {
    const next = builderReducer(initialBuilderState, {
      type: "SET_VIEW",
      view: "preview"
    });

    expect(next.view).toBe("preview");
  });

  it("reabre o builder preservando uma seleção utilizável", () => {
    const withoutSelection = builderReducer(
      {
        ...initialBuilderState,
        selectedSectionId: null,
        selectedBlockId: null
      },
      {
        type: "SET_VIEW",
        view: "builder"
      }
    );

    expect(withoutSelection.view).toBe("builder");
    expect(withoutSelection.selectedSectionId).toBe("section-hero");
    expect(withoutSelection.selectedBlockId).toBe("block-hero-heading");
  });

  it("adiciona uma seção vazia e seleciona a nova seção", () => {
    const next = builderReducer(initialBuilderState, {
      type: "ADD_SECTION",
      section: {
        id: "section-proof",
        type: "proof",
        props: {
          title: "Prova social"
        }
      }
    });

    const section = next.sections.find((item) => item.id === "section-proof");

    expect(section).toMatchObject({
      id: "section-proof",
      type: "proof",
      animationPreset: null,
      props: {
        title: "Prova social"
      },
      blocks: []
    });
    expect(next.selectedSectionId).toBe("section-proof");
    expect(next.selectedBlockId).toBeNull();
  });

  it("remove uma seção e limpa a seleção quando ela era a selecionada", () => {
    const selectedState = builderReducer(initialBuilderState, {
      type: "SELECT_SECTION",
      sectionId: "section-cases"
    });

    const next = builderReducer(selectedState, {
      type: "REMOVE_SECTION",
      sectionId: "section-cases"
    });

    expect(next.sections.map((section) => section.id)).toEqual(["section-hero"]);
    expect(next.selectedSectionId).toBeNull();
    expect(next.selectedBlockId).toBeNull();
  });

  it("atualiza props de um bloco sem perder os demais campos", () => {
    const state = builderReducer(initialBuilderState, {
      type: "UPDATE_BLOCK_PROPS",
      sectionId: "section-hero",
      blockId: "block-hero-cta",
      props: {
        label: "Quero uma demo",
        href: "/demo"
      }
    });

    const block = state.sections
      .find((section) => section.id === "section-hero")
      ?.blocks.find((item) => item.id === "block-hero-cta");

    expect(block?.type).toBe("button");
    expect(block?.props).toMatchObject({
      label: "Quero uma demo",
      href: "/demo"
    });
  });

  it("remove um bloco e limpa a seleção quando ele era o selecionado", () => {
    const selectedState = builderReducer(initialBuilderState, {
      type: "SELECT_BLOCK",
      sectionId: "section-hero",
      blockId: "block-hero-cta"
    });

    const state = builderReducer(selectedState, {
      type: "REMOVE_BLOCK",
      sectionId: "section-hero",
      blockId: "block-hero-cta"
    });

    const section = state.sections.find((item) => item.id === "section-hero");

    expect(section?.blocks.map((block) => block.id)).toEqual(["block-hero-heading"]);
    expect(state.selectedSectionId).toBe("section-hero");
    expect(state.selectedBlockId).toBeNull();
  });

  it("reordena blocos dentro da mesma seção", () => {
    const withFirstBlock = builderReducer(initialBuilderState, {
      type: "ADD_BLOCK",
      sectionId: "section-cases",
      block: {
        id: "block-case-gallery",
        type: "gallery",
        props: {
          layout: "grid",
          images: [{ url: "/demo/editorial-scene-960.svg", alt: "case gallery" }]
        }
      }
    });

    const withSecondBlock = builderReducer(withFirstBlock, {
      type: "ADD_BLOCK",
      sectionId: "section-cases",
      block: {
        id: "block-case-proof",
        type: "text",
        props: {
          content: "Resultados em destaque"
        }
      }
    });

    const state = builderReducer(withSecondBlock, {
      type: "REORDER_BLOCKS",
      sectionId: "section-cases",
      fromIndex: 1,
      toIndex: 0
    });

    const section = state.sections.find((item) => item.id === "section-cases");

    expect(section?.blocks.map((block) => block.id)).toEqual([
      "block-case-proof",
      "block-case-gallery"
    ]);
    expect(state.selectedSectionId).toBe("section-cases");
    expect(state.selectedBlockId).toBe("block-case-proof");
  });
});
