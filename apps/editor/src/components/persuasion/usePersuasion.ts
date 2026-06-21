import { hasPersuasionPattern, persuasionRegistry, type PersuasionResult } from "./registry";

export interface PersuasionConfig {
  pattern?: string;
  options?: Record<string, unknown>;
}

export function usePersuasion(
  persuasion?: PersuasionConfig | null,
  reducedMotion = false
): PersuasionResult | null {
  if (!persuasion?.pattern || !hasPersuasionPattern(persuasion.pattern)) {
    return null;
  }

  return persuasionRegistry[persuasion.pattern](persuasion.options ?? {}, {
    reducedMotion
  });
}
