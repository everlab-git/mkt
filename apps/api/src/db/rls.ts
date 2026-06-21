import type { PoolClient } from "pg";

export async function applyRlsUser(client: PoolClient, userId: string): Promise<void> {
  await client.query("select set_config('app.user_id', $1, true)", [userId]);
}
