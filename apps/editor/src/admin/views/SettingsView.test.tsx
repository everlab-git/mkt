// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ThemeProvider } from "../../theme/ThemeContext";
import { SettingsView } from "./SettingsView";

describe("SettingsView", () => {
  afterEach(() => {
    cleanup();
  });

  it("torna a aba idiomas funcional", () => {
    const activeLocaleChanges: string[] = [];
    const defaultLocaleChanges: string[] = [];
    const addedLocales: string[] = [];

    render(
      <ThemeProvider>
        <SettingsView
          activeLocale="pt-BR"
          siteLanguages={{ default: "pt-BR", enabled: ["pt-BR", "en"] }}
          onChangeLocale={(locale) => activeLocaleChanges.push(locale)}
          onAddLanguage={(locale) => addedLocales.push(locale)}
          onSetDefaultLocale={(locale) => defaultLocaleChanges.push(locale)}
        />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: /aba idiomas/i }));

    fireEvent.change(screen.getByLabelText(/idioma ativo/i), {
      target: { value: "en" }
    });
    fireEvent.change(screen.getByLabelText(/idioma padrão/i), {
      target: { value: "en" }
    });
    fireEvent.change(screen.getByLabelText(/adicionar locale/i), {
      target: { value: "es" }
    });
    fireEvent.click(screen.getByRole("button", { name: /adicionar idioma/i }));

    expect(activeLocaleChanges).toEqual(["en"]);
    expect(defaultLocaleChanges).toEqual(["en"]);
    expect(addedLocales).toEqual(["es"]);
    expect(screen.getAllByText("pt-BR").length).toBeGreaterThan(0);
    expect(screen.getAllByText("en").length).toBeGreaterThan(0);
  });
});
