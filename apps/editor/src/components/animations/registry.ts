import { marqueePreset } from "./presets/marquee";
import { parallaxPreset } from "./presets/parallax";
import { pinScrubPreset } from "./presets/pinScrub";
import { revealPreset } from "./presets/reveal";
import { splitTextPreset } from "./presets/splitText";

export type AnimationPresetName =
  | "reveal"
  | "parallax"
  | "pinScrub"
  | "splitText"
  | "marquee";

export type AnimationCleanup = () => void;
export type AnimationOptions = Record<string, unknown>;
export type GsapModule = typeof import("gsap");
export interface LoadedGsap extends GsapModule {
  ScrollTrigger: typeof import("gsap/ScrollTrigger").ScrollTrigger;
}

export interface AnimationPresetContext {
  reducedMotion: boolean;
  loadGsap: () => Promise<LoadedGsap>;
  getLenis: typeof import("./lib/lenis").getLenisInstance;
}

export type AnimationPreset = (
  element: HTMLElement,
  options: AnimationOptions,
  ctx: AnimationPresetContext
) => Promise<AnimationCleanup> | AnimationCleanup;

export const animationRegistry: Record<AnimationPresetName, AnimationPreset> = {
  reveal: revealPreset,
  parallax: parallaxPreset,
  pinScrub: pinScrubPreset,
  splitText: splitTextPreset,
  marquee: marqueePreset
};

export function hasAnimationPreset(name: string): name is AnimationPresetName {
  return name in animationRegistry;
}
