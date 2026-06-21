import { beforeEach, describe, expect, it, vi } from "vitest";

const poolInstance = {
  query: vi.fn()
};

const PoolMock = vi.fn(() => poolInstance);

vi.mock("pg", () => ({
  Pool: PoolMock
}));

describe("getDbPool", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete process.env.DATABASE_URL;
  });

  it("falha quando DATABASE_URL não está configurada", async () => {
    const { getDbPool } = await import("./client");

    expect(() => getDbPool()).toThrow("DATABASE_URL is required");
    expect(PoolMock).not.toHaveBeenCalled();
  });

  it("cria o pool uma vez e reaproveita nas próximas chamadas", async () => {
    process.env.DATABASE_URL = "postgres://freya:test@localhost:5432/freya";

    const { getDbPool } = await import("./client");

    const firstPool = getDbPool();
    const secondPool = getDbPool();

    expect(PoolMock).toHaveBeenCalledTimes(1);
    expect(PoolMock).toHaveBeenCalledWith({
      connectionString: "postgres://freya:test@localhost:5432/freya"
    });
    expect(secondPool).toBe(firstPool);
  });
});
