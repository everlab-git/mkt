export interface SiteLanguages {
  default: string;
  enabled: string[];
}

export interface LocaleContent {
  ai_generated: boolean;
  [key: string]: unknown;
}

export type LocalizedFieldMap = Record<string, string>;

export type LocalizedContentMap = Record<string, LocaleContent>;
