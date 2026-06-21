// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ThemeProvider } from "../../theme/ThemeContext";
import { CreatePageModal } from "./CreatePageModal";

describe("CreatePageModal", () => {
  afterEach(() => {
    cleanup();
  });

  it("permite escolher blank, template ou duplicate", () => {
    render(
      <ThemeProvider>
        <CreatePageModal open onClose={() => {}} />
      </ThemeProvider>
    );

    expect(screen.getByLabelText(/em branco/i)).toBeTruthy();
    expect(screen.getByLabelText(/^modelo$/i)).toBeTruthy();
    expect(screen.getByLabelText(/duplicar página existente/i)).toBeTruthy();
  });

  it("mostra a opção de seguir o modelo visual só em branco", () => {
    render(
      <ThemeProvider>
        <CreatePageModal open onClose={() => {}} />
      </ThemeProvider>
    );

    expect(screen.getByLabelText(/seguir o modelo visual/i)).toBeTruthy();

    fireEvent.click(screen.getByLabelText(/^modelo$/i));

    expect(screen.queryByLabelText(/seguir o modelo visual/i)).toBeNull();
  });
});
