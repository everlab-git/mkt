import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { useSiteTheme } from "../../theme/ThemeContext";

type PageCreationStrategy = "blank" | "template" | "duplicate";

interface TemplateOption {
  value: string;
  label: string;
}

interface SourcePageOption {
  value: string;
  label: string;
}

export interface CreatePageModalSubmitPayload {
  name: string;
  strategy: PageCreationStrategy;
  templateKey: string | null;
  sourcePageId: string | null;
  followVisualModel: boolean;
}

export interface CreatePageModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit?: (payload: CreatePageModalSubmitPayload) => void;
  templateOptions?: TemplateOption[];
  sourcePageOptions?: SourcePageOption[];
}

const defaultTemplateOptions: TemplateOption[] = [
  { value: "institutional", label: "Institucional" },
  { value: "services", label: "Serviços" },
  { value: "cases", label: "Cases" },
  { value: "contact", label: "Contato" }
];

const defaultSourcePageOptions: SourcePageOption[] = [
  { value: "home", label: "Home" },
  { value: "sobre", label: "Sobre" }
];

function StrategyCard({
  id,
  name,
  title,
  description,
  checked,
  onChange,
  accent
}: {
  id: string;
  name: string;
  title: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  accent: string;
}) {
  return (
    <label
      htmlFor={id}
      style={{
        display: "grid",
        gap: 10,
        padding: 18,
        borderRadius: 24,
        background: checked ? "rgba(124,58,237,0.12)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${checked ? accent : "rgba(255,255,255,0.1)"}`,
        cursor: "pointer"
      }}
    >
      <input
        id={id}
        type="radio"
        name={name}
        aria-label={title}
        checked={checked}
        onChange={onChange}
      />
      <span style={{ fontWeight: 700 }}>{title}</span>
      <span style={{ opacity: 0.78, lineHeight: 1.6 }}>{description}</span>
    </label>
  );
}

