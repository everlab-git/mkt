import type { PersuasionPattern } from "../registry";

function normalizeRecommended(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value === "recommended" || value === "true";
  }

  return false;
}

export const anchoringPattern: PersuasionPattern = (input) => ({
  className: "persuasion-anchoring",
  highlighted: normalizeRecommended(input.recommended ?? input.variant)
});
