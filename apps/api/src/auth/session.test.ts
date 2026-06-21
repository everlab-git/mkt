import { describe, expect, it } from "vitest";
import { createSessionToken, hashSessionToken, isSessionExpired } from "./session";

describe("session token", () => {
  it("gera token opaco e hasheia antes de persistir", () => {
    const token = createSessionToken();
    const hash = hashSessionToken(token);

    expect(token).not.toBe(hash);
    expect(token.length).toBeGreaterThan(20);
  });

  it("reconhece sessão expirada", () => {
    expect(isSessionExpired(new Date("2020-01-01T00:00:00.000Z"))).toBe(true);
  });
});
