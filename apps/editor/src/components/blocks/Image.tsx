import type { CSSProperties } from "react";
import { useSiteTheme } from "../../theme/ThemeContext";
import type { PersuasionResult } from "../persuasion/registry";

export interface ImageBlockProps {
  src?: string;
  url?: string;
  alt: string;
  caption?: string;
  aspectRatio?: string;
  persuasion?: PersuasionResult | null;
}

export function ImageBlock({
  src,
  url,
  alt,
  caption,
  aspectRatio = "16 / 9",
  persuasion = null
}: ImageBlockProps) {
  const theme = useSiteTheme();
  const imageUrl = src ?? url ?? "";
  const frameStyle: CSSProperties = {
    display: "grid",
    gap: 12,
    margin: 0
  };

  return (
    <figure style={frameStyle}>
      <img
        src={imageUrl}
        alt={alt}
        loading="lazy"
        decoding="async"
        style={{
          width: "100%",
          aspectRatio,
          objectFit: "cover",
          display: "block",
          borderRadius: 24,
          border: `1px solid color-mix(in srgb, ${theme.palette.accent} 28%, transparent)`,
          boxShadow: persuasion?.highlighted
            ? `0 18px 40px color-mix(in srgb, ${theme.palette.accent} 18%, transparent)`
            : "none",
          background: "rgba(255,255,255,0.04)"
        }}
      />
      {caption ? (
        <figcaption
          style={{
            color: theme.palette.text,
            opacity: 0.72,
            lineHeight: 1.6,
            fontFamily: theme.typography.body
          }}
        >
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
