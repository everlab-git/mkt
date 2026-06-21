import { useSiteTheme } from "../theme/ThemeContext";
import type { SiteLanguages } from "./types";

export interface LocaleSwitcherProps {
  activeLocale: string;
  languages: SiteLanguages;
  onChange: (locale: string) => void;
}

export function LocaleSwitcher({ activeLocale, languages, onChange }: LocaleSwitcherProps) {
  const theme = useSiteTheme();

  return (
    <label style={{ display: "grid", gap: 8 }}>
      <span style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.7 }}>
        Idioma ativo
      </span>
      <select
        aria-label="Idioma ativo"
        value={activeLocale}
        onChange={(event) => onChange(event.target.value)}
        style={{
          minHeight: 44,
          padding: "0 14px",
          borderRadius: 16,
          border: `1px solid color-mix(in srgb, ${theme.palette.accent} 22%, transparent)`,
          background: "rgba(4, 10, 24, 0.56)",
          color: theme.palette.text,
          font: "inherit"
        }}
      >
        {languages.enabled.map((locale) => (
          <option key={locale} value={locale}>
            {locale}
          </option>
        ))}
      </select>
    </label>
  );
}
