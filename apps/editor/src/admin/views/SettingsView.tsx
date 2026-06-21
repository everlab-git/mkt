import { useState } from "react";
import { LocaleSwitcher } from "../../i18n/LocaleSwitcher";
import type { SiteLanguages } from "../../i18n/types";
import { useSiteTheme } from "../../theme/ThemeContext";

const settingsTabs = [
  { id: "general", label: "Aba Geral", description: "Nome do projeto, slug e objetivo principal." },
  { id: "appearance", label: "Aba Aparência", description: "Tokens visuais e identidade aplicada." },
  { id: "languages", label: "Aba Idiomas", description: "Idiomas ativos e idioma padrão do projeto." },
  { id: "menu", label: "Aba Menu", description: "Ordenação das entradas principais de navegação." },
  { id: "team", label: "Aba Equipe", description: "Membros, roles e convites pendentes." }
] as const;

export interface SettingsViewProps {
  siteLanguages: SiteLanguages;
  activeLocale: string;
  onChangeLocale: (locale: string) => void;
  onAddLanguage: (locale: string) => void;
  onSetDefaultLocale: (locale: string) => void;
}

export function SettingsView({
  siteLanguages,
  activeLocale,
  onChangeLocale,
  onAddLanguage,
  onSetDefaultLocale
}: SettingsViewProps) {
  const theme = useSiteTheme();
  const [activeTab, setActiveTab] = useState<(typeof settingsTabs)[number]["id"]>("general");
  const [draftLocale, setDraftLocale] = useState("");
  const currentTab = settingsTabs.find((tab) => tab.id === activeTab) ?? settingsTabs[0];

  return (
    <section
      aria-label="Configurações do projeto"
      style={{
        display: "grid",
        gap: 20,
        padding: 28,
        borderRadius: 32,
        background: `linear-gradient(180deg, color-mix(in srgb, ${theme.palette.background} 88%, #0b1220), ${theme.palette.background})`,
        border: `1px solid color-mix(in srgb, ${theme.palette.accent} 18%, transparent)`
      }}
    >
      <header style={{ display: "grid", gap: 8 }}>
        <h2 style={{ margin: 0, fontFamily: theme.typography.heading }}>Configurações</h2>
        <p style={{ margin: 0, lineHeight: 1.7, opacity: 0.78 }}>
          Shell administrativo simples com abas essenciais para o projeto.
        </p>
      </header>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {settingsTabs.map((tab) => {
          const isActive = tab.id === activeTab;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              aria-pressed={isActive}
              style={{
                minHeight: 42,
                padding: "0 14px",
                borderRadius: 999,
                border: `1px solid ${isActive ? theme.palette.accent : "rgba(255,255,255,0.16)"}`,
                background: isActive ? theme.palette.accent : "rgba(255,255,255,0.03)",
                color: isActive ? theme.palette.background : theme.palette.text,
                cursor: "pointer",
                font: "inherit",
                fontWeight: 700
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div
        style={{
          display: "grid",
          gap: 10,
          padding: 22,
          borderRadius: 24,
          background: "rgba(255,255,255,0.03)",
          border: `1px solid color-mix(in srgb, ${theme.palette.accent} 16%, transparent)`
        }}
      >
        <strong>{currentTab.label}</strong>
        <p style={{ margin: 0, lineHeight: 1.7, opacity: 0.78 }}>{currentTab.description}</p>
        {currentTab.id === "languages" ? (
          <div style={{ display: "grid", gap: 16 }}>
            <LocaleSwitcher
              activeLocale={activeLocale}
              languages={siteLanguages}
              onChange={onChangeLocale}
            />

            <label style={{ display: "grid", gap: 8 }}>
              <span style={{ fontWeight: 700 }}>Idioma padrão</span>
              <select
                aria-label="Idioma padrão"
                value={siteLanguages.default}
                onChange={(event) => onSetDefaultLocale(event.target.value)}
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
                {siteLanguages.enabled.map((locale) => (
                  <option key={locale} value={locale}>
                    {locale}
                  </option>
                ))}
              </select>
            </label>

            <div style={{ display: "grid", gap: 8 }}>
              <span style={{ fontWeight: 700 }}>Idiomas habilitados</span>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {siteLanguages.enabled.map((locale) => (
                  <span
                    key={locale}
                    style={{
                      display: "inline-flex",
                      minHeight: 34,
                      alignItems: "center",
                      padding: "0 12px",
                      borderRadius: 999,
                      border: `1px solid color-mix(in srgb, ${theme.palette.accent} 18%, transparent)`,
                      background:
                        locale === siteLanguages.default
                          ? "color-mix(in srgb, currentColor 10%, transparent)"
                          : "rgba(255,255,255,0.03)"
                    }}
                  >
                    {locale}
                  </span>
                ))}
              </div>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                const locale = draftLocale.trim();

                if (!locale) {
                  return;
                }

                onAddLanguage(locale);
                setDraftLocale("");
              }}
              style={{ display: "flex", gap: 10, flexWrap: "wrap" }}
            >
              <label style={{ display: "grid", gap: 8, flex: "1 1 220px" }}>
                <span style={{ fontWeight: 700 }}>Adicionar locale</span>
                <input
                  aria-label="Adicionar locale"
                  value={draftLocale}
                  onChange={(event) => setDraftLocale(event.target.value)}
                  placeholder="ex.: es"
                  style={{
                    minHeight: 44,
                    padding: "0 14px",
                    borderRadius: 16,
                    border: `1px solid color-mix(in srgb, ${theme.palette.accent} 22%, transparent)`,
                    background: "rgba(4, 10, 24, 0.56)",
                    color: theme.palette.text,
                    font: "inherit"
                  }}
                />
              </label>
              <button
                type="submit"
                style={{
                  minHeight: 44,
                  alignSelf: "end",
                  padding: "0 16px",
                  borderRadius: 999,
                  border: `1px solid ${theme.palette.accent}`,
                  background: theme.palette.accent,
                  color: theme.palette.background,
                  cursor: "pointer",
                  font: "inherit",
                  fontWeight: 700
                }}
              >
                Adicionar idioma
              </button>
            </form>
          </div>
        ) : null}
      </div>
    </section>
  );
}
