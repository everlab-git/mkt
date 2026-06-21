import { describe, expect, it } from "vitest";
import { DEFAULT_SITE_THEME } from "../domain/theme";
import { normalizeWizardPayload } from "./creation";

describe("normalizeWizardPayload", () => {
  it("mantém o passo 4 sem pré-seleção por padrão", () => {
    const payload = normalizeWizardPayload({
      name: "Kintsugi",
      goal: "institucional/branding"
    });

    expect(payload.startingPoint).toBeNull();
  });

  it("desliga IA por padrão", () => {
    const payload = normalizeWizardPayload({
      name: "Kintsugi",
      goal: "geração de leads"
    });

    expect(payload.ai.enabled).toBe(false);
  });

  it("normaliza os campos do wizard com defaults seguros", () => {
    const payload = normalizeWizardPayload({
      name: "  Kintsugi  ",
      goal: "  vendas  "
    });

    expect(payload).toEqual({
      name: "Kintsugi",
      goal: "vendas",
      logoUrl: null,
      theme: DEFAULT_SITE_THEME,
      startingPoint: null,
      ai: {
        enabled: false,
        storytelling: "",
        paletteFromLogo: true,
        draftInitialCopy: true
      }
    });
  });

  it("preserva escolhas explícitas do wizard", () => {
    const payload = normalizeWizardPayload({
      name: "Freya",
      goal: "outro",
      logoUrl: "https://cdn.example.com/logo.svg",
      theme: {
        palette: {
          background: "#ffffff",
          primary: "#111111",
          accent: "#ffaa00",
          text: "#222222"
        },
        typography: {
          heading: "Manrope",
          body: "IBM Plex Sans"
        },
        spacing: {
          scale: "compact"
        }
      },
      startingPoint: "institutional",
      ai: {
        enabled: true,
        storytelling: "Tom consultivo",
        paletteFromLogo: false,
        draftInitialCopy: false
      }
    });

    expect(payload).toEqual({
      name: "Freya",
      goal: "outro",
      logoUrl: "https://cdn.example.com/logo.svg",
      theme: {
        palette: {
          background: "#ffffff",
          primary: "#111111",
          accent: "#ffaa00",
          text: "#222222"
        },
        typography: {
          heading: "Manrope",
          body: "IBM Plex Sans"
        },
        spacing: {
          scale: "compact"
        }
      },
      startingPoint: "institutional",
      ai: {
        enabled: true,
        storytelling: "Tom consultivo",
        paletteFromLogo: false,
        draftInitialCopy: false
      }
    });
  });
});
