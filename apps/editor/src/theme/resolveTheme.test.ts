import { describe, expect, it } from "vitest";
import { resolveSiteTheme } from "./resolveTheme";

describe("resolveSiteTheme", () => {
  it("usa fallback quando o site não tem theme", () => {
    const theme = resolveSiteTheme(undefined);

    expect(theme.palette.background).toBeTruthy();
    expect(theme.typography.heading).toBe("Inter");
    expect(theme.spacing.scale).toBe("default");
  });

  it("mescla theme parcial do site com fallback", () => {
    const theme = resolveSiteTheme({
      palette: {
        background: "#121212",
        primary: "#ffffff",
        accent: "#ff9900",
        text: "#f7f7f7"
      }
    });

    expect(theme.palette.accent).toBe("#ff9900");
    expect(theme.typography.body).toBe("Inter");
  });
});

