import type { BuilderAction } from "./actions";
import type {
  BuilderBlock,
  BuilderBlockDraft,
  BuilderPage,
  BuilderPageSeo,
  BuilderSection,
  BuilderSectionDraft,
  BuilderState
} from "./types";

const SEO_REQUIRED_MESSAGE = "Preencha SEO title e SEO description antes de publicar.";
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

export function builderReducer(state: BuilderState, action: BuilderAction): BuilderState {
  switch (action.type) {
    case "SET_VIEW":
      return syncLocaleState(setView(state, action.view));
    case "CREATE_PAGE":
      return syncLocaleState(createPage(state, action.page));
    case "SET_ACTIVE_PAGE":
      return syncLocaleState(setActivePage(state, action.pageId));
    case "UPDATE_PAGE_SEO":
      return syncLocaleState(updatePageSeo(state, action.pageId, action.seo));
    case "SET_ACTIVE_LOCALE":
      return syncLocaleState(setActiveLocale(state, action.locale));
    case "ADD_SITE_LANGUAGE":
      return syncLocaleState(addSiteLanguage(state, action.locale));
    case "SET_DEFAULT_LOCALE":
      return syncLocaleState(setDefaultLocale(state, action.locale));
    case "PUBLISH_PAGE":
      return syncLocaleState(publishPage(state, action.pageId));
    case "SELECT_SECTION":
      return syncLocaleState(selectSection(state, action.sectionId));
    case "ADD_SECTION":
      return syncLocaleState(addSection(state, action.section));
    case "REMOVE_SECTION":
      return syncLocaleState(removeSection(state, action.sectionId));
    case "ADD_BLOCK":
      return syncLocaleState(addBlock(state, action.sectionId, action.block));
    case "REMOVE_BLOCK":
      return syncLocaleState(removeBlock(state, action.sectionId, action.blockId));
    case "SELECT_BLOCK":
      return syncLocaleState(selectBlock(state, action.sectionId, action.blockId));
    case "UPDATE_BLOCK_PROPS":
      return syncLocaleState(updateBlockProps(state, action.sectionId, action.blockId, action.props));
    case "REORDER_BLOCKS":
      return syncLocaleState(
        reorderBlocks(state, action.sectionId, action.fromIndex, action.toIndex)
      );
    default:
      return state;
  }
}

function setView(state: BuilderState, view: BuilderState["view"]): BuilderState {
  if (view !== "builder") {
    return {
      ...state,
      view
    };
  }

  const fallbackSection = state.sections[0] ?? null;
  const nextSelectedSectionId = state.selectedSectionId ?? fallbackSection?.id ?? null;
  const selectedSection =
    state.sections.find((section) => section.id === nextSelectedSectionId) ?? fallbackSection;
  const nextSelectedBlockId =
    selectedSection?.blocks.some((block) => block.id === state.selectedBlockId)
      ? state.selectedBlockId
      : selectedSection?.blocks[0]?.id ?? null;

  return {
    ...state,
    view,
    selectedSectionId: selectedSection?.id ?? null,
    selectedBlockId: nextSelectedBlockId
  };
}

function createPage(
  state: BuilderState,
  input: {
    name: string;
    strategy: "blank" | "template" | "duplicate";
    templateKey: string | null;
    sourcePageId: string | null;
    followVisualModel: boolean;
  }
): BuilderState {
  const trimmedName = normalizeString(input.name) || `Nova página ${state.pages.length + 1}`;
  const baseSlug = slugify(trimmedName) || `pagina-${state.pages.length + 1}`;
  const slug = ensureUniqueSlug(state.pages, baseSlug);
  const sourcePage =
    input.strategy === "duplicate"
      ? state.pages.find((page) => page.id === input.sourcePageId) ?? state.pages[0] ?? null
      : null;

  const page: BuilderPage = {
    id: createPageId(slug),
    name: trimmedName,
    slug,
    localizedSlug: buildLocalizedSlug(state, slug),
    status: "draft",
    followVisualModel: input.strategy === "blank" ? input.followVisualModel : false,
    seo: buildInitialSeo(slug, sourcePage?.seo),
    localizedSeo: buildLocalizedSeo(state, slug, sourcePage?.localizedSeo, sourcePage?.seo),
    sections: buildInitialSections(trimmedName, input.strategy, input.templateKey, sourcePage)
  };

  return syncActivePage(
    {
      ...state,
      pages: [...state.pages, page],
      activePageId: page.id,
      publishValidationMessage: null
    },
    page.id
  );
}

