import type { CSSProperties, ComponentType } from "react";
import { useMemo, useRef } from "react";
import { useSiteTheme } from "../../theme/ThemeContext";
import { hasAnimationPreset, type AnimationPresetName } from "../animations/registry";
import { useScrollAnimation } from "../animations/useScrollAnimation";
import {
  hasSectionRenderer,
  sectionRegistry,
  type BuilderLikeSection,
  type SectionComponentProps
} from "./registry";

export interface SectionRendererProps {
  section: BuilderLikeSection;
}

export function SectionRenderer({ section }: SectionRendererProps) {
  const theme = useSiteTheme();
  const ref = useRef<HTMLElement>(null);
  const animationName = useMemo<AnimationPresetName | undefined>(() => {
    const value = section.animationPreset?.name;
    return typeof value === "string" && hasAnimationPreset(value) ? value : undefined;
  }, [section.animationPreset?.name]);

  useScrollAnimation(ref, {
    name: animationName,
    options: section.animationPreset?.options
  });
  const sectionType = hasSectionRenderer(section.type) ? section.type : "hero";
  const SectionComponent = sectionRegistry[sectionType] as ComponentType<SectionComponentProps>;

  return (
    <section
      ref={ref}
      data-testid={`section-${section.type}`}
      data-section-id={section.id}
      data-section-type={section.type}
      style={getSectionStyle(theme.palette.accent)}
    >
      <SectionComponent section={section} />
    </section>
  );
}

function getSectionStyle(accent: string): CSSProperties {
  return {
    display: "grid",
    gap: 24,
    padding: "32px 0",
    borderTop: `1px solid color-mix(in srgb, ${accent} 16%, transparent)`
  };
}
