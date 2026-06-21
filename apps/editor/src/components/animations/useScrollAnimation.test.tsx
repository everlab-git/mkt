// @vitest-environment jsdom

import { render } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useScrollAnimation } from "./useScrollAnimation";

function Demo() {
  const ref = useRef<HTMLDivElement>(null);

  useScrollAnimation(ref, { name: "reveal", options: {} });

  return <div ref={ref}>demo</div>;
}

function DemoWithLoader({
  loadGsap
}: {
  loadGsap: NonNullable<Parameters<typeof useScrollAnimation>[1]>["loadGsap"];
}) {
  const ref = useRef<HTMLDivElement>(null);

  useScrollAnimation(ref, { name: "reveal", options: {}, loadGsap });

  return <div ref={ref}>demo</div>;
}

describe("useScrollAnimation", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("não oculta conteúdo quando reduced motion está ativo", async () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      })
    );

    const { findByText } = render(<Demo />);

    expect(await findByText("demo")).toBeTruthy();
  });

  it("faz fallback estático sem importar GSAP quando reduced motion está ativo", () => {
    const gsapLoader = vi.fn();

    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      })
    );

    render(<DemoWithLoader loadGsap={gsapLoader} />);

    expect(gsapLoader).not.toHaveBeenCalled();
  });
});
