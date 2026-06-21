import type { PoolClient } from "pg";

export function getUserIdFromHeader(headerVal: string | string[] | undefined): string | null {
  if (!headerVal) return null;
  if (Array.isArray(headerVal)) return headerVal[0] ?? null;
  return headerVal;
}

export async function setRlsUser(client: PoolClient, userId: string) {
  // RLS depende desta variável por transação (SET LOCAL)
  await client.query("SELECT set_config('app.user_id', $1, true)", [userId]);
}