function setActivePage(state: BuilderState, pageId: string): BuilderState {
  const page = state.pages.find((item) => item.id === pageId);

  if (!page) {
    return state;
  }

  return syncActivePage(
    {
      ...state,
      activePageId: pageId,
      publishValidationMessage: null
    },
    pageId
  );
}

function addSection(state: BuilderState, section: BuilderSectionDraft): BuilderState {
  const nextSectionId = section.id ?? `section-${section.type}-${state.sections.length + 1}`;

  if (findSection(state, nextSectionId)) {
    return state;
  }

  const nextSection: BuilderSection = {
    id: nextSectionId,
    type: section.type,
    animationPreset: section.animationPreset ?? null,
    props: section.props,
    i18n: section.i18n,
    blocks: (section.blocks ?? []).map((block, index) => ({
      id: block.id ?? `${nextSectionId}-block-${index + 1}`,
      type: block.type,
      animationPreset: block.animationPreset ?? null,
      persuasion: block.persuasion ?? null,
      props: block.props,
      i18n: block.i18n
    }))
  };

  return {
    ...state,
    ...withActivePageSections(state, [...state.sections, nextSection]),
    selectedSectionId: nextSection.id,
    selectedBlockId: null,
    publishValidationMessage: null
  };
}

function removeSection(state: BuilderState, sectionId: string): BuilderState {
  const section = findSection(state, sectionId);

  if (!section) {
    return state;
  }

  const shouldClearSelection =
    state.selectedSectionId === sectionId ||
    section.blocks.some((block) => block.id === state.selectedBlockId);

  return {
    ...state,
    ...withActivePageSections(
      state,
      state.sections.filter((item) => item.id !== sectionId)
    ),
    selectedSectionId: shouldClearSelection ? null : state.selectedSectionId,
    selectedBlockId: shouldClearSelection ? null : state.selectedBlockId,
    publishValidationMessage: null
  };
}

function addBlock(state: BuilderState, sectionId: string, block: BuilderBlockDraft): BuilderState {
  const section = findSection(state, sectionId);

  if (!section) {
    return state;
  }

  const nextBlock: BuilderBlock = {
    id: block.id ?? `${sectionId}-block-${section.blocks.length + 1}`,
    type: block.type,
    animationPreset: block.animationPreset ?? null,
    persuasion: block.persuasion ?? null,
    props: block.props,
    i18n: block.i18n
  };

  return {
    ...state,
    ...withActivePageSections(
      state,
      state.sections.map((item) =>
        item.id === sectionId
          ? {
              ...item,
              blocks: [...item.blocks, nextBlock]
            }
          : item
      )
    ),
    selectedSectionId: sectionId,
    selectedBlockId: nextBlock.id,
    publishValidationMessage: null
  };
}

function removeBlock(state: BuilderState, sectionId: string, blockId: string): BuilderState {
  const section = findSection(state, sectionId);

  if (!section || !section.blocks.some((block) => block.id === blockId)) {
    return state;
  }

  return {
    ...state,
    ...withActivePageSections(
      state,
      state.sections.map((item) =>
        item.id === sectionId
          ? {
              ...item,
              blocks: item.blocks.filter((block) => block.id !== blockId)
            }
          : item
      )
    ),
    selectedSectionId: sectionId,
    selectedBlockId: state.selectedBlockId === blockId ? null : state.selectedBlockId,
    publishValidationMessage: null
  };
}

