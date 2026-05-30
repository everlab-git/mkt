import { serve } from "@hono/node-server";
import { Hono } from "hono";

const app = new Hono();

app.get("/health", (c) => c.json({ ok: true }));

app.get("/", (c) =>
  c.json({
    name: "Freya API",
    status: "scaffold",
    docs: "TODO"
  })
);

serve(
  {
    fetch: app.fetch,
    port: Number(process.env.PORT ?? 8787)
  },
  (info) => {
    // eslint-disable-next-line no-console
    console.log(`API listening on http://localhost:${info.port}`);
  }
);

