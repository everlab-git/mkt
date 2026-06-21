import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import type { BuilderPage } from "../../builder/types";
import { useSiteTheme } from "../../theme/ThemeContext";
import {
  CreatePageModal,
  type CreatePageModalSubmitPayload
} from "./CreatePageModal";

export interface PagesViewProps {
  pages: BuilderPage[];
  activePageId: string | null;
  onOpenBuilder: (pageId: string) => void;
  onCreatePage: (payload: CreatePageModalSubmitPayload) => void;
}

export function PagesView({ pages, activePageId, onOpenBuilder, onCreatePage }: PagesViewProps) {
  const theme = useSiteTheme();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const itemStyle: CSSProperties = {
    display: "grid",
    gap: 10,
    padding: 18,
    borderRadius: 24,
    background: "rgba(255,255,255,0.03)",
    border: `1px solid color-mix(in srgb, ${theme.palette.accent} 16%, transparent)`
  };
  const sourcePageOptions = useMemo(
    () =>
      pages.map((page) => ({
        value: page.id,
        label: page.name
      })),
    [pages]
  );

  const handleCreatePage = (payload: CreatePageModalSubmitPayload) => {
    onCreatePage(payload);
    setIsCreateModalOpen(false);
  };

  return (
    <section
      aria-label="Gestão de páginas"
      style={{
        display: "grid",
        gap: 20,
        padding: 28,
        borderRadius: 32,
        background: `linear-gradient(180deg, color-mix(in srgb, ${theme.palette.background} 88%, #0b1220), ${theme.palette.background})`,
        border: `1px solid color-mix(in srgb, ${theme.palette.accent} 18%, transparent)`
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          alignItems: "center",
          flexWrap: "wrap"
        }}
      >
        <div style={{ display: "grid", gap: 8 }}>
          <h2 style={{ margin: 0, fontFamily: theme.typography.heading }}>Árvore de páginas</h2>
          <p style={{ margin: 0, lineHeight: 1.7, opacity: 0.78 }}>
            Draft/publicado por página, criação local com modal e abertura do builder ao clicar.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          style={{
            minHeight: 46,
            padding: "0 18px",
            borderRadius: 999,
            border: `1px solid ${theme.palette.accent}`,
            background: theme.palette.accent,
            color: theme.palette.background,
            cursor: "pointer",
            font: "inherit",
            fontWeight: 700
          }}
        >
          New page
        </button>
      </header>

      <div style={{ display: "grid", gap: 14 }}>
        {pages.map((page) => {
          const isSelected = page.id === activePageId;
          const statusLabel = page.status === "published" ? "Publicado" : "Draft";
          const hasSeoMinimum = page.seo.title.trim() && page.seo.description.trim();

          return (
            <article
              key={page.id}
              style={{
                ...itemStyle,
                borderColor: isSelected
                  ? theme.palette.accent
                  : `color-mix(in srgb, ${theme.palette.accent} 16%, transparent)`
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  alignItems: "center",
                  flexWrap: "wrap"
                }}
              >
                <div style={{ display: "grid", gap: 4 }}>
                  <strong>{page.name}</strong>
                  <span style={{ opacity: 0.72 }}>{page.slug}</span>
                </div>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    minHeight: 32,
                    padding: "0 12px",
                    borderRadius: 999,
                    background:
                      page.status === "published"
                        ? "rgba(20,184,166,0.14)"
                        : "rgba(255,255,255,0.06)"
                  }}
                >
                  {statusLabel}
                </span>
              </div>

              <p style={{ margin: 0, lineHeight: 1.6, opacity: 0.76 }}>
                {page.sections.length} seção(ões) · SEO mínimo {hasSeoMinimum ? "ok" : "pendente"}
              </p>

              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <span style={{ opacity: 0.74, lineHeight: 1.6 }}>
                  {isSelected ? "Página ativa no shell principal." : "Pronta para edição."}
                  {page.followVisualModel ? " Seguindo modelo visual." : ""}
                </span>
                <button
                  type="button"
                  onClick={() => onOpenBuilder(page.id)}
                  style={{
                    minHeight: 42,
                    padding: "0 16px",
                    borderRadius: 999,
                    border: `1px solid ${theme.palette.accent}`,
                    background: isSelected ? theme.palette.accent : "transparent",
                    color: isSelected ? theme.palette.background : theme.palette.text,
                    cursor: "pointer",
                    font: "inherit",
                    fontWeight: 700
                  }}
                >
                  Abrir builder
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <CreatePageModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreatePage}
        sourcePageOptions={sourcePageOptions}
      />
    </section>
  );
}
