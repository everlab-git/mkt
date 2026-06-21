import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getPool } from "../src/db/pool";

export default function handler(_req: VercelRequest, res: VercelResponse) {
  const pool = getPool();
  pool
    .query("select 1 as ok")
    .then(() => res.status(200).json({ ok: true, db: true }))
    .catch(() => res.status(200).json({ ok: true, db: false }));
}
