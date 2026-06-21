import { afterEach, describe, expect, it, vi } from "vitest";
import { prefersReducedMotion } from "./reducedMotion";

describe("prefersReducedMotion", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("retorna false quando matchMedia não existe", () => {
    vi.stubGlobal("window", {});
    expect(prefersReducedMotion()).toBe(false);
  });

  it("retorna true quando o sistema pede reduce", () => {
    vi.stubGlobal("window", {
      matchMedia: vi.fn().mockReturnValue({ matches: true })
    });
    expect(prefersReducedMotion()).toBe(true);
  });
});
