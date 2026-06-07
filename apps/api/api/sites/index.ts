import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getUserIdFromHeader, setRlsUser } from "../../src/db/authz";
import { withTx } from "../../src/db/tx";

function json(res: VercelResponse, status: number, body: unknown) {
  res.status(status).setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = getUserIdFromHeader(req.headers["x-user-id"]);
  if (!userId) return json(res, 401, { error: "missing_x_user_id" });

  try {
    if (req.method === "GET") {
      const sites = await withTx(async (client) => {
        await setRlsUser(client, userId);
        const { rows } = await client.query(
          "select id, name, slug, created_at, updated_at from sites order by created_at desc"
        );
        return rows;
      });
      return json(res, 200, { sites });
    }

    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const name = String(body?.name ?? "").trim();
      const slug = String(body?.slug ?? "").trim();
      if (!name || !slug) return json(res, 400, { error: "missing_name_or_slug" });

      const site = await withTx(async (client) => {
        await setRlsUser(client, userId);
        const { rows } = await client.query(
          "insert into sites (owner_id, name, slug, config) values ($1, $2, $3, '{}'::jsonb) returning id, name, slug, created_at, updated_at",
          [userId, name, slug]
        );
        return rows[0];
      });
      return json(res, 201, { site });
    }

    return json(res, 405, { error: "method_not_allowed" });
  } catch {
    return json(res, 500, { error: "internal_error" });
  }
}

