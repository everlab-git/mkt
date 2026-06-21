import type { CSSProperties } from "react";
import { useEffect, useMemo, useReducer, useState } from "react";
import type { CreatePageModalSubmitPayload } from "./admin/views/CreatePageModal";
import { PagesView } from "./admin/views/PagesView";
import { PreviewView } from "./admin/views/PreviewView";
import { SettingsView } from "./admin/views/SettingsView";
import { WizardView } from "./admin/views/WizardView";
import { setActiveLocale, setView } from "./builder/actions";
import { initialBuilderState } from "./builder/initial";
import type { BuilderPage, BuilderSection, BuilderView } from "./builder/types";
import { builderReducer } from "./builder/reducer";
import { LocaleSwitcher } from "./i18n/LocaleSwitcher";
import { getLenisInstance } from "./components/animations/lib/lenis";
import { SectionRenderer } from "./components/sections/SectionRenderer";
import { ThemeProvider, useSiteTheme } from "./theme/ThemeContext";

const shellStyle: CSSProperties = {
  minHeight: "100vh",
  background: "linear-gradient(180deg, #050816 0%, #07101f 100%)",
  fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
};

const adminViews: Array<{ id: BuilderView; label: string }> = [
  { id: "pages", label: "Pages" },
  { id: "settings", label: "Settings" },
  { id: "preview", label: "Preview" },
  { id: "builder", label: "Builder" }
];

function createGalleryBlock() {
  return {
    type: "gallery",
    props: {
      layout: "grid" as const,
      images: [{ url: "/demo/editorial-scene-960.svg", alt: "gallery item" }]
    }
  };
}

function BuilderPreview({ sections }: { sections: BuilderSection[] }) {
  useEffect(() => {
    void getLenisInstance();
  }, []);

  return (
    <div
      data-testid="builder-preview"
      data-preview-scroll="lenis"
      style={{
        display: "grid",
        gap: 12
      }}
    >
      {sections.map((section) => (
        <SectionRenderer key={section.id} section={section} />
      ))}
    </div>
  );
}

