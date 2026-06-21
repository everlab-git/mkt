import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import type { ProjectAiOptions, ProjectGoal, ProjectStartingPoint } from "../types";
import { useSiteTheme } from "../../theme/ThemeContext";

const steps = [
  { id: 1, title: "Passo 1", description: "Nome do projeto e objetivo principal" },
  { id: 2, title: "Passo 2", description: "Apoio opcional de IA" },
  { id: 3, title: "Passo 3", description: "Logo de referência e direção visual" },
  { id: 4, title: "Passo 4", description: "Ponto de partida do projeto" }
] as const;

const goalOptions: ProjectGoal[] = [
  "geração de leads",
  "institucional/branding",
  "vendas",
  "outro"
];

const paletteSuggestions = ["#7C3AED", "#14B8A6", "#F97316", "#F4F4F5"];

const panelBaseStyle: CSSProperties = {
  display: "grid",
  gap: 16,
  padding: 24,
  borderRadius: 28
};

function StepHeader({
  index,
  title,
  description
}: {
  index: number;
  title: string;
  description: string;
}) {
  return (
    <header style={{ display: "grid", gap: 6 }}>
      <div
        style={{
          display: "inline-flex",
          width: "fit-content",
          minWidth: 44,
          justifyContent: "center",
          alignItems: "center",
          padding: "8px 14px",
          borderRadius: 999,
          background: "rgba(255,255,255,0.08)",
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase"
        }}
      >
        Passo {index}
      </div>
      <h2 style={{ margin: 0, fontSize: "1.25rem" }}>{title}</h2>
      <p style={{ margin: 0, lineHeight: 1.6, opacity: 0.78 }}>{description}</p>
    </header>
  );
}

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: string }) {
  return (
    <label htmlFor={htmlFor} style={{ display: "grid", gap: 8, fontWeight: 600 }}>
      <span>{children}</span>
    </label>
  );
}

