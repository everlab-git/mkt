// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ThemeProvider } from "../../theme/ThemeContext";
import { WizardView } from "./WizardView";

describe("WizardView", () => {
  afterEach(() => {
    cleanup();
  });

  it("renderiza os quatro passos do wizard", () => {
    render(
      <ThemeProvider>
        <WizardView />
      </ThemeProvider>
    );

    const stepsSummary = screen.getByRole("list", { name: /resumo dos passos/i });
    const items = within(stepsSummary).getAllByRole("listitem");

    expect(items).toHaveLength(4);
  });

  it("mantém IA desligada por padrão e esconde as subopções", () => {
    render(
      <ThemeProvider>
        <WizardView />
      </ThemeProvider>
    );

    const aiToggle = screen.getByLabelText(/quer que a ia ajude/i) as HTMLInputElement;

    expect(aiToggle.checked).toBe(false);
    expect(screen.queryByLabelText(/storytelling/i)).toBeNull();
    expect(screen.queryByLabelText(/extrair paleta do logo/i)).toBeNull();
    expect(screen.queryByLabelText(/gerar copy inicial/i)).toBeNull();
  });

  it("mostra e ativa as subopções de IA apenas quando habilitado", () => {
    render(
      <ThemeProvider>
        <WizardView />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByLabelText(/quer que a ia ajude/i));

    const storytelling = screen.getByLabelText(/storytelling/i) as HTMLInputElement;
    const paletteFromLogo = screen.getByLabelText(/extrair paleta do logo/i) as HTMLInputElement;
    const draftInitialCopy = screen.getByLabelText(/gerar copy inicial/i) as HTMLInputElement;

    expect(storytelling.disabled).toBe(false);
    expect(paletteFromLogo.disabled).toBe(false);
    expect(draftInitialCopy.disabled).toBe(false);
  });

  it("não deixa ponto de partida pré-selecionado", () => {
    render(
      <ThemeProvider>
        <WizardView />
      </ThemeProvider>
    );

    expect((screen.getByLabelText(/em branco/i) as HTMLInputElement).checked).toBe(false);
    expect((screen.getByLabelText(/estrutura institucional/i) as HTMLInputElement).checked).toBe(
      false
    );
  });
});
