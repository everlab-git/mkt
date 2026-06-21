import { useSiteTheme } from "../../theme/ThemeContext";
import type { PersuasionResult } from "../persuasion/registry";

export interface VideoBlockProps {
  src: string;
  poster?: string;
  title?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  persuasion?: PersuasionResult | null;
}

export function VideoBlock({
  src,
  poster,
  title,
  autoPlay = false,
  muted = false,
  loop = false,
  persuasion = null
}: VideoBlockProps) {
  const theme = useSiteTheme();

  return (
    <div
      style={{
        display: "grid",
        gap: 12
      }}
    >
      {title ? (
        <strong
          style={{
            color: theme.palette.text,
            fontFamily: theme.typography.heading,
            fontSize: 20
          }}
        >
          {title}
        </strong>
      ) : null}
      <video
        controls
        poster={poster}
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        style={{
          width: "100%",
          display: "block",
          borderRadius: 24,
          border: `1px solid color-mix(in srgb, ${theme.palette.accent} 30%, transparent)`,
          boxShadow: persuasion?.highlighted
            ? `0 20px 42px color-mix(in srgb, ${theme.palette.accent} 16%, transparent)`
            : "none",
          background: theme.palette.background
        }}
      >
        <source src={src} />
      </video>
    </div>
  );
}
