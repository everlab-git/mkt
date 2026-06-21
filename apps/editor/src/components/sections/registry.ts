import { Fragment, createElement } from "react";
import { useSiteTheme } from "../../theme/ThemeContext";
import { BlockRenderer, type BuilderLikeBlock } from "../blocks/BlockRenderer";

export interface BuilderLikeSection {
  id: string;
  type: string;
  animationPreset?: {
    name?: string | null;
    options?: Record<string, unknown>;
  } | null;
  props?: {
    title?: string;
    description?: string;
  } & Record<string, unknown>;
  blocks: BuilderLikeBlock[];
}

export interface SectionComponentProps {
  section: BuilderLikeSection;
}

function DefaultSection({ section }: SectionComponentProps) {
  const theme = useSiteTheme();

  return createElement(
    Fragment,
    null,
    section.props?.title
      ? createElement(
          "header",
          { style: { display: "grid", gap: 12 } },
          createElement(
            "h2",
            {
              style: {
                margin: 0,
                color: theme.palette.text,
                fontFamily: theme.typography.heading,
                fontSize: "clamp(2rem, 4vw, 3.25rem)",
                lineHeight: 1
              }
            },
            section.props.title
          ),
          typeof section.props.description === "string"
            ? createElement(
                "p",
                {
                  style: {
                    margin: 0,
                    color: theme.palette.text,
                    opacity: 0.78,
                    fontFamily: theme.typography.body,
                    lineHeight: 1.7
                  }
                },
                section.props.description
              )
            : null
        )
      : null,
    createElement(
      "div",
      { style: { display: "grid", gap: 20 } },
      section.blocks.map((block) => createElement(BlockRenderer, { key: block.id, block }))
    )
  );
}

export const sectionRegistry = {
  hero: DefaultSection,
  cases: DefaultSection
} as const;

export function hasSectionRenderer(value: string): value is keyof typeof sectionRegistry {
  return value in sectionRegistry;
}
