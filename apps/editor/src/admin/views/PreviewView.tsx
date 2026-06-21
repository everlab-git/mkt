import type { BuilderSection } from "../../builder/types";
import { SectionRenderer } from "../../components/sections/SectionRenderer";
import { useSiteTheme } from "../../theme/ThemeContext";

export interface PreviewViewProps {
  sections: BuilderSection[];
}

export function PreviewView({ sections }: PreviewViewProps) {
  const theme = useSiteTheme();

  return (
    <section
      aria-label="Preview do projeto"
      style={{
        display: "grid",
        gap: 18,
        padding: 28,
        borderRadius: 32,
        background: `linear-gradient(180deg, color-mix(in srgb, ${theme.palette.background} 88%, #0b1220), ${theme.palette.background})`,
        border: `1px solid color-mix(in srgb, ${theme.palette.accent} 18%, transparent)`
      }}
    >
      <header style={{ display: "grid", gap: 8 }}>
        <h2 style={{ margin: 0, fontFamily: theme.typography.heading }}>Preview</h2>
        <p style={{ margin: 0, lineHeight: 1.7, opacity: 0.78 }}>
          Renderização direta das seções atuais do projeto.
        </p>
      </header>

      <div data-testid="project-preview" style={{ display: "grid", gap: 12 }}>
        {sections.map((section) => (
          <SectionRenderer key={section.id} section={section} />
        ))}
      </div>
    </section>
  );
}
