import type { AnimationPreset } from "../registry";

export const pinScrubPreset: AnimationPreset = async (element, options, ctx) => {
  if (ctx.reducedMotion) {
    element.style.transform = "none";
    element.style.opacity = "1";
    return () => {};
  }

  const { gsap } = await ctx.loadGsap();
  const timeline = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: element,
      start: String(options.start ?? "top top"),
      end: String(options.end ?? "+=125%"),
      scrub: Number(options.scrub ?? 1),
      pin: true
    }
  });

  timeline.fromTo(
    element,
    {
      scale: Number(options.fromScale ?? 0.94),
      opacity: Number(options.fromOpacity ?? 0.4)
    },
    {
      scale: Number(options.toScale ?? 1),
      opacity: Number(options.toOpacity ?? 1)
    }
  );

  return () => {
    timeline.scrollTrigger?.kill();
    timeline.kill();
    element.style.transform = "none";
    element.style.opacity = "1";
  };
};
