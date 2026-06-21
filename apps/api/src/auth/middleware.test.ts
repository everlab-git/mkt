import type { Context } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { hashSessionToken } from "./session";

const getCookieMock = vi.fn();
const queryMock = vi.fn();

vi.mock("hono/cookie", () => ({
  getCookie: getCookieMock
}));

vi.mock("../db/client", () => ({
  getDbPool: vi.fn(() => ({
    query: queryMock
  }))
}));

describe("authSessionMiddleware", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("define authUserId como null quando o cookie não existe", async () => {
    getCookieMock.mockReturnValue(undefined);

    const { authSessionMiddleware } = await import("./middleware");
    const set = vi.fn();
    const next = vi.fn(async () => undefined);

    await authSessionMiddleware({ set } as unknown as Context, next);

    expect(set).toHaveBeenCalledWith("authUserId", null);
    expect(queryMock).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("carrega authUserId a partir de uma sessão válida", async () => {
    getCookieMock.mockReturnValue("session-token");
    queryMock
      .mockResolvedValueOnce({
        rows: [
          {
            user_id: "user-123",
            expires_at: "2999-01-01T00:00:00.000Z"
          }
        ]
      })
      .mockResolvedValueOnce({
        rowCount: 1,
        rows: []
      });

    const { authSessionMiddleware } = await import("./middleware");
    const set = vi.fn();
    const next = vi.fn(async () => undefined);

    await authSessionMiddleware({ set } as unknown as Context, next);

    expect(queryMock).toHaveBeenCalledWith(
      "select user_id, expires_at from sessions where token_hash = $1 limit 1",
      [hashSessionToken("session-token")]
    );
    expect(queryMock).toHaveBeenCalledWith(
      "update sessions set last_seen_at = now(), expires_at = now() + interval '30 days' where token_hash = $1",
      [hashSessionToken("session-token")]
    );
    expect(set).toHaveBeenCalledWith("authUserId", "user-123");
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("limpa authUserId quando a sessão está expirada", async () => {
    getCookieMock.mockReturnValue("expired-token");
    queryMock.mockResolvedValue({
      rows: [
        {
          user_id: "user-123",
          expires_at: "2020-01-01T00:00:00.000Z"
        }
      ]
    });

    const { authSessionMiddleware } = await import("./middleware");
    const set = vi.fn();
    const next = vi.fn(async () => undefined);

    await authSessionMiddleware({ set } as unknown as Context, next);

    expect(set).toHaveBeenCalledWith("authUserId", null);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