function BuilderCanvas({
  activePage,
  sections,
  publishValidationMessage,
  onPublishPage,
  onSeoChange,
  onAddGallery
}: {
  activePage: BuilderPage | null;
  sections: BuilderSection[];
  publishValidationMessage: string | null;
  onPublishPage: () => void;
  onSeoChange: (field: "title" | "description" | "canonical" | "ogImage", value: string) => void;
  onAddGallery: () => void;
}) {
  const theme = useSiteTheme();

  return (
    <section
      aria-label="Canvas do builder"
      style={{
        display: "grid",
        gap: 18,
        padding: 28,
        borderRadius: 32,
        background: `linear-gradient(180deg, color-mix(in srgb, ${theme.palette.background} 88%, #0b1220), ${theme.palette.background})`,
        border: `1px solid color-mix(in srgb, ${theme.palette.accent} 18%, transparent)`
      }}
    >
      <div
        style={{
          display: "grid",
          gap: 18,
          padding: 22,
          borderRadius: 24,
          background: "rgba(255,255,255,0.03)",
          border: `1px solid color-mix(in srgb, ${theme.palette.accent} 16%, transparent)`
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            alignItems: "start",
            flexWrap: "wrap"
          }}
        >
          <div style={{ display: "grid", gap: 8 }}>
            <h2 style={{ margin: 0, fontFamily: theme.typography.heading }}>SEO da página</h2>
            <p style={{ margin: 0, lineHeight: 1.7, opacity: 0.78 }}>
              O shell valida o publish localmente usando a mesma mensagem do backend.
            </p>
          </div>
          <div style={{ display: "grid", gap: 4, justifyItems: "end" }}>
            <strong>{activePage?.name ?? "Nenhuma página ativa"}</strong>
            <span style={{ opacity: 0.72 }}>
              {activePage ? `${activePage.slug} · ${activePage.status}` : "Selecione uma página"}
            </span>
          </div>
        </div>

        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
          <label style={{ display: "grid", gap: 8 }}>
            <span style={{ fontWeight: 700 }}>SEO title</span>
            <input
              value={activePage?.seo.title ?? ""}
              onChange={(event) => onSeoChange("title", event.target.value)}
              style={getSeoInputStyle(theme.palette.accent, theme.palette.text)}
            />
          </label>
          <label style={{ display: "grid", gap: 8 }}>
            <span style={{ fontWeight: 700 }}>SEO description</span>
            <input
              value={activePage?.seo.description ?? ""}
              onChange={(event) => onSeoChange("description", event.target.value)}
              style={getSeoInputStyle(theme.palette.accent, theme.palette.text)}
            />
          </label>
          <label style={{ display: "grid", gap: 8 }}>
            <span style={{ fontWeight: 700 }}>Canonical</span>
            <input
              value={activePage?.seo.canonical ?? ""}
              onChange={(event) => onSeoChange("canonical", event.target.value)}
              style={getSeoInputStyle(theme.palette.accent, theme.palette.text)}
            />
          </label>
          <label style={{ display: "grid", gap: 8 }}>
            <span style={{ fontWeight: 700 }}>OG image</span>
            <input
              value={activePage?.seo.ogImage ?? ""}
              onChange={(event) => onSeoChange("ogImage", event.target.value)}
              style={getSeoInputStyle(theme.palette.accent, theme.palette.text)}
            />
          </label>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          {publishValidationMessage ? (
            <p role="alert" style={{ margin: 0, color: "#fca5a5", lineHeight: 1.6 }}>
              {publishValidationMessage}
            </p>
          ) : (
            <span style={{ opacity: 0.72 }}>
              Preencha SEO mínimo antes de publicar a página ativa.
            </span>
          )}

          <button
            type="button"
            onClick={onPublishPage}
            style={{
              minHeight: 46,
              padding: "0 18px",
              borderRadius: 999,
              border: `1px solid ${theme.palette.accent}`,
              background: theme.palette.accent,
              color: theme.palette.background,
              cursor: "pointer",
              fontFamily: theme.typography.body,
              fontWeight: 700
            }}
          >
            Publicar página
          </button>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          alignItems: "center",
          flexWrap: "wrap"
        }}
      >
        <div style={{ display: "grid", gap: 8 }}>
          <h2 style={{ margin: 0, fontFamily: theme.typography.heading }}>Builder preview</h2>
          <p style={{ margin: 0, lineHeight: 1.7, opacity: 0.78 }}>
            O canvas usa o estado real do builder e renderiza as mesmas seções e blocos do output
            final.
          </p>
        </div>

        <button
          type="button"
          onClick={onAddGallery}
          style={{
            minHeight: 52,
            padding: "0 18px",
            border: `1px solid ${theme.palette.accent}`,
            borderRadius: 999,
            background: theme.palette.accent,
            color: theme.palette.background,
            cursor: "pointer",
            fontFamily: theme.typography.body,
            fontWeight: 700
          }}
        >
          Adicionar gallery
        </button>
      </div>

      <BuilderPreview sections={sections} />
    </section>
  );
}

