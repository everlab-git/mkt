import type { CSSProperties, ComponentType } from "react";
import { createElement, useMemo, useRef } from "react";
import { hasAnimationPreset, type AnimationPresetName } from "../animations/registry";
import { useScrollAnimation } from "../animations/useScrollAnimation";
import { usePersuasion } from "../persuasion/usePersuasion";
import type { PersuasionResult } from "../persuasion/registry";
import { useSiteTheme } from "../../theme/ThemeContext";
import { blockRegistry, hasBlockRenderer } from "./registry";

interface AnimationPresetConfig {
  name?: string | null;
  options?: Record<string, unknown>;
}

interface PersuasionConfig {
  pattern?: string;
  options?: Record<string, unknown>;
}

type BlockType =
  | "text"
  | "image"
  | "button"
  | "card"
  | "gallery"
  | "video"
  | "table"
  | "chart"
  | "form";

export interface BuilderLikeBlock {
  id: string;
  type: BlockType | string;
  animationPreset?: AnimationPresetConfig | null;
  persuasion?: PersuasionConfig | null;
  props: Record<string, unknown>;
}

export interface BlockRendererProps {
  block: BuilderLikeBlock;
}

export function BlockRenderer({ block }: BlockRendererProps) {
  const theme = useSiteTheme();
  const ref = useRef<HTMLDivElement>(null);
  const animationName = useMemo<AnimationPresetName | undefined>(() => {
    const value = block.animationPreset?.name;
    return typeof value === "string" && hasAnimationPreset(value) ? value : undefined;
  }, [block.animationPreset?.name]);
  const persuasion = usePersuasion(block.persuasion ?? null);

  useScrollAnimation(ref, {
    name: animationName,
    options: block.animationPreset?.options
  });
  const blockType = hasBlockRenderer(block.type) ? block.type : "text";
  const Component = blockRegistry[blockType] as unknown as ComponentType<
    Record<string, unknown> & { persuasion?: PersuasionResult | null }
  >;

  return (
    <div
      ref={ref}
      data-testid={`block-${block.type}`}
      data-block-id={block.id}
      data-block-type={block.type}
      data-highlighted={String(Boolean(persuasion?.highlighted))}
      data-progressive={String(Boolean(persuasion?.progressive))}
      className={persuasion?.className}
      style={getWrapperStyle(theme.palette.accent, theme.palette.background, persuasion)}
    >
      {persuasion?.badges?.length ? (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 12
          }}
        >
          {persuasion.badges.map((badge) => (
            <span
              key={badge}
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "6px 10px",
                borderRadius: 999,
                background: "color-mix(in srgb, currentColor 8%, transparent)",
                color: theme.palette.text,
                fontSize: 12,
                fontFamily: theme.typography.body
              }}
            >
              {badge}
            </span>
          ))}
        </div>
      ) : null}

      {createElement(Component, {
        ...(block.props as Record<string, unknown>),
        persuasion
      })}
    </div>
  );
}

function getWrapperStyle(
  accent: string,
  background: string,
  persuasion: PersuasionResult | null
): CSSProperties {
  return {
    display: "grid",
    gap: 12,
    padding: 20,
    borderRadius: 28,
    border: `1px solid color-mix(in srgb, ${accent} ${persuasion?.highlighted ? 34 : 18}%, transparent)`,
    background: persuasion?.highlighted
      ? `linear-gradient(180deg, color-mix(in srgb, ${accent} 10%, ${background}), ${background})`
      : "color-mix(in srgb, currentColor 2%, transparent)"
  };
}