export function CreatePageModal({
  open,
  onClose,
  onSubmit,
  templateOptions = defaultTemplateOptions,
  sourcePageOptions = defaultSourcePageOptions
}: CreatePageModalProps) {
  const theme = useSiteTheme();
  const [name, setName] = useState("");
  const [strategy, setStrategy] = useState<PageCreationStrategy>("blank");
  const [templateKey, setTemplateKey] = useState<string>(templateOptions[0]?.value ?? "");
  const [sourcePageId, setSourcePageId] = useState<string>(sourcePageOptions[0]?.value ?? "");
  const [followVisualModel, setFollowVisualModel] = useState(false);

  const inputStyle = useMemo<CSSProperties>(
    () => ({
      width: "100%",
      minHeight: 48,
      padding: "12px 14px",
      borderRadius: 16,
      border: `1px solid color-mix(in srgb, ${theme.palette.accent} 22%, transparent)`,
      background: "rgba(4, 10, 24, 0.56)",
      color: theme.palette.text,
      font: "inherit"
    }),
    [theme]
  );

  if (!open) {
    return null;
  }

  const handleSubmit = () => {
    onSubmit?.({
      name: name.trim(),
      strategy,
      templateKey: strategy === "template" ? templateKey || null : null,
      sourcePageId: strategy === "duplicate" ? sourcePageId || null : null,
      followVisualModel: strategy === "blank" ? followVisualModel : false
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-page-modal-title"
      style={{
        position: "fixed",
        inset: 0,
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "rgba(2, 6, 23, 0.72)"
      }}
    >
      <section
        style={{
          width: "min(720px, 100%)",
          display: "grid",
          gap: 22,
          padding: 28,
          borderRadius: 32,
          background: `linear-gradient(180deg, color-mix(in srgb, ${theme.palette.background} 90%, #0b1220), ${theme.palette.background})`,
          border: `1px solid color-mix(in srgb, ${theme.palette.accent} 18%, transparent)`,
          color: theme.palette.text,
          fontFamily: theme.typography.body,
          boxShadow: "0 24px 80px rgba(15, 23, 42, 0.35)"
        }}
      >
        <header style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "start" }}>
          <div style={{ display: "grid", gap: 8 }}>
            <span
              style={{
                display: "inline-flex",
                width: "fit-content",
                padding: "6px 12px",
                borderRadius: 999,
                border: `1px solid color-mix(in srgb, ${theme.palette.accent} 26%, transparent)`,
                fontSize: 12,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                opacity: 0.82
              }}
            >
              Pages · local
            </span>
            <h2
              id="create-page-modal-title"
              style={{ margin: 0, fontFamily: theme.typography.heading, fontSize: "1.8rem" }}
            >
              Criar página
            </h2>
            <p style={{ margin: 0, lineHeight: 1.7, opacity: 0.76 }}>
              Fluxo local e controlado para validar blank, template e duplicação antes da integração
              com o App.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal"
            style={{
              minHeight: 40,
              minWidth: 40,
              borderRadius: 999,
              border: `1px solid color-mix(in srgb, ${theme.palette.accent} 18%, transparent)`,
              background: "rgba(255,255,255,0.04)",
              color: theme.palette.text,
              cursor: "pointer",
              font: "inherit"
            }}
          >
            ×
          </button>
        </header>

        <div style={{ display: "grid", gap: 8 }}>
          <label htmlFor="create-page-name" style={{ fontWeight: 700 }}>
            Nome da página
          </label>
          <input
            id="create-page-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ex.: Contato"
            style={inputStyle}
          />
        </div>

        <fieldset style={{ margin: 0, padding: 0, border: 0, display: "grid", gap: 14 }}>
          <legend style={{ padding: 0, marginBottom: 2, fontWeight: 700 }}>Estratégia inicial</legend>
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
            <StrategyCard
              id="create-page-strategy-blank"
              name="create-page-strategy"
              title="Em branco"
              description="Comece sem seções e monte a estrutura do zero."
              checked={strategy === "blank"}
              onChange={() => setStrategy("blank")}
              accent={theme.palette.accent}
            />
            <StrategyCard
              id="create-page-strategy-template"
              name="create-page-strategy"
              title="Modelo"
              description="Parta de um template base para acelerar a nova página."
              checked={strategy === "template"}
              onChange={() => setStrategy("template")}
              accent={theme.palette.accent}
            />
            <StrategyCard
              id="create-page-strategy-duplicate"
              name="create-page-strategy"
              title="Duplicar página existente"
              description="Reaproveite estrutura e conteúdo a partir de uma página já criada."
              checked={strategy === "duplicate"}
              onChange={() => setStrategy("duplicate")}
              accent={theme.palette.accent}
            />
          </div>
        </fieldset>

        {strategy === "template" ? (
          <div style={{ display: "grid", gap: 8 }}>
            <label htmlFor="create-page-template" style={{ fontWeight: 700 }}>
              Template base
            </label>
            <select
              id="create-page-template"
              value={templateKey}
              onChange={(event) => setTemplateKey(event.target.value)}
              style={inputStyle}
            >
              {templateOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {strategy === "duplicate" ? (
          <div style={{ display: "grid", gap: 8 }}>
            <label htmlFor="create-page-source" style={{ fontWeight: 700 }}>
              Página-fonte
            </label>
            <select
              id="create-page-source"
              value={sourcePageId}
              onChange={(event) => setSourcePageId(event.target.value)}
              style={inputStyle}
            >
              {sourcePageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {strategy === "blank" ? (
          <label
            htmlFor="create-page-follow-visual-model"
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              padding: "14px 16px",
              borderRadius: 20,
              background: "rgba(20,184,166,0.08)",
              border: `1px solid color-mix(in srgb, ${theme.palette.accent} 24%, transparent)`
            }}
          >
            <input
              id="create-page-follow-visual-model"
              type="checkbox"
              checked={followVisualModel}
              onChange={(event) => setFollowVisualModel(event.target.checked)}
            />
            <span>Seguir o modelo visual</span>
          </label>
        ) : null}

        <footer style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              minHeight: 46,
              padding: "0 16px",
              borderRadius: 999,
              border: `1px solid color-mix(in srgb, ${theme.palette.accent} 18%, transparent)`,
              background: "transparent",
              color: theme.palette.text,
              cursor: "pointer",
              font: "inherit"
            }}
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSubmit}
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
            Criar página
          </button>
        </footer>
      </section>
    </div>
  );
}
