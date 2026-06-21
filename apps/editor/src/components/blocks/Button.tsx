import { useSiteTheme } from "../../theme/ThemeContext";
import type { PersuasionResult } from "../persuasion/registry";

export interface ButtonBlockProps {
  label: string;
  href?: string;
  target?: "_self" | "_blank";
  variant?: "primary" | "secondary";
  persuasion?: PersuasionResult | null;
}

export function ButtonBlock({
  label,
  href = "#",
  target = "_self",
  variant = "primary",
  persuasion = null
}: ButtonBlockProps) {
  const theme = useSiteTheme();
  const isPrimary = variant === "primary" || persuasion?.highlighted;

  return (
    <a
      href={href}
      target={target}
      rel={target === "_blank" ? "noreferrer" : undefined}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        minHeight: 48,
        padding: "0 20px",
        borderRadius: 999,
        textDecoration: "none",
        fontFamily: theme.typography.body,
        fontWeight: 700,
        border: `1px solid ${theme.palette.accent}`,
        background: isPrimary ? theme.palette.accent : "transparent",
        color: isPrimary ? theme.palette.background : theme.palette.text,
        boxShadow: isPrimary
          ? `0 14px 30px color-mix(in srgb, ${theme.palette.accent} 28%, transparent)`
          : "none"
      }}
    >
      {label}
    </a>
  );
}
