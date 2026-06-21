import { describe, expect, it } from "vitest";
import { sanitizeTheme } from "./theme";

describe("sanitizeTheme", () => {
  it("aceita palette válida, tipografia permitida e spacing conhecido", () => {
    const result = sanitizeTheme({
      palette: {
        background: "#101010",
        primary: "rgb(12, 34, 56)",
        accent: "#ffaa00",
        text: "#f8f8f8"
      },
      typography: {
        heading: "Inter",
        body: "Manrope"
      },
      spacing: {
        scale: "compact"
      }
    });

    expect(result.palette.primary).toBe("rgb(12, 34, 56)");
    expect(result.typography.heading).toBe("Inter");
    expect(result.spacing.scale).toBe("compact");
  });

  it("derruba valores maliciosos e volta para fallback seguro", () => {
    const result = sanitizeTheme({
      palette: {
        background: "url(javascript:alert(1))",
        primary: "expression(alert(1))",
        accent: "#ffaa00",
        text: "#fff"
      },
      typography: {
        heading: "evil-font');background:red;/*",
        body: "Inter"
      },
      spacing: {
        scale: "gigante"
      }
    });

    expect(result.palette.background).not.toContain("javascript");
    expect(result.palette.primary).not.toContain("expression");
    expect(result.typography.heading).toBe("Inter");
    expect(result.spacing.scale).toBe("default");
  });
});

