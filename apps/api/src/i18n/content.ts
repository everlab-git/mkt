export interface LocaleContent {
  ai_generated: boolean;
  [key: string]: unknown;
}

export interface LocalizedBlockContent {
  [locale: string]: LocaleContent;
}

export interface ContentBlockWithI18n {
  id: string;
  type: string;
  props: Record<string, unknown>;
  i18n?: LocalizedBlockContent;
  [key: string]: unknown;
}

export interface ContentSectionWithI18n {
  id: string;
  type: string;
  props: Record<string, unknown>;
  blocks: ContentBlockWithI18n[];
  [key: string]: unknown;
}

export interface PageContentWithI18n {
  sections: ContentSectionWithI18n[];
  [key: string]: unknown;
}

const TEXTUAL_PROP_KEYS = new Set([
  "content",
  "title",
  "description",
  "label",
  "headline",
  "body",
  "text",
  "caption",
  "alt",
  "placeholder",
  "ctaLabel",
  "submitLabel",
  "subtitle",
  "eyebrow"
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function splitTextualProps(props: Record<string, unknown>) {
  const nextProps: Record<string, unknown> = {};
  const localizedProps: Record<string, string> = {};

  for (const [key, value] of Object.entries(props)) {
    if (TEXTUAL_PROP_KEYS.has(key) && typeof value === "string") {
      localizedProps[key] = value;
      continue;
    }

    nextProps[key] = value;
  }

  return {
    props: nextProps,
    localizedProps
  };
}

export function setLocaleContentReviewed<T extends LocaleContent>(value: T): T {
  return {
    ...value,
    ai_generated: false
  };
}

export function migrateContentToI18n(
  content: PageContentWithI18n,
  defaultLocale: string
): PageContentWithI18n {
  const locale = String(defaultLocale).trim() || "pt-BR";

  return {
    ...content,
    sections: Array.isArray(content.sections)
      ? content.sections.map((section) => ({
          ...section,
          blocks: Array.isArray(section.blocks)
            ? section.blocks.map((block) => {
                const props = isRecord(block.props) ? block.props : {};
                const { props: nextProps, localizedProps } = splitTextualProps(props);
                const existingI18n = isRecord(block.i18n) ? block.i18n : undefined;

                if (Object.keys(localizedProps).length === 0) {
                  return {
                    ...block,
                    props: nextProps,
                    ...(existingI18n ? { i18n: existingI18n as LocalizedBlockContent } : {})
                  };
                }

                const currentLocaleContent = isRecord(existingI18n?.[locale])
                  ? (existingI18n[locale] as LocaleContent)
                  : ({ ai_generated: false } as LocaleContent);

                return {
                  ...block,
                  props: nextProps,
                  i18n: {
                    ...(existingI18n as LocalizedBlockContent | undefined),
                    [locale]: setLocaleContentReviewed({
                      ...currentLocaleContent,
                      ...localizedProps
                    })
                  }
                };
              })
            : []
        }))
      : []
  };
}