function BuilderApp() {
  const theme = useSiteTheme();
  const [state, dispatch] = useReducer(builderReducer, initialBuilderState);
  const [isWizardVisible, setIsWizardVisible] = useState(false);
  const activePage = useMemo(
    () => state.pages.find((page) => page.id === state.activePageId) ?? null,
    [state.activePageId, state.pages]
  );
  const selectedSection = useMemo(
    () => state.sections.find((section) => section.id === state.selectedSectionId) ?? null,
    [state.sections, state.selectedSectionId]
  );

  const openBuilderForPage = (pageId: string) => {
    dispatch({
      type: "SET_ACTIVE_PAGE",
      pageId
    });
    dispatch(setView("builder"));
  };

  const handleCreatePage = (payload: CreatePageModalSubmitPayload) => {
    dispatch({
      type: "CREATE_PAGE",
      page: payload
    });
  };

  const renderCurrentView = () => {
    switch (state.view) {
      case "pages":
        return (
          <PagesView
            pages={state.pages}
            activePageId={state.activePageId}
            onOpenBuilder={openBuilderForPage}
            onCreatePage={handleCreatePage}
          />
        );
      case "settings":
        return (
          <SettingsView
            activeLocale={state.activeLocale}
            siteLanguages={state.siteLanguages}
            onChangeLocale={(locale) => dispatch(setActiveLocale(locale))}
            onAddLanguage={(locale) =>
              dispatch({
                type: "ADD_SITE_LANGUAGE",
                locale
              })
            }
            onSetDefaultLocale={(locale) =>
              dispatch({
                type: "SET_DEFAULT_LOCALE",
                locale
              })
            }
          />
        );
      case "preview":
        return <PreviewView sections={state.sections} />;
      case "builder":
      default:
        return (
          <BuilderCanvas
            activePage={activePage}
            sections={state.sections}
            publishValidationMessage={state.publishValidationMessage}
            onPublishPage={() => {
              if (!state.activePageId) {
                return;
              }

              dispatch({
                type: "PUBLISH_PAGE",
                pageId: state.activePageId
              });
            }}
            onSeoChange={(field, value) => {
              if (!state.activePageId) {
                return;
              }

              dispatch({
                type: "UPDATE_PAGE_SEO",
                pageId: state.activePageId,
                seo: {
                  [field]: value
                }
              });
            }}
            onAddGallery={() =>
              dispatch({
                type: "ADD_BLOCK",
                sectionId: "section-cases",
                block: createGalleryBlock()
              })
            }
          />
        );
    }
  };

  return (
    <main
      style={{
        ...shellStyle,
        color: theme.palette.text
      }}
    >
      <div
        style={{
          maxWidth: 1240,
          margin: "0 auto",
          padding: "32px 24px 64px",
          display: "grid",
          gridTemplateColumns: "320px minmax(0, 1fr)",
          gap: 24,
          alignItems: "start"
        }}
      >
        <aside
          style={{
            position: "sticky",
            top: 24,
            display: "grid",
            gap: 18,
            padding: 24,
            borderRadius: 28,
            background: `linear-gradient(180deg, color-mix(in srgb, ${theme.palette.primary} 84%, ${theme.palette.background}), ${theme.palette.background})`,
            border: `1px solid color-mix(in srgb, ${theme.palette.accent} 24%, transparent)`
          }}
        >
          <div style={{ display: "grid", gap: 10 }}>
            <span
              style={{
                display: "inline-flex",
                width: "fit-content",
                padding: "8px 12px",
                borderRadius: 999,
                border: `1px solid color-mix(in srgb, ${theme.palette.accent} 36%, transparent)`,
                fontFamily: theme.typography.body,
                fontSize: 12,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                opacity: 0.86
              }}
            >
              Prompt 3 · Builder
            </span>
            <h1
              style={{
                margin: 0,
                fontFamily: theme.typography.heading,
                fontSize: "clamp(2rem, 5vw, 3rem)",
                lineHeight: 0.98,
                letterSpacing: "-0.04em"
              }}
            >
              Admin shell
            </h1>
            <p
              style={{
                margin: 0,
                fontFamily: theme.typography.body,
                lineHeight: 1.7,
                opacity: 0.8
              }}
            >
              Navegue entre pages, settings, preview e builder sem perder o wizard de projeto de
              vista.
            </p>
          </div>

          <nav aria-label="Navegação administrativa" style={{ display: "grid", gap: 10 }}>
            {adminViews.map((item) => {
              const isActive = state.view === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => dispatch(setView(item.id))}
                  aria-pressed={isActive}
                  style={{
                    minHeight: 46,
                    padding: "0 16px",
                    borderRadius: 16,
                    border: `1px solid ${
                      isActive ? theme.palette.accent : "rgba(255,255,255,0.14)"
                    }`,
                    background: isActive ? theme.palette.accent : "rgba(255,255,255,0.04)",
                    color: isActive ? theme.palette.background : theme.palette.text,
                    cursor: "pointer",
                    fontFamily: theme.typography.body,
                    fontWeight: 700,
                    textAlign: "left"
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <LocaleSwitcher
            activeLocale={state.activeLocale}
            languages={state.siteLanguages}
            onChange={(locale) => dispatch(setActiveLocale(locale))}
          />

          <button
            type="button"
            onClick={() => setIsWizardVisible((current) => !current)}
            aria-expanded={isWizardVisible}
            style={{
              minHeight: 48,
              padding: "0 18px",
              border: `1px solid ${theme.palette.accent}`,
              borderRadius: 999,
              background: "transparent",
              color: theme.palette.text,
              cursor: "pointer",
              fontFamily: theme.typography.body,
              fontWeight: 700
            }}
          >
            {isWizardVisible ? "Fechar wizard do projeto" : "Abrir wizard do projeto"}
          </button>

          <dl
            style={{
              margin: 0,
              display: "grid",
              gap: 12
            }}
          >
            <div>
              <dt
                style={{
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  opacity: 0.64,
                  fontFamily: theme.typography.body
                }}
              >
                Página ativa
              </dt>
              <dd style={{ margin: "6px 0 0", fontFamily: theme.typography.body }}>
                {activePage ? `${activePage.name} · ${activePage.slug} · ${activePage.status}` : "nenhuma"}
              </dd>
            </div>
            <div>
              <dt
                style={{
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  opacity: 0.64,
                  fontFamily: theme.typography.body
                }}
              >
                Seção selecionada
              </dt>
              <dd style={{ margin: "6px 0 0", fontFamily: theme.typography.body }}>
                {selectedSection?.props.title?.toString() ?? state.selectedSectionId ?? "nenhuma"}
              </dd>
            </div>
            <div>
              <dt
                style={{
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  opacity: 0.64,
                  fontFamily: theme.typography.body
                }}
              >
                Bloco selecionado
              </dt>
              <dd style={{ margin: "6px 0 0", fontFamily: theme.typography.body }}>
                {state.selectedBlockId ?? "nenhum"}
              </dd>
            </div>
            <div>
              <dt
                style={{
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  opacity: 0.64,
                  fontFamily: theme.typography.body
                }}
              >
                View atual
              </dt>
              <dd style={{ margin: "6px 0 0", fontFamily: theme.typography.body }}>{state.view}</dd>
            </div>
            <div>
              <dt
                style={{
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  opacity: 0.64,
                  fontFamily: theme.typography.body
                }}
              >
                Locale ativo
              </dt>
              <dd style={{ margin: "6px 0 0", fontFamily: theme.typography.body }}>
                {state.activeLocale}
              </dd>
            </div>
          </dl>
        </aside>

        <div
          style={{
            display: "grid",
            gap: 18,
          }}
        >
          {isWizardVisible ? <WizardView /> : null}
          {renderCurrentView()}
        </div>
      </div>
    </main>
  );
}

function getSeoInputStyle(accent: string, text: string): CSSProperties {
  return {
    width: "100%",
    minHeight: 46,
    padding: "12px 14px",
    borderRadius: 16,
    border: `1px solid color-mix(in srgb, ${accent} 22%, transparent)`,
    background: "rgba(4, 10, 24, 0.56)",
    color: text,
    font: "inherit"
  };
}

export default function App() {
  return (
    <ThemeProvider>
      <BuilderApp />
    </ThemeProvider>
  );
}
