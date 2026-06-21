import type { AnimationPreset } from "../registry";

export const revealPreset: AnimationPreset = async (element, options, ctx) => {
  if (ctx.reducedMotion) {
    element.style.opacity = "1";
    element.style.transform = "none";
    return () => {};
  }

  const { gsap } = await ctx.loadGsap();
  const tween = gsap.fromTo(
    element,
    { opacity: 0, y: Number(options.y ?? 24) },
    {
      opacity: 1,
      y: 0,
      duration: Number(options.duration ?? 0.8),
      ease: String(options.ease ?? "power2.out"),
      scrollTrigger: {
        trigger: element,
        start: String(options.start ?? "top 85%"),
        once: Boolean(options.once ?? true)
      }
    }
  );

  return () => {
    tween.scrollTrigger?.kill();
    tween.kill();
    element.style.opacity = "1";
    element.style.transform = "none";
  };
};
