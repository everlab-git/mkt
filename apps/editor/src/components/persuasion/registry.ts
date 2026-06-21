import { anchoringPattern } from "./patterns/anchoring";
import { authorityPattern } from "./patterns/authority";
import { frictionReductionPattern } from "./patterns/frictionReduction";
import { socialProofPattern } from "./patterns/socialProof";

export type PersuasionPatternName =
  | "socialProof"
  | "authority"
  | "anchoring"
  | "frictionReduction";

export interface PersuasionContext {
  reducedMotion: boolean;
}

export type PersuasionResult = {
  className?: string;
  badges?: string[];
  highlighted?: boolean;
  progressive?: boolean;
  animatedValue?: number;
};

export type PersuasionPattern = (
  input: Record<string, unknown>,
  ctx: PersuasionContext
) => PersuasionResult;

export const persuasionRegistry: Record<PersuasionPatternName, PersuasionPattern> = {
  socialProof: socialProofPattern,
  authority: authorityPattern,
  anchoring: anchoringPattern,
  frictionReduction: frictionReductionPattern
};

export function hasPersuasionPattern(value: string): value is PersuasionPatternName {
  return value in persuasionRegistry;
}
