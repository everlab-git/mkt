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

export const FALLBACK_SITE_THEME: SiteTheme = {
  palette: {
    background: "#030610",
    primary: "#101828",
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

export function resolveSiteTheme(input?: Partial<SiteTheme>): SiteTheme {
  return {
    palette: {
      background: input?.palette?.background ?? FALLBACK_SITE_THEME.palette.background,
      primary: input?.palette?.primary ?? FALLBACK_SITE_THEME.palette.primary,
      accent: input?.palette?.accent ?? FALLBACK_SITE_THEME.palette.accent,
      text: input?.palette?.text ?? FALLBACK_SITE_THEME.palette.text
    },
    typography: {
      heading: input?.typography?.heading ?? FALLBACK_SITE_THEME.typography.heading,
      body: input?.typography?.body ?? FALLBACK_SITE_THEME.typography.body
    },
    spacing: {
      scale: input?.spacing?.scale ?? FALLBACK_SITE_THEME.spacing.scale
    }
  };
}