function selectSection(state: BuilderState, sectionId: string | null): BuilderState {
  if (sectionId === null) {
    return {
      ...state,
      selectedSectionId: null,
      selectedBlockId: null
    };
  }

  if (!findSection(state, sectionId)) {
    return state;
  }

  return {
    ...state,
    selectedSectionId: sectionId,
    selectedBlockId: null,
    publishValidationMessage: null
  };
}

function selectBlock(state: BuilderState, sectionId: string, blockId: string | null): BuilderState {
  const section = findSection(state, sectionId);

  if (!section) {
    return state;
  }

  if (blockId === null) {
    return {
      ...state,
      selectedSectionId: sectionId,
      selectedBlockId: null
    };
  }

  if (!section.blocks.some((block) => block.id === blockId)) {
    return state;
  }

  return {
    ...state,
    selectedSectionId: sectionId,
    selectedBlockId: blockId,
    publishValidationMessage: null
  };
}

function updatePageSeo(
  state: BuilderState,
  pageId: string,
  seo: Partial<BuilderPageSeo>
): BuilderState {
  const page = state.pages.find((item) => item.id === pageId);

  if (!page) {
    return state;
  }

  return {
    ...state,
    pages: state.pages.map((item) =>
      item.id === pageId
        ? {
            ...item,
            localizedSeo: {
              ...(item.localizedSeo ?? {}),
              [state.activeLocale]: {
                ...resolveLocalizedSeo(item, state.activeLocale, state.siteLanguages.default),
                ...normalizeSeoInput(
                  seo,
                  resolveLocalizedSeo(item, state.activeLocale, state.siteLanguages.default).canonical
                )
              }
            }
          }
        : item
    ),
    publishValidationMessage: null
  };
}

function publishPage(state: BuilderState, pageId: string): BuilderState {
  const page = state.pages.find((item) => item.id === pageId);

  if (!page) {
    return state;
  }

  const seo = resolveLocalizedSeo(page, state.activeLocale, state.siteLanguages.default);

  if (!normalizeString(seo.title) || !normalizeString(seo.description)) {
    return {
      ...state,
      publishValidationMessage: SEO_REQUIRED_MESSAGE
    };
  }

  return {
    ...state,
    pages: state.pages.map((item) =>
      item.id === pageId
        ? {
            ...item,
            status: "published"
          }
        : item
    ),
    publishValidationMessage: null
  };
}

function updateBlockProps(
  state: BuilderState,
  sectionId: string,
  blockId: string,
  props: Record<string, unknown>
): BuilderState {
  const section = findSection(state, sectionId);

  if (!section || !section.blocks.some((block) => block.id === blockId)) {
    return state;
  }

  return {
    ...state,
    ...withActivePageSections(
      state,
      state.sections.map((item) =>
        item.id === sectionId
          ? {
              ...item,
              blocks: item.blocks.map((block) =>
                block.id === blockId
                  ? {
                      ...block,
                      i18n:
                        Object.keys(pickLocalizedProps(props)).length > 0
                          ? {
                              ...(block.i18n ?? {}),
                              [state.activeLocale]: {
                                ai_generated: false,
                                ...(block.i18n?.[state.activeLocale] ?? {}),
                                ...pickLocalizedProps(props)
                              }
                            }
                          : block.i18n,
                      props: {
                        ...block.props,
                        ...props
                      }
                    }
                  : block
              )
            }
          : item
      )
    ),
    selectedSectionId: sectionId,
    selectedBlockId: blockId,
    publishValidationMessage: null
  };
}

