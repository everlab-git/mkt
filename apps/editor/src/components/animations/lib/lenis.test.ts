// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { getLenisInstance, resetLenisForTests } from "./lenis";

describe("lenis singleton", () => {
  afterEach(() => {
    resetLenisForTests();
    vi.unstubAllGlobals();
  });

  it("retorna a mesma instância em chamadas repetidas", async () => {
    vi.stubGlobal(
      "ResizeObserver",
      class ResizeObserver {
        observe() {}
        disconnect() {}
      }
    );

    const a = await getLenisInstance();
    const b = await getLenisInstance();

    expect(a).toBe(b);
  });
});
