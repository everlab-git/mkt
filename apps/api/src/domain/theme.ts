export type ThemeScale = "default" | "compact" | "spacious";
export type AllowedFont = "Inter" | "Manrope" | "IBM Plex Sans" | "DM Sans";

export interface SiteTheme {
  palette: {
    background: string;
    primary: string;
    accent: string;
    text: string;
  };
  typography: {
    heading: AllowedFont;
    body: AllowedFont;
  };
  spacing: {
    scale: ThemeScale;
  };
}

const HEX_COLOR_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const RGB_COLOR_RE =
  /^rgb\(\s*(?:[01]?\d?\d|2[0-4]\d|25[0-5])\s*,\s*(?:[01]?\d?\d|2[0-4]\d|25[0-5])\s*,\s*(?:[01]?\d?\d|2[0-4]\d|25[0-5])\s*\)$/;

const ALLOWED_FONTS: AllowedFont[] = ["Inter", "Manrope", "IBM Plex Sans", "DM Sans"];
const ALLOWED_SCALES: ThemeScale[] = ["default", "compact", "spacious"];

export const DEFAULT_SITE_THEME: SiteTheme = {
  palette: {
    background: "#030610",
    primary: "#0f172a",
    accent: "#d4a843",
    text: "#dde1f0"
  },
  typography: {
    heading: "Inter",
    body: "Inter"
  },
  spacing: {
    scale: "default"
  }
};

function isValidColor(value: unknown): value is string {
  return typeof value === "string" && (HEX_COLOR_RE.test(value) || RGB_COLOR_RE.test(value));
}

function sanitizeFont(value: unknown, fallback: AllowedFont): AllowedFont {
  return typeof value === "string" && ALLOWED_FONTS.includes(value as AllowedFont)
    ? (value as AllowedFont)
    : fallback;
}

function sanitizeScale(value: unknown): ThemeScale {
  return typeof value === "string" && ALLOWED_SCALES.includes(value as ThemeScale)
    ? (value as ThemeScale)
    : "default";
}

export function sanitizeTheme(input: unknown): SiteTheme {
  const value = (input ?? {}) as Partial<SiteTheme>;

  return {
    palette: {
      background: isValidColor(value.palette?.background)
        ? value.palette.background
        : DEFAULT_SITE_THEME.palette.background,
      primary: isValidColor(value.palette?.primary)
        ? value.palette.primary
        : DEFAULT_SITE_THEME.palette.primary,
      accent: isValidColor(value.palette?.accent)
        ? value.palette.accent
        : DEFAULT_SITE_THEME.palette.accent,
      text: isValidColor(value.palette?.text) ? value.palette.text : DEFAULT_SITE_THEME.palette.text
    },
    typography: {
      heading: sanitizeFont(value.typography?.heading, DEFAULT_SITE_THEME.typography.heading),
      body: sanitizeFont(value.typography?.body, DEFAULT_SITE_THEME.typography.body)
    },
    spacing: {
      scale: sanitizeScale(value.spacing?.scale)
    }
  };
}

