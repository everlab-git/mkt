import type { CSSProperties } from "react";
import { useSiteTheme } from "../../theme/ThemeContext";
import type { PersuasionResult } from "../persuasion/registry";

export interface TextBlockProps {
  content: string;
  as?: "h1" | "h2" | "p";
  align?: "left" | "center" | "right";
  persuasion?: PersuasionResult | null;
}

function getTagStyle(as: NonNullable<TextBlockProps["as"]>, highlighted: boolean): CSSProperties {
  if (as === "h1") {
    return {
      margin: 0,
      fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
      lineHeight: 0.95,
      letterSpacing: "-0.05em",
      fontWeight: 700,
      opacity: highlighted ? 1 : 0.96
    };
  }

  if (as === "h2") {
    return {
      margin: 0,
      fontSize: "clamp(1.8rem, 4vw, 3rem)",
      lineHeight: 1,
      letterSpacing: "-0.04em",
      fontWeight: 700,
      opacity: highlighted ? 1 : 0.94
    };
  }

  return {
    margin: 0,
    fontSize: 16,
    lineHeight: 1.75,
    opacity: 0.84
  };
}

export function TextBlock({
  content,
  as = "p",
  align = "left",
  persuasion = null
}: TextBlockProps) {
  const theme = useSiteTheme();
  const baseStyle = {
    color: theme.palette.text,
    fontFamily: as === "p" ? theme.typography.body : theme.typography.heading,
    textAlign: align
  } satisfies CSSProperties;
  const tagStyle = getTagStyle(as, Boolean(persuasion?.highlighted));

  if (as === "h1") {
    return <h1 style={{ ...baseStyle, ...tagStyle }}>{content}</h1>;
  }

  if (as === "h2") {
    return <h2 style={{ ...baseStyle, ...tagStyle }}>{content}</h2>;
  }

  return <p style={{ ...baseStyle, ...tagStyle }}>{content}</p>;
}
