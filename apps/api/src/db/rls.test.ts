import type { PoolClient } from "pg";
import { describe, expect, it, vi } from "vitest";
import { applyRlsUser } from "./rls";

describe("applyRlsUser", () => {
  it("aplica app.user_id na transação do Postgres", async () => {
    const query = vi.fn().mockResolvedValue({ rows: [] });
    const client = { query } as unknown as PoolClient;

    await applyRlsUser(client, "user-123");

    expect(query).toHaveBeenCalledWith("select set_config('app.user_id', $1, true)", [
      "user-123"
    ]);
  });
});
