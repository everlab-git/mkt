import { describe, expect, it } from "vitest";
import { canInviteExistingUserOnly, normalizeMemberRole } from "./members";

describe("project membership helpers", () => {
  it("aceita apenas owner e member", () => {
    expect(normalizeMemberRole("owner")).toBe("owner");
    expect(normalizeMemberRole("member")).toBe("member");
  });

  it("exige que o convite só siga para usuário existente", () => {
    expect(canInviteExistingUserOnly(true)).toBe(true);
    expect(canInviteExistingUserOnly(false)).toBe(false);
  });
});
