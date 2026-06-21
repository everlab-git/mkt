import type { ProjectView } from "../admin/types";
import type {
  LocalizedContentMap,
  LocalizedFieldMap,
  SiteLanguages
} from "../i18n/types";

export interface BuilderAnimationPreset {
  name: string;
  options?: Record<string, unknown>;
}

export interface BuilderPersuasionConfig {
  pattern: string;
  options?: Record<string, unknown>;
}

export interface BuilderBlock {
  id: string;
  type: string;
  animationPreset: BuilderAnimationPreset | null;
  persuasion: BuilderPersuasionConfig | null;
  props: Record<string, unknown>;
  i18n?: LocalizedContentMap;
}

export interface BuilderBlockDraft {
  id?: string;
  type: string;
  animationPreset?: BuilderAnimationPreset | null;
  persuasion?: BuilderPersuasionConfig | null;
  props: Record<string, unknown>;
  i18n?: LocalizedContentMap;
}

export interface BuilderSection {
  id: string;
  type: string;
  animationPreset: BuilderAnimationPreset | null;
  props: Record<string, unknown>;
  blocks: BuilderBlock[];
  i18n?: LocalizedContentMap;
}

export interface BuilderSectionDraft {
  id?: string;
  type: string;
  animationPreset?: BuilderAnimationPreset | null;
  props: Record<string, unknown>;
  blocks?: BuilderBlockDraft[];
  i18n?: LocalizedContentMap;
}

export interface BuilderPageSeo {
  title: string;
  description: string;
  ogImage: string;
  canonical: string;
}

export type BuilderPageStatus = "draft" | "published";

export type BuilderPageCreationStrategy = "blank" | "template" | "duplicate";

export interface BuilderPage {
  id: string;
  name: string;
  slug: string;
  localizedSlug?: LocalizedFieldMap;
  status: BuilderPageStatus;
  followVisualModel: boolean;
  seo: BuilderPageSeo;
  localizedSeo?: Record<string, BuilderPageSeo>;
  sections: BuilderSection[];
}

export type BuilderView = Exclude<ProjectView, "wizard">;

export interface BuilderState {
  view: BuilderView;
  siteLanguages: SiteLanguages;
  activeLocale: string;
  pages: BuilderPage[];
  activePageId: string | null;
  sections: BuilderSection[];
  selectedSectionId: string | null;
  selectedBlockId: string | null;
  publishValidationMessage: string | null;
}
