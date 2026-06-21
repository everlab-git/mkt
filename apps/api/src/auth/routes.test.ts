import { beforeEach, describe, expect, it, vi } from "vitest";
import { hashLoginCode } from "./code";

const queryMock = vi.fn();
const sendLoginCodeEmailMock = vi.fn().mockResolvedValue(undefined);

vi.mock("../db/client", () => ({
  getDbPool: vi.fn(() => ({
    query: queryMock
  }))
}));

vi.mock("./email", () => ({
  sendLoginCodeEmail: sendLoginCodeEmailMock
}));

describe("auth HTTP contract", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("expõe POST /auth/request-code sem enumerar usuário inexistente", async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ count: 0 }] })
      .mockResolvedValueOnce({ rows: [] });

    const { app } = await import("../index");
    const response = await app.request("/auth/request-code", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "  RICK@example.com  " })
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      message: "Se o email existir, um código foi enviado."
    });
    expect(queryMock).toHaveBeenNthCalledWith(
      1,
      "select count(*)::int as count from login_codes where created_at > now() - interval '15 minutes' and email = $1",
      ["rick@example.com"]
    );
    expect(queryMock).toHaveBeenNthCalledWith(
      2,
      "select id from users where lower(email) = $1 limit 1",
      ["rick@example.com"]
    );
    expect(sendLoginCodeEmailMock).not.toHaveBeenCalled();
  });

  it("envia código quando o usuário existe e respeita o email normalizado", async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ count: 0 }] })
      .mockResolvedValueOnce({ rows: [{ id: "user-123" }] })
      .mockResolvedValueOnce({ rowCount: 1, rows: [] });

    const { app } = await import("../index");
    const response = await app.request("/auth/request-code", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "Rick@Example.com" })
    });

    expect(response.status).toBe(200);
    expect(queryMock).toHaveBeenNthCalledWith(
      3,
      "insert into login_codes (email, code_hash, expires_at, requested_ip_hash) values ($1, $2, now() + interval '10 minutes', $3)",
      ["rick@example.com", expect.any(String), null]
    );
    expect(queryMock.mock.calls[2]?.[1]?.[1]).not.toBe("123456");
    expect(sendLoginCodeEmailMock).toHaveBeenCalledWith("rick@example.com", expect.any(String));
  });

  it("aplica rate limit básico em POST /auth/request-code", async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ count: 4 }] });

    const { app } = await import("../index");
    const response = await app.request("/auth/request-code", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "rick@example.com" })
    });

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "rate_limited"
    });
    expect(sendLoginCodeEmailMock).not.toHaveBeenCalled();
  });

  it("incrementa attempts ao falhar em POST /auth/verify-code", async () => {
    queryMock
      .mockResolvedValueOnce({
        rows: [
          {
            id: "code-123",
            user_id: "user-123",
            code_hash: hashLoginCode("654321"),
            attempts: 0,
            used_at: null,
            expires_at: "2999-01-01T00:00:00.000Z"
          }
        ]
      })
      .mockResolvedValueOnce({ rowCount: 1, rows: [] });

    const { app } = await import("../index");
    const response = await app.request("/auth/verify-code", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "rick@example.com", code: "123456" })
    });

    expect(response.status).toBe(401);
    expect(queryMock).toHaveBeenNthCalledWith(
      2,
      "update login_codes set attempts = attempts + 1 where id = $1",
      ["code-123"]
    );
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "invalid_code"
    });
  });

  it("cria sessão e seta cookie httpOnly em POST /auth/verify-code", async () => {
    queryMock
      .mockResolvedValueOnce({
        rows: [
          {
            id: "code-123",
            user_id: "user-123",
            code_hash: hashLoginCode("123456"),
            attempts: 0,
            used_at: null,
            expires_at: "2999-01-01T00:00:00.000Z"
          }
        ]
      })
      .mockResolvedValueOnce({ rowCount: 1, rows: [] })
      .mockResolvedValueOnce({ rowCount: 1, rows: [] });

    const { app } = await import("../index");
    const response = await app.request("/auth/verify-code", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "rick@example.com", code: "123456" })
    });

    expect(response.status).toBe(200);
    expect(queryMock).toHaveBeenNthCalledWith(
      2,
      "update login_codes set used_at = now() where id = $1",
      ["code-123"]
    );
    expect(queryMock).toHaveBeenNthCalledWith(
      3,
      "insert into sessions (user_id, token_hash, expires_at, created_ip_hash) values ($1, $2, now() + interval '30 days', $3)",
      ["user-123", expect.any(String), null]
    );
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(response.headers.get("set-cookie")).toContain("freya_session=");
    await expect(response.json()).resolves.toEqual({ ok: true });
  });

  it("expõe POST /auth/logout e limpa o cookie", async () => {
    const { app } = await import("../index");
    const response = await app.request("/auth/logout", {
      method: "POST"
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("freya_session=;");
    await expect(response.json()).resolves.toEqual({ ok: true });
  });

  it("expõe GET /auth/session e responde 401 sem sessão", async () => {
    const { app } = await import("../index");
    const response = await app.request("/auth/session");

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ ok: false });
  });

  it("protege GET /api/sites", async () => {
    const { app } = await import("../index");
    const response = await app.request("/api/sites");

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "unauthorized"
    });
  });
});
