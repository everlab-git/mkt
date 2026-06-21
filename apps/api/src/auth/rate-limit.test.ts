import { describe, expect, it } from "vitest";
import { isWithinRequestCodeLimit, isWithinVerifyLimit } from "./rate-limit";

describe("rate-limit helpers", () => {
  it("bloqueia mais de 3 pedidos por janela", () => {
    expect(isWithinRequestCodeLimit(3)).toBe(true);
    expect(isWithinRequestCodeLimit(4)).toBe(false);
  });

  it("bloqueia mais de 5 tentativas de verificação", () => {
    expect(isWithinVerifyLimit(5)).toBe(true);
    expect(isWithinVerifyLimit(6)).toBe(false);
  });
});
