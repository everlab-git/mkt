// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { BuilderPage } from "../../builder/types";
import { ThemeProvider } from "../../theme/ThemeContext";
import { PagesView } from "./PagesView";

const pages: BuilderPage[] = [
  {
    id: "page-home",
    name: "Home",
    slug: "/",
    status: "published",
    followVisualModel: false,
    seo: {
      title: "Home",
      description: "Página inicial",
      ogImage: "",
      canonical: "/"
    },
    sections: [
      {
        id: "section-hero",
        type: "hero",
        animationPreset: null,
        props: {
          title: "Hero"
        },
        blocks: []
      }
    ]
  },
  {
    id: "page-cases",
    name: "Cases",
    slug: "/cases",
    status: "draft",
    followVisualModel: false,
    seo: {
      title: "",
      description: "",
      ogImage: "",
      canonical: "/cases"
    },
    sections: [
      {
        id: "section-cases",
        type: "cases",
        animationPreset: null,
        props: {
          title: "Cases"
        },
        blocks: []
      }
    ]
  }
];

describe("PagesView", () => {
  afterEach(() => {
    cleanup();
  });

  it("renderiza a árvore de páginas e permite abrir o builder", () => {
    const onOpenBuilder = vi.fn();
    const onCreatePage = vi.fn();

    render(
      <ThemeProvider>
        <PagesView
          pages={pages}
          activePageId="page-home"
          onOpenBuilder={onOpenBuilder}
          onCreatePage={onCreatePage}
        />
      </ThemeProvider>
    );

    expect(screen.getByRole("heading", { name: /árvore de páginas/i })).toBeTruthy();

    fireEvent.click(screen.getAllByRole("button", { name: /abrir builder/i })[1]!);

    expect(onOpenBuilder).toHaveBeenCalledWith("page-cases");
  });

  it("abre o modal de nova página e envia o fluxo mínimo local", () => {
    const onCreatePage = vi.fn();

    render(
      <ThemeProvider>
        <PagesView
          pages={pages}
          activePageId="page-home"
          onOpenBuilder={() => {}}
          onCreatePage={onCreatePage}
        />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: /new page/i }));

    expect(screen.getByRole("heading", { name: /criar página/i })).toBeTruthy();

    fireEvent.change(screen.getByLabelText(/nome da página/i), {
      target: { value: "Contato" }
    });
    fireEvent.click(screen.getByLabelText(/seguir o modelo visual/i));
    fireEvent.click(screen.getByRole("button", { name: /criar página/i }));

    expect(onCreatePage).toHaveBeenCalledWith({
      name: "Contato",
      strategy: "blank",
      templateKey: null,
      sourcePageId: null,
      followVisualModel: true
    });
  });
});