function reorderBlocks(
  state: BuilderState,
  sectionId: string,
  fromIndex: number,
  toIndex: number
): BuilderState {
  const section = findSection(state, sectionId);

  if (!section) {
    return state;
  }

  if (!isValidIndex(section.blocks, fromIndex) || !isValidIndex(section.blocks, toIndex)) {
    return state;
  }

  const nextBlocks = [...section.blocks];
  const [movedBlock] = nextBlocks.splice(fromIndex, 1);

  if (!movedBlock) {
    return state;
  }

  nextBlocks.splice(toIndex, 0, movedBlock);

  return {
    ...state,
    ...withActivePageSections(
      state,
      state.sections.map((item) =>
        item.id === sectionId
          ? {
              ...item,
              blocks: nextBlocks
            }
          : item
      )
    ),
    selectedSectionId: sectionId,
    selectedBlockId: movedBlock.id,
    publishValidationMessage: null
  };
}

function findSection(state: BuilderState, sectionId: string): BuilderSection | undefined {
  return state.sections.find((section) => section.id === sectionId);
}

function withActivePageSections(state: BuilderState, sections: BuilderSection[]) {
  if (!state.activePageId) {
    return { sections };
  }

  return {
    sections,
    pages: state.pages.map((page) =>
      page.id === state.activePageId
        ? {
            ...page,
            sections: clone(sections)
          }
        : page
    )
  };
}

function syncActivePage(state: BuilderState, pageId: string): BuilderState {
  const page = state.pages.find((item) => item.id === pageId) ?? null;
  const sections = clone(page?.sections ?? []);
  const selectedSection = sections[0] ?? null;

  return {
    ...state,
    sections,
    selectedSectionId: selectedSection?.id ?? null,
    selectedBlockId: selectedSection?.blocks[0]?.id ?? null
  };
}

function buildInitialSections(
  name: string,
  strategy: "blank" | "template" | "duplicate",
  templateKey: string | null,
  sourcePage: BuilderPage | null
) {
  if (strategy === "blank") {
    return [];
  }

  if (strategy === "duplicate" && sourcePage) {
    return clone(sourcePage.sections);
  }

  const sectionType = templateKey === "cases" ? "cases" : "hero";
  const templateTitleMap: Record<string, string> = {
    institutional: "Institucional",
    services: "Serviços",
    cases: "Cases",
    contact: "Contato"
  };

  return [
    {
      id: `section-${slugify(name) || "nova-pagina"}-hero`,
      type: sectionType,
      animationPreset: null,
      props: {
        title: name,
        description: `Estrutura inicial baseada em ${templateTitleMap[templateKey ?? ""] ?? "modelo"}`
      },
      blocks: [
        {
          id: `block-${slugify(name) || "nova-pagina"}-heading`,
          type: "text",
          animationPreset: null,
          persuasion: null,
          props: {
            as: "h2",
            content: `${name} em construção`
          }
        }
      ]
    }
  ];
}

function buildInitialSeo(slug: string, sourceSeo?: BuilderPageSeo) {
  if (sourceSeo) {
    return {
      ...clone(sourceSeo),
      canonical: slug
    };
  }

  return {
    title: "",
    description: "",
    ogImage: "",
    canonical: slug
  };
}

function setActiveLocale(state: BuilderState, locale: string): BuilderState {
  const nextLocale = normalizeString(locale);

  if (!nextLocale || !state.siteLanguages.enabled.includes(nextLocale)) {
    return state;
  }

  return {
    ...state,
    activeLocale: nextLocale,
    publishValidationMessage: null
  };
}

function addSiteLanguage(state: BuilderState, locale: string): BuilderState {
  const nextLocale = normalizeString(locale);

  if (!nextLocale || state.siteLanguages.enabled.includes(nextLocale)) {
    return state;
  }

  return {
    ...state,
    siteLanguages: {
      ...state.siteLanguages,
      enabled: [...state.siteLanguages.enabled, nextLocale]
    },
    pages: state.pages.map((page) => ({
      ...page,
      localizedSlug: {
        ...(page.localizedSlug ?? { [state.siteLanguages.default]: page.slug }),
        [nextLocale]: page.localizedSlug?.[nextLocale] ?? ""
      },
      localizedSeo: {
        ...(page.localizedSeo ?? { [state.siteLanguages.default]: page.seo }),
        [nextLocale]: page.localizedSeo?.[nextLocale] ?? buildInitialSeo("")
      }
    })),
    publishValidationMessage: null
  };
}

