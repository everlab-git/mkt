import type { PersuasionPattern } from "../registry";

function normalizeBadges(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

export const authorityPattern: PersuasionPattern = (input) => ({
  className: "persuasion-authority",
  badges: normalizeBadges(input.badges),
  highlighted: true
});
