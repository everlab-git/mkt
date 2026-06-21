// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getLenisInstance } from "./components/animations/lib/lenis";
import App from "./App";

vi.mock("./components/animations/lib/lenis", () => ({
  getLenisInstance: vi.fn().mockResolvedValue({})
}));

describe("App", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("entra em pages por padrão quando já existe projeto selecionado", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", {
        name: /árvore de páginas/i
      })
    ).toBeTruthy();
    expect(screen.getByText("Cases")).toBeTruthy();
    expect(getLenisInstance).not.toHaveBeenCalled();
  });

  it("abre o fluxo de nova página no PagesView", () => {
    render(<App />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /new page/i
      })
    );

    expect(screen.getByRole("heading", { name: /criar página/i })).toBeTruthy();
  });

  it("navega entre pages, settings, preview e builder", () => {
    render(<App />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /^settings$/i
      })
    );

    expect(screen.getByRole("heading", { name: /configurações/i })).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", {
        name: /^preview$/i
      })
    );

    expect(screen.getByTestId("project-preview")).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", {
        name: /^builder$/i
      })
    );

    const builderPreview = screen.getByTestId("builder-preview");

    expect(builderPreview).toBeTruthy();
    expect(within(builderPreview).getByText("Builder persuasion")).toBeTruthy();
    expect(getLenisInstance).toHaveBeenCalledTimes(1);
  });

  it("adiciona um bloco gallery na seção cases e reflete no preview do builder", () => {
    render(<App />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /^builder$/i
      })
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /adicionar gallery/i
      })
    );

    const casesSection = screen.getByTestId("section-cases");

    expect(screen.getByTestId("builder-preview").getAttribute("data-preview-scroll")).toBe("lenis");
    expect(within(casesSection).getByAltText("gallery item")).toBeTruthy();
  });

  it("mostra erro claro ao tentar publicar sem seo mínimo", () => {
    render(<App />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /^builder$/i
      })
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /publicar página/i
      })
    );

    expect(screen.getByText(/preencha seo title e seo description antes de publicar/i)).toBeTruthy();
  });

  it("troca o locale ativo e reflete seo e preview do locale selecionado", () => {
    render(<App />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /^builder$/i
      })
    );

    expect(screen.getByText("Crie narrativas com persuasão modular.")).toBeTruthy();

    fireEvent.change(screen.getByLabelText(/idioma ativo/i), {
      target: { value: "en" }
    });

    expect(screen.getByDisplayValue("Home")).toBeTruthy();
    expect(screen.getByDisplayValue("Home page ready for launch")).toBeTruthy();
    expect(screen.getByText("Build modular persuasion stories.")).toBeTruthy();
    expect(screen.getAllByText(/\/en · draft/i).length).toBeGreaterThan(0);
  });

  it("mantém o wizard acessível sem substituir a navegação principal", () => {
    render(<App />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /abrir wizard do projeto/i
      })
    );

    expect(screen.getByTestId("project-wizard-view")).toBeTruthy();
    expect(screen.getByRole("button", { name: /^pages$/i })).toBeTruthy();
  });
});