function setDefaultLocale(state: BuilderState, locale: string): BuilderState {
  const nextLocale = normalizeString(locale);

  if (!nextLocale || !state.siteLanguages.enabled.includes(nextLocale)) {
    return state;
  }

  return {
    ...state,
    siteLanguages: {
      ...state.siteLanguages,
      default: nextLocale,
      enabled: state.siteLanguages.enabled
    },
    publishValidationMessage: null
  };
}

function createPageId(slug: string) {
  return `page-${slug.replace(/^\//, "").replace(/\//g, "-") || "home"}`;
}

function ensureUniqueSlug(pages: BuilderPage[], slugBase: string) {
  const initialSlug = `/${slugBase}`;

  if (
    !pages.some(
      (page) =>
        page.slug === initialSlug || Object.values(page.localizedSlug ?? { current: page.slug }).includes(initialSlug)
    )
  ) {
    return initialSlug;
  }

  let suffix = 2;
  while (
    pages.some(
      (page) =>
        page.slug === `${initialSlug}-${suffix}` ||
        Object.values(page.localizedSlug ?? { current: page.slug }).includes(`${initialSlug}-${suffix}`)
    )
  ) {
    suffix += 1;
  }

  return `${initialSlug}-${suffix}`;
}

function normalizeSeoInput(seo: Partial<BuilderPageSeo>, currentSeo: BuilderPageSeo | string) {
  const fallbackSeo = typeof currentSeo === "string" ? buildInitialSeo(currentSeo) : currentSeo;

  return {
    title: seo.title === undefined ? fallbackSeo.title : normalizeString(seo.title),
    description:
      seo.description === undefined ? fallbackSeo.description : normalizeString(seo.description),
    ogImage: seo.ogImage === undefined ? fallbackSeo.ogImage : normalizeString(seo.ogImage),
    canonical: seo.canonical === undefined ? fallbackSeo.canonical : normalizeString(seo.canonical)
  };
}

function normalizeString(value: unknown) {
  return String(value ?? "").trim();
}

