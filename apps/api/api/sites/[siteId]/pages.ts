import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getUserIdFromHeader, setRlsUser } from "../../../src/db/authz";
import { withTx } from "../../../src/db/tx";

function json(res: VercelResponse, status: number, body: unknown) {
  res.status(status).setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = getUserIdFromHeader(req.headers["x-user-id"]);
  if (!userId) return json(res, 401, { error: "missing_x_user_id" });

  const siteId = String(req.query.siteId ?? "").trim();
  if (!siteId) return json(res, 400, { error: "missing_site_id" });

  try {
    if (req.method === "GET") {
      const pages = await withTx(async (client) => {
        await setRlsUser(client, userId);
        const { rows } = await client.query(
          "select id, site_id, name, slug, type, status, nav, behavior, order_idx, parent_id, created_at, updated_at from pages where site_id = $1 order by order_idx asc, created_at asc",
          [siteId]
        );
        return rows;
      });
      return json(res, 200, { pages });
    }

    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const name = String(body?.name ?? "").trim();
      const slug = String(body?.slug ?? "").trim();
      const type = String(body?.type ?? "content").trim();
      if (!name || !slug) return json(res, 400, { error: "missing_name_or_slug" });

      const page = await withTx(async (client) => {
        await setRlsUser(client, userId);
        const { rows } = await client.query(
          `insert into pages
            (site_id, name, slug, type, status, nav, behavior, content, seo, order_idx, parent_id)
           values
            ($1, $2, $3, $4, 'draft', 'none', 'same', '{}'::jsonb, '{}'::jsonb, 0, null)
           returning id, site_id, name, slug, type, status, nav, behavior, order_idx, parent_id, created_at, updated_at`,
          [siteId, name, slug, type]
        );
        return rows[0];
      });
      return json(res, 201, { page });
    }

    return json(res, 405, { error: "method_not_allowed" });
  } catch {
    return json(res, 500, { error: "internal_error" });
  }
}

