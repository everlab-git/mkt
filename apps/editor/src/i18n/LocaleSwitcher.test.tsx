// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ThemeProvider } from "../theme/ThemeContext";
import { LocaleSwitcher } from "./LocaleSwitcher";

describe("LocaleSwitcher", () => {
  afterEach(() => {
    cleanup();
  });

  it("permite trocar o locale ativo", () => {
    const changes: string[] = [];

    render(
      <ThemeProvider>
        <LocaleSwitcher
          activeLocale="pt-BR"
          languages={{ default: "pt-BR", enabled: ["pt-BR", "en"] }}
          onChange={(locale) => changes.push(locale)}
        />
      </ThemeProvider>
    );

    fireEvent.change(screen.getByLabelText(/idioma ativo/i), {
      target: { value: "en" }
    });

    expect(changes).toEqual(["en"]);
  });
});