export function WizardView() {
  const theme = useSiteTheme();
  const [projectName, setProjectName] = useState("");
  const [goal, setGoal] = useState<ProjectGoal>("geração de leads");
  const [logoUrl, setLogoUrl] = useState("");
  const [selectedColor, setSelectedColor] = useState(paletteSuggestions[0]);
  const [startingPoint, setStartingPoint] = useState<ProjectStartingPoint | null>(null);
  const [aiOptions, setAiOptions] = useState<ProjectAiOptions>({
    enabled: false,
    storytelling: "",
    paletteFromLogo: true,
    draftInitialCopy: true
  });

  const shellStyle = useMemo<CSSProperties>(
    () => ({
      display: "grid",
      gap: 24,
      padding: 32,
      borderRadius: 32,
      background: `linear-gradient(180deg, color-mix(in srgb, ${theme.palette.primary} 22%, ${theme.palette.background}), ${theme.palette.background})`,
      border: `1px solid color-mix(in srgb, ${theme.palette.accent} 20%, transparent)`,
      color: theme.palette.text,
      fontFamily: theme.typography.body
    }),
    [theme]
  );

  const inputStyle = useMemo<CSSProperties>(
    () => ({
      width: "100%",
      minHeight: 48,
      padding: "12px 14px",
      borderRadius: 16,
      border: `1px solid color-mix(in srgb, ${theme.palette.accent} 22%, transparent)`,
      background: "rgba(4, 10, 24, 0.48)",
      color: theme.palette.text,
      font: "inherit"
    }),
    [theme]
  );

  const toggleAi = () => {
    setAiOptions((current) => ({
      ...current,
      enabled: !current.enabled
    }));
  };

  return (
    <section
      aria-label="Wizard de criação de projeto"
      style={shellStyle}
      data-testid="project-wizard-view"
    >
      <header style={{ display: "grid", gap: 10 }}>
        <span
          style={{
            display: "inline-flex",
            width: "fit-content",
            padding: "8px 12px",
            borderRadius: 999,
            border: `1px solid color-mix(in srgb, ${theme.palette.accent} 28%, transparent)`,
            fontSize: 12,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            opacity: 0.86
          }}
        >
          Admin · Project wizard
        </span>
        <h1
          style={{
            margin: 0,
            fontFamily: theme.typography.heading,
            fontSize: "clamp(2rem, 4vw, 2.8rem)",
            lineHeight: 1
          }}
        >
          Monte um novo projeto em 4 passos
        </h1>
        <p style={{ margin: 0, lineHeight: 1.7, opacity: 0.78 }}>
          Implementação local e estática do fluxo inicial do admin, ainda sem integração com o App
          principal.
        </p>
      </header>

      <ol
        aria-label="Resumo dos passos"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
          margin: 0,
          padding: 0,
          listStyle: "none"
        }}
      >
        {steps.map((step) => (
          <li
            key={step.id}
            style={{
              ...panelBaseStyle,
              padding: 18,
              background: "rgba(255,255,255,0.03)",
              border: `1px solid color-mix(in srgb, ${theme.palette.accent} 16%, transparent)`
            }}
          >
            <strong>{step.title}</strong>
            <span style={{ lineHeight: 1.5, opacity: 0.78 }}>{step.description}</span>
          </li>
        ))}
      </ol>

      <div style={{ display: "grid", gap: 20 }}>
        <section
          style={{
            ...panelBaseStyle,
            background: "rgba(255,255,255,0.03)",
            border: `1px solid color-mix(in srgb, ${theme.palette.accent} 16%, transparent)`
          }}
        >
          <StepHeader
            index={1}
            title="Base do projeto"
            description="Defina um nome temporário e o objetivo que melhor descreve o projeto."
          />

          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
            <div style={{ display: "grid", gap: 8 }}>
              <FieldLabel htmlFor="wizard-project-name">Nome do projeto</FieldLabel>
              <input
                id="wizard-project-name"
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
                placeholder="Ex.: Kintsugi Studio"
                style={inputStyle}
              />
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <FieldLabel htmlFor="wizard-project-goal">Objetivo</FieldLabel>
              <select
                id="wizard-project-goal"
                value={goal}
                onChange={(event) => setGoal(event.target.value as ProjectGoal)}
                style={inputStyle}
              >
                {goalOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section
          style={{
            ...panelBaseStyle,
            background: "rgba(255,255,255,0.03)",
            border: `1px solid color-mix(in srgb, ${theme.palette.accent} 16%, transparent)`
          }}
        >
          <StepHeader
            index={2}
            title="IA opcional"
            description="A IA começa desligada. As subopções só aparecem quando você decide habilitar."
          />

          <label
            htmlFor="wizard-ai-enabled"
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              padding: "14px 16px",
              borderRadius: 18,
              background: "rgba(255,255,255,0.03)"
            }}
          >
            <input
              id="wizard-ai-enabled"
              type="checkbox"
              checked={aiOptions.enabled}
              onChange={toggleAi}
            />
            <span>Quer que a IA ajude?</span>
          </label>

          {aiOptions.enabled ? (
            <div
              style={{
                display: "grid",
                gap: 14,
                padding: 18,
                borderRadius: 22,
                background: "rgba(124, 58, 237, 0.08)",
                border: `1px solid color-mix(in srgb, ${theme.palette.primary} 28%, transparent)`
              }}
            >
              <div style={{ display: "grid", gap: 8 }}>
                <FieldLabel htmlFor="wizard-ai-storytelling">Storytelling</FieldLabel>
                <input
                  id="wizard-ai-storytelling"
                  value={aiOptions.storytelling}
                  onChange={(event) =>
                    setAiOptions((current) => ({
                      ...current,
                      storytelling: event.target.value
                    }))
                  }
                  placeholder="Ex.: sofisticado, direto e institucional"
                  style={inputStyle}
                />
              </div>

              <label
                htmlFor="wizard-ai-palette"
                style={{ display: "flex", gap: 12, alignItems: "center" }}
              >
                <input
                  id="wizard-ai-palette"
                  type="checkbox"
                  checked={aiOptions.paletteFromLogo}
                  onChange={(event) =>
                    setAiOptions((current) => ({
                      ...current,
                      paletteFromLogo: event.target.checked
                    }))
                  }
                />
                <span>Extrair paleta do logo</span>
              </label>

              <label
                htmlFor="wizard-ai-copy"
                style={{ display: "flex", gap: 12, alignItems: "center" }}
              >
                <input
                  id="wizard-ai-copy"
                  type="checkbox"
                  checked={aiOptions.draftInitialCopy}
                  onChange={(event) =>
                    setAiOptions((current) => ({
                      ...current,
                      draftInitialCopy: event.target.checked
                    }))
                  }
                />
                <span>Gerar copy inicial</span>
              </label>
            </div>
          ) : null}
        </section>

        <section
          style={{
            ...panelBaseStyle,
            background: "rgba(255,255,255,0.03)",
            border: `1px solid color-mix(in srgb, ${theme.palette.accent} 16%, transparent)`
          }}
        >
          <StepHeader
            index={3}
            title="Logo e identidade visual"
            description="Placeholder local para o upload de logo e para a definição rápida de cores."
          />

          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1.2fr 1fr" }}>
            <div
              aria-label="Área de upload do logo"
              style={{
                minHeight: 180,
                display: "grid",
                placeItems: "center",
                padding: 20,
                borderRadius: 24,
                border: `1px dashed color-mix(in srgb, ${theme.palette.accent} 30%, transparent)`,
                background:
                  "linear-gradient(135deg, rgba(124,58,237,0.16), rgba(20,184,166,0.08), rgba(255,255,255,0.02))",
                textAlign: "center"
              }}
            >
              <div style={{ display: "grid", gap: 8 }}>
                <strong>Upload/logo placeholder</strong>
                <span style={{ lineHeight: 1.6, opacity: 0.78 }}>
                  Arraste um arquivo futuramente ou informe uma URL de referência abaixo.
                </span>
              </div>
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ display: "grid", gap: 8 }}>
                <FieldLabel htmlFor="wizard-logo-url">URL do logo</FieldLabel>
                <input
                  id="wizard-logo-url"
                  value={logoUrl}
                  onChange={(event) => setLogoUrl(event.target.value)}
                  placeholder="https://exemplo.com/logo.svg"
                  style={inputStyle}
                />
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                <span style={{ fontWeight: 600 }}>Cores sugeridas</span>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {paletteSuggestions.map((color) => {
                    const isSelected = selectedColor === color;

                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        aria-pressed={isSelected}
                        aria-label={`Selecionar cor ${color}`}
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: 16,
                          border: isSelected
                            ? `2px solid ${theme.palette.text}`
                            : "1px solid rgba(255,255,255,0.12)",
                          background: color,
                          cursor: "pointer"
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          style={{
            ...panelBaseStyle,
            background: "rgba(255,255,255,0.03)",
            border: `1px solid color-mix(in srgb, ${theme.palette.accent} 16%, transparent)`
          }}
        >
          <StepHeader
            index={4}
            title="Escolha como começar"
            description="As opções começam sem pré-seleção para não induzir uma decisão automática."
          />

          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
            <label
              htmlFor="wizard-starting-point-blank"
              style={{
                display: "grid",
                gap: 12,
                padding: 18,
                borderRadius: 24,
                background:
                  startingPoint === "blank" ? "rgba(20,184,166,0.12)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${
                  startingPoint === "blank"
                    ? theme.palette.accent
                    : "color-mix(in srgb, rgba(255,255,255,0.24) 80%, transparent)"
                }`
              }}
            >
              <input
                id="wizard-starting-point-blank"
                type="radio"
                name="wizard-starting-point"
                checked={startingPoint === "blank"}
                onChange={() => setStartingPoint("blank")}
              />
              <span style={{ fontWeight: 700 }}>Em branco</span>
              <span style={{ lineHeight: 1.6, opacity: 0.78 }}>
                Comece com uma estrutura vazia para montar tudo manualmente depois.
              </span>
            </label>

            <label
              htmlFor="wizard-starting-point-institutional"
              style={{
                display: "grid",
                gap: 12,
                padding: 18,
                borderRadius: 24,
                background:
                  startingPoint === "institutional"
                    ? "rgba(124,58,237,0.14)"
                    : "rgba(255,255,255,0.02)",
                border: `1px solid ${
                  startingPoint === "institutional"
                    ? theme.palette.primary
                    : "color-mix(in srgb, rgba(255,255,255,0.24) 80%, transparent)"
                }`
              }}
            >
              <input
                id="wizard-starting-point-institutional"
                type="radio"
                name="wizard-starting-point"
                checked={startingPoint === "institutional"}
                onChange={() => setStartingPoint("institutional")}
              />
              <span style={{ fontWeight: 700 }}>Estrutura institucional</span>
              <span style={{ lineHeight: 1.6, opacity: 0.78 }}>
                Parte de uma estrutura inicial com páginas institucionais para acelerar o setup.
              </span>
            </label>
          </div>
        </section>
      </div>

      <footer
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          alignItems: "center",
          paddingTop: 8
        }}
      >
        <div style={{ display: "grid", gap: 4 }}>
          <strong>Resumo local</strong>
          <span style={{ opacity: 0.78 }}>
            {projectName || "Projeto sem nome"} · {goal} ·{" "}
            {startingPoint === null ? "sem ponto de partida" : startingPoint}
          </span>
        </div>

        <button
          type="button"
          style={{
            minHeight: 52,
            padding: "0 20px",
            borderRadius: 999,
            border: `1px solid ${theme.palette.accent}`,
            background: theme.palette.accent,
            color: theme.palette.background,
            fontFamily: theme.typography.body,
            fontWeight: 700,
            cursor: "pointer"
          }}
        >
          Criar projeto
        </button>
      </footer>
    </section>
  );
}
