import { useSiteTheme } from "../../theme/ThemeContext";
import type { PersuasionResult } from "../persuasion/registry";
import { ButtonBlock } from "./Button";

export interface CardBlockProps {
  title: string;
  description: string;
  href?: string;
  ctaLabel?: string;
  persuasion?: PersuasionResult | null;
}

export function CardBlock({
  title,
  description,
  href,
  ctaLabel = "Saiba mais",
  persuasion = null
}: CardBlockProps) {
  const theme = useSiteTheme();

  return (
    <article
      style={{
        display: "grid",
        gap: 16,
        padding: 24,
        borderRadius: 28,
        border: `1px solid color-mix(in srgb, ${theme.palette.accent} 36%, transparent)`,
        background: persuasion?.highlighted
          ? `linear-gradient(180deg, color-mix(in srgb, ${theme.palette.accent} 16%, ${theme.palette.primary}), ${theme.palette.background})`
          : `linear-gradient(180deg, color-mix(in srgb, ${theme.palette.primary} 82%, ${theme.palette.background}), ${theme.palette.background})`,
        color: theme.palette.text
      }}
    >
      {persuasion?.badges?.length ? (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8
          }}
        >
          {persuasion.badges.map((badge) => (
            <span
              key={badge}
              style={{
                display: "inline-flex",
                padding: "6px 10px",
                borderRadius: 999,
                background: "color-mix(in srgb, currentColor 10%, transparent)",
                fontSize: 12,
                fontFamily: theme.typography.body
              }}
            >
              {badge}
            </span>
          ))}
        </div>
      ) : null}

      <div>
        <h3
          style={{
            margin: 0,
            fontSize: 28,
            lineHeight: 1,
            letterSpacing: "-0.04em",
            fontFamily: theme.typography.heading
          }}
        >
          {title}
        </h3>
        <p
          style={{
            margin: "14px 0 0",
            lineHeight: 1.7,
            opacity: 0.84,
            fontFamily: theme.typography.body
          }}
        >
          {description}
        </p>
      </div>

      {href ? <ButtonBlock label={ctaLabel} href={href} persuasion={persuasion} /> : null}
    </article>
  );
}