function slugify(value: string) {
  return normalizeString(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isValidIndex(items: unknown[], index: number) {
  return index >= 0 && index < items.length;
}

function syncLocaleState(state: BuilderState): BuilderState {
  const pages = state.pages.map((page) =>
    localizePage(page, state.activeLocale, state.siteLanguages.default)
  );
  const activePage = pages.find((page) => page.id === state.activePageId) ?? null;
  const sections = clone(activePage?.sections ?? []);
  const nextSelectedSectionId =
    state.selectedSectionId === null
      ? null
      : sections.some((section) => section.id === state.selectedSectionId)
        ? state.selectedSectionId
        : sections[0]?.id ?? null;
  const selectedSection =
    nextSelectedSectionId === null
      ? null
      : sections.find((section) => section.id === nextSelectedSectionId) ?? null;
  const nextSelectedBlockId =
    nextSelectedSectionId === null
      ? null
      : state.selectedBlockId === null
        ? null
        : selectedSection?.blocks.some((block) => block.id === state.selectedBlockId)
          ? state.selectedBlockId
          : selectedSection?.blocks[0]?.id ?? null;

  return {
    ...state,
    pages,
    sections,
    selectedSectionId: nextSelectedSectionId,
    selectedBlockId: nextSelectedBlockId
  };
}

function localizePage(page: BuilderPage, activeLocale: string, defaultLocale: string): BuilderPage {
  const localizedSlug = page.localizedSlug ?? { [defaultLocale]: page.slug };
  const localizedSeo = page.localizedSeo ?? { [defaultLocale]: page.seo };
  const slug = resolveLocalizedField(localizedSlug, activeLocale, defaultLocale);

  return {
    ...page,
    slug,
    localizedSlug,
    localizedSeo,
    seo: resolveLocalizedSeo({ ...page, localizedSlug, localizedSeo }, activeLocale, defaultLocale),
    sections: page.sections.map((section) => localizeSection(section, activeLocale, defaultLocale))
  };
}

function localizeSection(
  section: BuilderSection,
  activeLocale: string,
  defaultLocale: string
): BuilderSection {
  return {
    ...section,
    props: localizeProps(section.props, section.i18n, activeLocale, defaultLocale),
    blocks: section.blocks.map((block) => localizeBlock(block, activeLocale, defaultLocale))
  };
}

function localizeBlock(
  block: BuilderBlock,
  activeLocale: string,
  defaultLocale: string
): BuilderBlock {
  return {
    ...block,
    props: localizeProps(block.props, block.i18n, activeLocale, defaultLocale)
  };
}

function localizeProps(
  props: Record<string, unknown>,
  i18n: BuilderSection["i18n"] | BuilderBlock["i18n"],
  activeLocale: string,
  defaultLocale: string
) {
  return {
    ...props,
    ...pickLocalizedProps(i18n?.[defaultLocale]),
    ...pickLocalizedProps(i18n?.[activeLocale])
  };
}

function pickLocalizedProps(content?: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(content ?? {}).filter(
      ([key, value]) => key !== "ai_generated" && TEXTUAL_PROP_KEYS.has(key) && typeof value === "string"
    )
  );
}

function resolveLocalizedSeo(page: BuilderPage, activeLocale: string, defaultLocale: string) {
  const localizedSeo = page.localizedSeo ?? { [defaultLocale]: page.seo };
  const localizedSlug = page.localizedSlug ?? { [defaultLocale]: page.slug };
  const localeSeo = localizedSeo[activeLocale];
  const defaultSeo = localizedSeo[defaultLocale];
  const baseSeo = localeSeo ?? defaultSeo ?? page.seo;
  const fallbackCanonical = resolveLocalizedField(localizedSlug, activeLocale, defaultLocale);

  if (localeSeo) {
    return normalizeSeoInput(localeSeo, fallbackCanonical);
  }

  return normalizeSeoInput(baseSeo, fallbackCanonical);
}

function resolveLocalizedField(
  values: Record<string, string>,
  activeLocale: string,
  defaultLocale: string
) {
  if (Object.prototype.hasOwnProperty.call(values, activeLocale)) {
    return normalizeString(values[activeLocale]);
  }

  if (Object.prototype.hasOwnProperty.call(values, defaultLocale)) {
    return normalizeString(values[defaultLocale]);
  }

  return normalizeString(Object.values(values)[0]);
}

function buildLocalizedSlug(state: BuilderState, slug: string) {
  const localizedSlug = Object.fromEntries(state.siteLanguages.enabled.map((locale) => [locale, ""]));
  localizedSlug[state.siteLanguages.default] = slug;
  localizedSlug[state.activeLocale] = slug;

  return localizedSlug;
}

function buildLocalizedSeo(
  state: BuilderState,
  slug: string,
  sourceSeoByLocale?: Record<string, BuilderPageSeo>,
  sourceSeo?: BuilderPageSeo
) {
  const localizedSeo = Object.fromEntries(
    state.siteLanguages.enabled.map((locale) => [locale, buildInitialSeo("")])
  ) as Record<string, BuilderPageSeo>;

  localizedSeo[state.siteLanguages.default] = buildInitialSeo(
    slug,
    sourceSeoByLocale?.[state.siteLanguages.default] ?? sourceSeo
  );
  localizedSeo[state.activeLocale] = buildInitialSeo(
    slug,
    sourceSeoByLocale?.[state.activeLocale] ?? sourceSeo
  );

  return localizedSeo;
}
