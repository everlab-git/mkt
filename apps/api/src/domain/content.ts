export interface AnimationPreset {
  name: string;
  options?: Record<string, unknown>;
}

export interface PersuasionPreset {
  pattern: string;
  options?: Record<string, unknown>;
}

export interface ContentBlock {
  id: string;
  type: string;
  animationPreset: AnimationPreset | null;
  persuasion: PersuasionPreset | null;
  props: Record<string, unknown>;
}

export interface ContentSection {
  id: string;
  type: string;
  animationPreset: AnimationPreset | null;
  props: Record<string, unknown>;
  blocks: ContentBlock[];
}

export interface PageContent {
  sections: ContentSection[];
}

function safeStringify(value: unknown): string {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}

function fallbackTextFromLegacy(value: Record<string, unknown>): string {
  return sanitizeRichText(
    [value.headline, value.title, value.body, value.description].filter(Boolean).join("\n\n")
  );
}

export function sanitizeRichText(value: string): string {
  return value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "");
}

export function normalizePageContent(input: unknown): PageContent {
  const value = input as Partial<PageContent> | null | undefined;
  if (Array.isArray(value?.sections)) {
    return {
      sections: value.sections.map((section, index) => ({
        id: section?.id ?? `section-${index + 1}`,
        type: section?.type ?? "custom",
        animationPreset: section?.animationPreset ?? null,
        props: section?.props ?? {},
        blocks: Array.isArray(section?.blocks)
          ? section.blocks.map((block, blockIndex) => ({
              id: block?.id ?? `block-${index + 1}-${blockIndex + 1}`,
              type: block?.type ?? "text",
              animationPreset: block?.animationPreset ?? null,
              persuasion: block?.persuasion ?? null,
              props: block?.props ?? {}
            }))
          : []
      }))
    };
  }

  const legacy = (input ?? {}) as Record<string, unknown>;
  return {
    sections: [
      {
        id: "legacy-section-1",
        type: "custom",
        animationPreset: null,
        props: { legacy: true },
        blocks: [
          {
            id: "legacy-block-1",
            type: "text",
            animationPreset: null,
            persuasion: null,
            props: {
              content: fallbackTextFromLegacy(legacy) || sanitizeRichText(safeStringify(legacy)),
              as: "p",
              legacy: true
            }
          }
        ]
      }
    ]
  };
}

export function collectBlockTypes(input: unknown): string[] {
  const content = normalizePageContent(input);
  return [...new Set(content.sections.flatMap((section) => section.blocks.map((block) => block.type)))].sort();
}

