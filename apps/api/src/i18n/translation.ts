export interface TranslationJobInput {
  enabledLocales: string[];
  sourceLocale: string;
  targetLocale: string;
  triggeredByUser: boolean;
}

export interface TranslationJob {
  sourceLocale: string;
  targetLocale: string;
}

export function buildTranslationJob(input: TranslationJobInput): TranslationJob | null {
  if (!input.triggeredByUser) {
    return null;
  }

  if (!input.enabledLocales.includes(input.targetLocale)) {
    return null;
  }

  return {
    sourceLocale: input.sourceLocale,
    targetLocale: input.targetLocale
  };
}
