import type { Context, Next } from "hono";
import { getCookie } from "hono/cookie";
import { getDbPool } from "../db/client";
import { SESSION_COOKIE_NAME } from "./cookies";
import { hashSessionToken, isSessionExpired } from "./session";

declare module "hono" {
  interface ContextVariableMap {
    authUserId: string | null;
  }
}

type SessionLookupRow = {
  expires_at: Date | string;
  user_id: string;
};

export async function authSessionMiddleware(c: Context, next: Next): Promise<void> {
  const token = getCookie(c, SESSION_COOKIE_NAME);

  if (!token) {
    c.set("authUserId", null);
    await next();
    return;
  }

  const pool = getDbPool();
  const tokenHash = hashSessionToken(token);
  const { rows } = await pool.query<SessionLookupRow>(
    "select user_id, expires_at from sessions where token_hash = $1 limit 1",
    [tokenHash]
  );

  const session = rows[0];

  if (!session || isSessionExpired(new Date(session.expires_at))) {
    c.set("authUserId", null);
    await next();
    return;
  }

  await pool.query(
    "update sessions set last_seen_at = now(), expires_at = now() + interval '30 days' where token_hash = $1",
    [tokenHash]
  );
  c.set("authUserId", String(session.user_id));
  await next();
}
