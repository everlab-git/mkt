import type { AnimationPreset } from "../registry";

export const parallaxPreset: AnimationPreset = async (element, options, ctx) => {
  if (ctx.reducedMotion) {
    element.style.transform = "none";
    return () => {};
  }

  const { gsap } = await ctx.loadGsap();
  const tween = gsap.fromTo(
    element,
    { yPercent: Number(options.fromYPercent ?? -12) },
    {
      yPercent: Number(options.toYPercent ?? 12),
      ease: "none",
      scrollTrigger: {
        trigger: element,
        start: String(options.start ?? "top bottom"),
        end: String(options.end ?? "bottom top"),
        scrub: Number(options.scrub ?? 0.6)
      }
    }
  );

  return () => {
    tween.scrollTrigger?.kill();
    tween.kill();
    element.style.transform = "none";
  };
};
