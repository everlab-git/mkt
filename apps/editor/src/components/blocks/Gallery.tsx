import { useSiteTheme } from "../../theme/ThemeContext";
import type { PersuasionResult } from "../persuasion/registry";

interface GalleryImage {
  url: string;
  alt: string;
}

export interface GalleryBlockProps {
  images: GalleryImage[];
  layout?: "grid" | "mosaic";
  columns?: number;
  persuasion?: PersuasionResult | null;
}

export function GalleryBlock({
  images,
  layout = "grid",
  columns = 2,
  persuasion = null
}: GalleryBlockProps) {
  const theme = useSiteTheme();
  const templateColumns =
    layout === "mosaic"
      ? "minmax(0, 1.2fr) minmax(0, 0.8fr)"
      : `repeat(${Math.max(columns, 1)}, minmax(0, 1fr))`;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: templateColumns,
        gap: 16
      }}
    >
      {images.map((image, index) => (
        <figure
          key={`${image.url}-${index}`}
          style={{
            margin: 0,
            display: "grid",
            gap: 0,
            borderRadius: 24,
            overflow: "hidden",
            border: `1px solid color-mix(in srgb, ${theme.palette.accent} 30%, transparent)`,
            boxShadow: persuasion?.highlighted
              ? `0 18px 36px color-mix(in srgb, ${theme.palette.accent} 14%, transparent)`
              : "none"
          }}
        >
          <img
            src={image.url}
            alt={image.alt}
            loading="lazy"
            decoding="async"
            style={{
              display: "block",
              width: "100%",
              height: "100%",
              minHeight: layout === "mosaic" && index === 0 ? 320 : 220,
              objectFit: "cover",
              background: "rgba(255,255,255,0.04)"
            }}
          />
        </figure>
      ))}
    </div>
  );
}
