import { describe, expect, it } from "vitest";
import { compareLoginCode, generateLoginCode, hashLoginCode } from "./code";

describe("login code", () => {
  it("gera código numérico de 6 dígitos", () => {
    const code = generateLoginCode();
    expect(code).toMatch(/^\d{6}$/);
  });

  it("hasheia e compara sem guardar texto puro", async () => {
    const code = "123456";
    const hash = hashLoginCode(code);

    expect(hash).not.toBe(code);
    expect(await compareLoginCode(code, hash)).toBe(true);
    expect(await compareLoginCode("000000", hash)).toBe(false);
  });
});
