import type { AnimationPreset } from "../registry";

function restoreMarkup(
  element: HTMLElement,
  originalHtml: string,
  originalAriaLabel: string | null
) {
  element.innerHTML = originalHtml;
  if (originalAriaLabel === null) {
    element.removeAttribute("aria-label");
  } else {
    element.setAttribute("aria-label", originalAriaLabel);
  }
}

export const splitTextPreset: AnimationPreset = async (element, options, ctx) => {
  if (ctx.reducedMotion) {
    element.style.opacity = "1";
    element.style.transform = "none";
    return () => {};
  }

  const originalHtml = element.innerHTML;
  const originalAriaLabel = element.getAttribute("aria-label");
  const sourceText = element.textContent?.trim();

  if (!sourceText) {
    element.style.opacity = "1";
    return () => {};
  }

  const words = sourceText.split(/\s+/);
  const fragment = document.createDocumentFragment();
  const wordNodes: HTMLSpanElement[] = [];

  for (const [index, word] of words.entries()) {
    const outer = document.createElement("span");
    outer.style.display = "inline-block";
    outer.style.overflow = "hidden";

    const inner = document.createElement("span");
    inner.textContent = word;
    inner.style.display = "inline-block";

    outer.appendChild(inner);
    fragment.appendChild(outer);
    wordNodes.push(inner);

    if (index < words.length - 1) {
      fragment.appendChild(document.createTextNode(" "));
    }
  }

  element.innerHTML = "";
  element.setAttribute("aria-label", sourceText);
  element.appendChild(fragment);

  const { gsap } = await ctx.loadGsap();
  const tween = gsap.fromTo(
    wordNodes,
    { opacity: 0, yPercent: Number(options.fromYPercent ?? 110) },
    {
      opacity: 1,
      yPercent: 0,
      duration: Number(options.duration ?? 0.6),
      ease: String(options.ease ?? "power3.out"),
      stagger: Number(options.stagger ?? 0.06),
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
    restoreMarkup(element, originalHtml, originalAriaLabel);
  };
};
