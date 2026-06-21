import type {
  BuilderBlockDraft,
  BuilderPageCreationStrategy,
  BuilderPageSeo,
  BuilderSectionDraft,
  BuilderView
} from "./types";

export interface SetViewAction {
  type: "SET_VIEW";
  view: BuilderView;
}

export interface SelectSectionAction {
  type: "SELECT_SECTION";
  sectionId: string | null;
}

export interface AddSectionAction {
  type: "ADD_SECTION";
  section: BuilderSectionDraft;
}

export interface RemoveSectionAction {
  type: "REMOVE_SECTION";
  sectionId: string;
}

export interface AddBlockAction {
  type: "ADD_BLOCK";
  sectionId: string;
  block: BuilderBlockDraft;
}

export interface RemoveBlockAction {
  type: "REMOVE_BLOCK";
  sectionId: string;
  blockId: string;
}

export interface SelectBlockAction {
  type: "SELECT_BLOCK";
  sectionId: string;
  blockId: string | null;
}

export interface UpdateBlockPropsAction {
  type: "UPDATE_BLOCK_PROPS";
  sectionId: string;
  blockId: string;
  props: Record<string, unknown>;
}

export interface ReorderBlocksAction {
  type: "REORDER_BLOCKS";
  sectionId: string;
  fromIndex: number;
  toIndex: number;
}

export interface CreatePageAction {
  type: "CREATE_PAGE";
  page: {
    name: string;
    strategy: BuilderPageCreationStrategy;
    templateKey: string | null;
    sourcePageId: string | null;
    followVisualModel: boolean;
  };
}

export interface SetActivePageAction {
  type: "SET_ACTIVE_PAGE";
  pageId: string;
}

export interface UpdatePageSeoAction {
  type: "UPDATE_PAGE_SEO";
  pageId: string;
  seo: Partial<BuilderPageSeo>;
}

export interface SetActiveLocaleAction {
  type: "SET_ACTIVE_LOCALE";
  locale: string;
}

export interface AddSiteLanguageAction {
  type: "ADD_SITE_LANGUAGE";
  locale: string;
}

export interface SetDefaultLocaleAction {
  type: "SET_DEFAULT_LOCALE";
  locale: string;
}

export interface PublishPageAction {
  type: "PUBLISH_PAGE";
  pageId: string;
}

export function setView(view: BuilderView): SetViewAction {
  return {
    type: "SET_VIEW",
    view
  };
}

export function setActiveLocale(locale: string): SetActiveLocaleAction {
  return {
    type: "SET_ACTIVE_LOCALE",
    locale
  };
}

export type BuilderAction =
  | SetViewAction
  | CreatePageAction
  | SetActivePageAction
  | UpdatePageSeoAction
  | SetActiveLocaleAction
  | AddSiteLanguageAction
  | SetDefaultLocaleAction
  | PublishPageAction
  | SelectSectionAction
  | AddSectionAction
  | RemoveSectionAction
  | AddBlockAction
  | RemoveBlockAction
  | SelectBlockAction
  | UpdateBlockPropsAction
  | ReorderBlocksAction;
