import type { PersuasionPattern } from "../registry";

function normalizeNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
}

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export const socialProofPattern: PersuasionPattern = (input, ctx) => {
  const normalizedValue = normalizeNumber(input.value);
  const label = normalizeString(input.label);
  const suffix = normalizeString(input.suffix);

  const badge =
    normalizedValue === undefined || label.length === 0
      ? undefined
      : `${normalizedValue}${suffix}${label ? ` ${label}` : ""}`;

  return {
    className: "persuasion-social-proof",
    animatedValue: ctx.reducedMotion ? undefined : normalizedValue,
    badges: badge ? [badge] : []
  };
};
