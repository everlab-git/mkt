import { useEffect } from "react";
import { getLenisInstance } from "./lib/lenis";
import { prefersReducedMotion } from "./lib/reducedMotion";
import {
  animationRegistry,
  hasAnimationPreset,
  type AnimationPresetContext,
  type AnimationPresetName
} from "./registry";

export interface ScrollAnimationConfig {
  name?: AnimationPresetName;
  options?: Record<string, unknown>;
  loadGsap?: AnimationPresetContext["loadGsap"];
  getLenis?: AnimationPresetContext["getLenis"];
}

function applyStaticFallback(element: HTMLElement) {
  element.style.opacity = "1";
  element.style.transform = "none";
  element.style.animation = "none";
  element.style.willChange = "auto";
}

async function defaultGsapLoader(): Promise<AnimationPresetContext["loadGsap"] extends () => Promise<infer T> ? T : never> {
  const [gsapModule, scrollTriggerModule] = await Promise.all([
    import("gsap"),
    import("gsap/ScrollTrigger")
  ]);

  gsapModule.gsap.registerPlugin(scrollTriggerModule.ScrollTrigger);

  return {
    ...gsapModule,
    ScrollTrigger: scrollTriggerModule.ScrollTrigger
  };
}

export function useScrollAnimation(
  ref: React.RefObject<HTMLElement>,
  config?: ScrollAnimationConfig
) {
  useEffect(() => {
    const element = ref.current;
    const presetName = config?.name;

    if (!element || !presetName || !hasAnimationPreset(presetName)) {
      return;
    }

    const reducedMotion = prefersReducedMotion();

    if (reducedMotion) {
      applyStaticFallback(element);
      return;
    }

    let disposed = false;
    let cleanup = () => {};

    void Promise.resolve(
      animationRegistry[presetName](element, config?.options ?? {}, {
        reducedMotion,
        loadGsap: config?.loadGsap ?? defaultGsapLoader,
        getLenis: config?.getLenis ?? getLenisInstance
      })
    )
      .then((nextCleanup) => {
        if (disposed) {
          nextCleanup();
          return;
        }

        cleanup = nextCleanup;
      })
      .catch(() => {
        if (!disposed) {
          applyStaticFallback(element);
        }
      });

    return () => {
      disposed = true;
      cleanup();
    };
  }, [config?.getLenis, config?.loadGsap, config?.name, config?.options, ref]);
}
