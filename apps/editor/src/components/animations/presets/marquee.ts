import type { AnimationPreset } from "../registry";

export const marqueePreset: AnimationPreset = async (element, options, ctx) => {
  if (ctx.reducedMotion) {
    element.style.transform = "none";
    return () => {};
  }

  const { gsap } = await ctx.loadGsap();
  const timeline = gsap.timeline({
    repeat: -1,
    defaults: {
      ease: "none"
    }
  });

  timeline.fromTo(
    element,
    { xPercent: Number(options.fromXPercent ?? 0) },
    {
      xPercent: Number(options.toXPercent ?? -50),
      duration: Number(options.duration ?? 12)
    }
  );

  return () => {
    timeline.kill();
    element.style.transform = "none";
  };
};
