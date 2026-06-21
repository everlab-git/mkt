import { useMemo, useState } from "react";
import { useSiteTheme } from "../../theme/ThemeContext";
import type { PersuasionResult } from "../persuasion/registry";

interface FormField {
  name: string;
  label: string;
  type?: "text" | "email" | "tel" | "textarea";
  placeholder?: string;
  required?: boolean;
}

export interface FormBlockProps {
  fields: FormField[];
  submitLabel?: string;
  persuasion?: PersuasionResult | null;
}

export function FormBlock({
  fields,
  submitLabel = "Enviar",
  persuasion = null
}: FormBlockProps) {
  const theme = useSiteTheme();
  const progressive = Boolean(persuasion?.progressive);
  const [expanded, setExpanded] = useState(!progressive);
  const visibleFields = useMemo(
    () => (progressive && !expanded ? fields.slice(0, 2) : fields),
    [expanded, fields, progressive]
  );

  return (
    <form
      style={{
        display: "grid",
        gap: 16,
        padding: 24,
        borderRadius: 28,
        border: `1px solid color-mix(in srgb, ${theme.palette.accent} 34%, transparent)`,
        background: `linear-gradient(180deg, color-mix(in srgb, ${theme.palette.primary} 78%, ${theme.palette.background}), ${theme.palette.background})`
      }}
    >
      {visibleFields.map((field) => (
        <label
          key={field.name}
          style={{
            display: "grid",
            gap: 8,
            color: theme.palette.text,
            fontFamily: theme.typography.body
          }}
        >
          <span>{field.label}</span>
          {field.type === "textarea" ? (
            <textarea
              name={field.name}
              placeholder={field.placeholder}
              required={field.required}
              rows={4}
              style={fieldStyle(theme.palette.accent, theme.palette.background, theme.palette.text)}
            />
          ) : (
            <input
              type={field.type ?? "text"}
              name={field.name}
              placeholder={field.placeholder}
              required={field.required}
              style={fieldStyle(theme.palette.accent, theme.palette.background, theme.palette.text)}
            />
          )}
        </label>
      ))}

      {progressive && !expanded && fields.length > visibleFields.length ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          style={{
            justifySelf: "start",
            padding: 0,
            border: 0,
            background: "transparent",
            color: theme.palette.accent,
            fontFamily: theme.typography.body,
            cursor: "pointer"
          }}
        >
          Mostrar mais campos
        </button>
      ) : null}

      <div>
        <button
          type="submit"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            minHeight: 48,
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
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

function fieldStyle(accent: string, background: string, text: string) {
  return {
    width: "100%",
    minHeight: 48,
    padding: "12px 14px",
    borderRadius: 16,
    border: `1px solid color-mix(in srgb, ${accent} 26%, transparent)`,
    background: colorSurface(background),
    color: text,
    font: "inherit"
  };
}

function colorSurface(background: string) {
  return `color-mix(in srgb, ${background} 86%, white 4%)`;
}
