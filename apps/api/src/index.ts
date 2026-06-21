import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { compareLoginCode, generateLoginCode, hashLoginCode } from "./auth/code";
import { buildSessionCookie, clearSessionCookie } from "./auth/cookies";
import { sendLoginCodeEmail } from "./auth/email";
import { authSessionMiddleware } from "./auth/middleware";
import { isWithinRequestCodeLimit, isWithinVerifyLimit } from "./auth/rate-limit";
import { createSessionToken, hashSessionToken, isSessionExpired } from "./auth/session";
import { getDbPool } from "./db/client";
import { collectBlockTypes, normalizePageContent, type PageContent } from "./domain/content";
import {
  migrateContentToI18n,
  type ContentBlockWithI18n,
  type ContentSectionWithI18n,
  type LocaleContent,
  type PageContentWithI18n
} from "./i18n/content";
import { normalizeSiteLanguages, type SiteLanguages } from "./i18n/site-languages";
import { normalizeLocalizedSlug, type LocalizedSlug } from "./i18n/slug";
import { buildTranslationJob } from "./i18n/translation";
import { buildPagePayload } from "./pages/creation";
import { canPublishPage, normalizeSeoPayload } from "./pages/seo";
import { suggestVisualPattern } from "./pages/visual-pattern";
import { normalizeWizardPayload } from "./projects/creation";
import { canInviteExistingUserOnly, normalizeMemberRole } from "./projects/members";

const REQUEST_CODE_RESPONSE = "Se o email existir, um código foi enviado.";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

type CountRow = {
  count: number | string;
};

type UserLookupRow = {
  id: string;
};

type LoginCodeLookupRow = {
  attempts: number;
  code_hash: string;
  expires_at: Date | string;
  id: string;
  used_at: Date | string | null;
  user_id: string | null;
};

type ExistingUserRow = {
  email: string;
  id: string;
  name: string | null;
};

type PageStatus = "draft" | "published";

type OrderLookupRow = {
  next_order: number | string | null;
};

type PageLookupRow = {
  id: string;
  site_id?: string;
  name?: string;
  slug: string;
  status?: string;
  content: unknown;
  seo: Record<string, unknown> | null;
  block_types?: string[] | null;
  order_idx?: number | string | null;
};

type VisualPatternLookupRow = {
  content: unknown;
};

type SiteLanguagesLookupRow = {
  languages: unknown;
};

type SiteDefaultLocaleLookupRow = {
  default_locale: string | null;
};

type PageSlugLookupRow = {
  default_locale: string | null;
  id: string;
  slug: string;
};

type PageTranslationLookupRow = {
  content: unknown;
  id: string;
  languages: unknown;
};

function normalizeEmail(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizePageStatus(value: unknown): PageStatus | null {
  return value === "published" || value === "draft" ? value : null;
}

function normalizePageCreationStrategy(value: unknown): "template" | "duplicate" | "blank" {
  return value === "template" || value === "duplicate" || value === "blank" ? value : "blank";
}

function normalizePageTemplateKey(value: unknown) {
  return value === "institutional" ||
    value === "services" ||
    value === "cases" ||
    value === "contact"
    ? value
    : undefined;
}

function hashValue(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function getRequestIpHash(headerValue: string | undefined): string | null {
  const ip = headerValue?.split(",")[0]?.trim();

  return ip ? hashValue(ip) : null;
}

function createPagePlaceholder(title: string, description: string): string {
  return JSON.stringify({
    sections: [
      {
        id: slugify(title) || "section",
        type: "hero",
        content: {
          title,
          description
        }
      }
    ]
  });
}

function buildSuggestedSections(pattern: string[]): PageContent["sections"] {
  return pattern.map((sectionType, index) => ({
    id: `${sectionType}-${index + 1}`,
    type: sectionType,
    animationPreset: null,
    props: {},
    blocks: []
  }));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function parseStoredSlugValue(value: string): string | Record<string, unknown> {
  const raw = String(value ?? "").trim();

  if (!raw.startsWith("{")) {
    return raw;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return isRecord(parsed) ? parsed : raw;
  } catch {
    return raw;
  }
}

function normalizeSlugMapForRequest(
  value: unknown,
  defaultLocale: string,
  fallbackSlug: string
): LocalizedSlug {
  const normalizedInput = isRecord(value) || typeof value === "string" ? value : fallbackSlug;
  const localizedSlug = normalizeLocalizedSlug(normalizedInput, defaultLocale);
  const entries = Object.entries(localizedSlug)
    .map(([locale, slug]) => [locale, slugify(String(slug))] as const)
    .filter(([, slug]) => slug.length > 0);

  if (!entries.some(([locale]) => locale === defaultLocale)) {
    entries.unshift([defaultLocale, fallbackSlug]);
  }

  const result = Object.fromEntries(entries);
  result[defaultLocale] = result[defaultLocale] || fallbackSlug;

  return result;
}

function findLocalizedSlugConflict(input: {
  defaultLocale: string;
  excludePageId?: string;
  existingPages: PageSlugLookupRow[];
  requestedSlug: LocalizedSlug;
}) {
  for (const page of input.existingPages) {
    if (page.id === input.excludePageId) {
      continue;
    }

    const existingSlug = normalizeSlugMapForRequest(
      parseStoredSlugValue(page.slug),
      page.default_locale ?? input.defaultLocale,
      slugify(page.slug) || "page"
    );

    for (const [locale, slug] of Object.entries(input.requestedSlug)) {
      if (slug && existingSlug[locale] === slug) {
        return { locale, slug };
      }
    }
  }

  return null;
}

function normalizeSiteLanguagesFromValue(value: unknown): SiteLanguages {
  return normalizeSiteLanguages(isRecord(value) ? (value as Partial<SiteLanguages>) : undefined);
}

function cloneLocaleContentForTarget(value: LocaleContent): LocaleContent {
  return {
    ...cloneJson(value),
    ai_generated: true
  };
}

function translateContentByLocale(
  content: unknown,
  sourceLocale: string,
  targetLocale: string
): PageContentWithI18n {
  const normalizedContent = migrateContentToI18n(
    normalizePageContent(content) as unknown as PageContentWithI18n,
    sourceLocale
  );

  return {
    ...normalizedContent,
    sections: normalizedContent.sections.map((section: ContentSectionWithI18n) => ({
      ...section,
      blocks: section.blocks.map((block: ContentBlockWithI18n) => {
        const sourceContent = isRecord(block.i18n?.[sourceLocale])
          ? (block.i18n?.[sourceLocale] as LocaleContent)
          : null;

        if (!sourceContent) {
          return block;
        }

        return {
          ...block,
          i18n: {
            ...(block.i18n ?? {}),
            [targetLocale]: cloneLocaleContentForTarget(sourceContent)
          }
        };
      })
    }))
  };
}

async function getAccessibleSiteLanguages(siteId: string, authUserId: string) {
  const pool = getDbPool();
  const result = await pool.query<SiteLanguagesLookupRow>(
    "select s.languages from sites s where s.id = $1 and exists (select 1 from project_members access_pm where access_pm.site_id = s.id and access_pm.user_id = $2) limit 1",
    [siteId, authUserId]
  );

  return result.rows[0] ? normalizeSiteLanguagesFromValue(result.rows[0].languages) : null;
}

export const app = new Hono();

app.use("*", authSessionMiddleware);

app.get("/health", (c) => c.json({ ok: true }));

app.get("/", (c) =>
  c.json({
    name: "Freya API",
    status: "scaffold",
    docs: "TODO"
  })
);

app.post("/auth/request-code", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const email = normalizeEmail(body.email);

  if (!email) {
    return c.json({
      ok: true,
      message: REQUEST_CODE_RESPONSE
    });
  }

  const pool = getDbPool();
  const requestIpHash = getRequestIpHash(c.req.header("x-forwarded-for"));
  const countParams = requestIpHash ? [email, requestIpHash] : [email];
  const countQuery = requestIpHash
    ? "select count(*)::int as count from login_codes where created_at > now() - interval '15 minutes' and (email = $1 or requested_ip_hash = $2)"
    : "select count(*)::int as count from login_codes where created_at > now() - interval '15 minutes' and email = $1";
  const recentCountResult = await pool.query<CountRow>(countQuery, countParams);
  const recentCount = Number(recentCountResult.rows[0]?.count ?? 0);

  if (!isWithinRequestCodeLimit(recentCount)) {
    return c.json({ ok: false, error: "rate_limited" }, 429);
  }

  const userResult = await pool.query<UserLookupRow>(
    "select id from users where lower(email) = $1 limit 1",
    [email]
  );
  const user = userResult.rows[0];

  if (user) {
    const code = generateLoginCode();

    await pool.query(
      "insert into login_codes (email, code_hash, expires_at, requested_ip_hash) values ($1, $2, now() + interval '10 minutes', $3)",
      [email, hashLoginCode(code), requestIpHash]
    );
    await sendLoginCodeEmail(email, code);
  }

  return c.json({
    ok: true,
    message: REQUEST_CODE_RESPONSE
  });
});

app.post("/auth/verify-code", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const email = normalizeEmail(body.email);
  const code = String(body.code ?? "").trim();

  if (!email || !code) {
    return c.json({ ok: false, error: "invalid_request" }, 400);
  }

  const pool = getDbPool();
  const requestIpHash = getRequestIpHash(c.req.header("x-forwarded-for"));
  const loginCodeResult = await pool.query<LoginCodeLookupRow>(
    "select lc.id, lc.code_hash, lc.expires_at, lc.used_at, lc.attempts, u.id as user_id from login_codes lc left join users u on lower(u.email) = lc.email where lc.email = $1 order by lc.created_at desc limit 1",
    [email]
  );
  const loginCode = loginCodeResult.rows[0];

  if (!loginCode || !loginCode.user_id) {
    return c.json({ ok: false, error: "invalid_code" }, 401);
  }

  if (!isWithinVerifyLimit(loginCode.attempts + 1)) {
    return c.json({ ok: false, error: "rate_limited" }, 429);
  }

  if (loginCode.used_at || isSessionExpired(new Date(loginCode.expires_at))) {
    return c.json({ ok: false, error: "invalid_code" }, 401);
  }

  const isValidCode = await compareLoginCode(code, loginCode.code_hash);

  if (!isValidCode) {
    await pool.query("update login_codes set attempts = attempts + 1 where id = $1", [loginCode.id]);
    return c.json({ ok: false, error: "invalid_code" }, 401);
  }

  await pool.query("update login_codes set used_at = now() where id = $1", [loginCode.id]);

  const sessionToken = createSessionToken();
  await pool.query(
    "insert into sessions (user_id, token_hash, expires_at, created_ip_hash) values ($1, $2, now() + interval '30 days', $3)",
    [loginCode.user_id, hashSessionToken(sessionToken), requestIpHash]
  );

  c.header(
    "Set-Cookie",
    buildSessionCookie(sessionToken, SESSION_MAX_AGE_SECONDS, process.env.NODE_ENV === "production")
  );
  return c.json({ ok: true });
});

app.post("/auth/logout", (c) => {
  c.header("Set-Cookie", clearSessionCookie(process.env.NODE_ENV === "production"));
  return c.json({ ok: true });
});

app.get("/auth/session", (c) => {
  const authUserId = c.get("authUserId");

  if (!authUserId) {
    return c.json({ ok: false }, 401);
  }

  return c.json({ ok: true, userId: authUserId });
});

app.get("/api/sites", (c) => {
  const authUserId = c.get("authUserId");

  if (!authUserId) {
    return c.json({ ok: false, error: "unauthorized" }, 401);
  }

  return c.json({ ok: true, sites: [] });
});

app.get("/api/projects", async (c) => {
  const authUserId = c.get("authUserId");

  if (!authUserId) {
    return c.json({ ok: false, error: "unauthorized" }, 401);
  }

  const pool = getDbPool();
  const { rows } = await pool.query(
    "select s.id, s.name, s.slug, s.logo_url, s.goal from sites s join project_members pm on pm.site_id = s.id where pm.user_id = $1 order by s.created_at desc",
    [authUserId]
  );

  return c.json({ ok: true, projects: rows });
});

app.post("/api/projects", async (c) => {
  const authUserId = c.get("authUserId");

  if (!authUserId) {
    return c.json({ ok: false, error: "unauthorized" }, 401);
  }

  const body = normalizeWizardPayload(await c.req.json().catch(() => ({})));
  const pool = getDbPool();
  const slug = slugify(body.name);
  const siteResult = await pool.query(
    "insert into sites (owner_id, name, slug, goal, logo_url, theme, config) values ($1, $2, $3, $4, $5, $6, $7) returning id, name, slug",
    [authUserId, body.name, slug, body.goal, body.logoUrl, body.theme, { ai: body.ai }]
  );
  const site = siteResult.rows[0];

  await pool.query(
    "insert into project_members (site_id, user_id, role, accepted_at) values ($1, $2, 'owner', now()) on conflict do nothing",
    [site.id, authUserId]
  );

  if (body.startingPoint === "institutional") {
    const heroPlaceholder = createPagePlaceholder(
      "Institucional",
      "Apresente a proposta do projeto com uma mensagem clara e objetiva."
    );
    const servicesPlaceholder = createPagePlaceholder(
      "Serviços",
      "Liste os principais serviços ou entregas com descrições curtas."
    );
    const casesPlaceholder = createPagePlaceholder(
      "Cases",
      "Mostre resultados, depoimentos ou exemplos de trabalhos anteriores."
    );
    const contactPlaceholder = createPagePlaceholder(
      "Contato",
      "Adicione canais de contato, horários e um convite para conversar."
    );

    await pool.query(
      "insert into pages (site_id, name, slug, type, status, content, seo, order_idx) values ($1, 'Institucional', 'institucional', 'page', 'draft', $2::jsonb, '{}'::jsonb, 0), ($1, 'Serviços', 'servicos', 'page', 'draft', $3::jsonb, '{}'::jsonb, 1), ($1, 'Cases', 'cases', 'page', 'draft', $4::jsonb, '{}'::jsonb, 2), ($1, 'Contato', 'contato', 'page', 'draft', $5::jsonb, '{}'::jsonb, 3)",
      [site.id, heroPlaceholder, servicesPlaceholder, casesPlaceholder, contactPlaceholder]
    );
  }

  return c.json({ ok: true, project: site }, 201);
});

app.get("/api/projects/:siteId/languages", async (c) => {
  const authUserId = c.get("authUserId");

  if (!authUserId) {
    return c.json({ ok: false, error: "unauthorized" }, 401);
  }

  const siteId = c.req.param("siteId");
  const languages = await getAccessibleSiteLanguages(siteId, authUserId);

  if (!languages) {
    return c.json({ ok: false, error: "site_not_found" }, 404);
  }

  return c.json({ ok: true, languages });
});

app.post("/api/projects/:siteId/languages", async (c) => {
  const authUserId = c.get("authUserId");

  if (!authUserId) {
    return c.json({ ok: false, error: "unauthorized" }, 401);
  }

  const siteId = c.req.param("siteId");
  const body = await c.req.json().catch(() => ({}));
  const locale = String(body.locale ?? "").trim();

  if (!locale) {
    return c.json({ ok: false, error: "invalid_request", message: "Informe o locale a ser habilitado." }, 400);
  }

  const currentLanguages = await getAccessibleSiteLanguages(siteId, authUserId);

  if (!currentLanguages) {
    return c.json({ ok: false, error: "site_not_found" }, 404);
  }

  const nextLanguages = normalizeSiteLanguages({
    default: currentLanguages.default,
    enabled: [...currentLanguages.enabled, locale]
  });
  const pool = getDbPool();
  const result = await pool.query<SiteLanguagesLookupRow>(
    "update sites s set languages = $2::jsonb, updated_at = now() where s.id = $1 and exists (select 1 from project_members access_pm where access_pm.site_id = s.id and access_pm.user_id = $3) returning s.languages",
    [siteId, JSON.stringify(nextLanguages), authUserId]
  );
  const languages = result.rows[0]
    ? normalizeSiteLanguagesFromValue(result.rows[0].languages)
    : nextLanguages;

  return c.json({ ok: true, languages });
});

app.get("/api/projects/:siteId/pages", async (c) => {
  const authUserId = c.get("authUserId");

  if (!authUserId) {
    return c.json({ ok: false, error: "unauthorized" }, 401);
  }

  const siteId = c.req.param("siteId");
  const pool = getDbPool();
  const { rows } = await pool.query(
    "select p.id, p.site_id, p.name, p.slug, p.status, p.content, p.seo, p.block_types, p.order_idx from pages p where p.site_id = $1 and exists (select 1 from project_members access_pm where access_pm.site_id = p.site_id and access_pm.user_id = $2) order by p.order_idx asc, p.created_at asc",
    [siteId, authUserId]
  );

  return c.json({ ok: true, pages: rows });
});

app.post("/api/projects/:siteId/pages", async (c) => {
  const authUserId = c.get("authUserId");

  if (!authUserId) {
    return c.json({ ok: false, error: "unauthorized" }, 401);
  }

  const siteId = c.req.param("siteId");
  const body = await c.req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();

  if (!name) {
    return c.json({ ok: false, error: "invalid_request", message: "Informe o nome da página." }, 400);
  }

  const strategy = normalizePageCreationStrategy(body.strategy);
  const pool = getDbPool();
  const siteLanguages = await getAccessibleSiteLanguages(siteId, authUserId);

  if (!siteLanguages) {
    return c.json({ ok: false, error: "site_not_found" }, 404);
  }

  const fallbackSlug = slugify(name) || "page";
  const localizedSlug = normalizeSlugMapForRequest(body.slug ?? name, siteLanguages.default, fallbackSlug);
  const slug = localizedSlug[siteLanguages.default] ?? fallbackSlug;
  const existingSlugResult = await pool.query<PageSlugLookupRow>(
    "select p.id, p.slug, s.languages ->> 'default' as default_locale from pages p join sites s on s.id = p.site_id where p.site_id = $1 and exists (select 1 from project_members access_pm where access_pm.site_id = p.site_id and access_pm.user_id = $2)",
    [siteId, authUserId]
  );
  const slugConflict = findLocalizedSlugConflict({
    defaultLocale: siteLanguages.default,
    existingPages: existingSlugResult.rows,
    requestedSlug: localizedSlug
  });

  if (slugConflict) {
    return c.json(
      {
        ok: false,
        error: "slug_conflict",
        message: `Já existe uma página com o slug "${slugConflict.slug}" no locale "${slugConflict.locale}".`
      },
      409
    );
  }

  let sourcePage: PageLookupRow | undefined;

  if (strategy === "duplicate") {
    const sourcePageId = String(body.sourcePageId ?? "").trim();

    if (!sourcePageId) {
      return c.json(
        { ok: false, error: "invalid_request", message: "Informe a página de origem para duplicar." },
        400
      );
    }

    const sourcePageResult = await pool.query<PageLookupRow>(
      "select p.id, p.slug, p.content, p.seo from pages p where p.id = $1 and p.site_id = $2 and exists (select 1 from project_members access_pm where access_pm.site_id = p.site_id and access_pm.user_id = $3) limit 1",
      [sourcePageId, siteId, authUserId]
    );
    sourcePage = sourcePageResult.rows[0];

    if (!sourcePage) {
      return c.json(
        { ok: false, error: "source_page_not_found", message: "Página de origem não encontrada." },
        404
      );
    }
  }

  const payload = buildPagePayload({
    strategy,
    name,
    slug,
    templateKey: normalizePageTemplateKey(body.templateKey),
    sourcePage: sourcePage
      ? {
          content: normalizePageContent(sourcePage.content),
          seo: sourcePage.seo ?? {}
        }
      : undefined
  });

  if (strategy === "blank" && body.followVisualModel) {
    const visualPatternResult = await pool.query<VisualPatternLookupRow>(
      "select p.content from pages p where p.site_id = $1 and p.status = 'published' and exists (select 1 from project_members access_pm where access_pm.site_id = p.site_id and access_pm.user_id = $2) order by p.order_idx asc, p.created_at asc",
      [siteId, authUserId]
    );
    const suggestion = suggestVisualPattern(
      visualPatternResult.rows.map((row) =>
        normalizePageContent(row.content).sections.map((section) => section.type)
      )
    );

    if (suggestion.length > 0) {
      payload.content = {
        sections: buildSuggestedSections(suggestion)
      };
    }
  }

  const nextOrderResult = await pool.query<OrderLookupRow>(
    "select coalesce(max(order_idx), -1) + 1 as next_order from pages p where p.site_id = $1 and exists (select 1 from project_members access_pm where access_pm.site_id = p.site_id and access_pm.user_id = $2)",
    [siteId, authUserId]
  );
  const nextOrder = Number(nextOrderResult.rows[0]?.next_order ?? 0);
  const derivedBlockTypes = collectBlockTypes(payload.content);
  const pageResult = await pool.query<PageLookupRow>(
    "insert into pages (site_id, name, slug, type, status, content, block_types, seo, order_idx) values ($1, $2, $3, 'page', 'draft', $4::jsonb, $5::text[], $6::jsonb, $7) returning id, site_id, name, slug, status, content, seo, block_types, order_idx",
    [
      siteId,
      name,
      slug,
      JSON.stringify(payload.content),
      derivedBlockTypes,
      JSON.stringify(payload.seo),
      nextOrder
    ]
  );

  return c.json({ ok: true, page: pageResult.rows[0] }, 201);
});

app.post("/api/projects/:siteId/pages/:pageId/translate", async (c) => {
  const authUserId = c.get("authUserId");

  if (!authUserId) {
    return c.json({ ok: false, error: "unauthorized" }, 401);
  }

  const siteId = c.req.param("siteId");
  const pageId = c.req.param("pageId");
  const body = await c.req.json().catch(() => ({}));
  const sourceLocale = String(body.sourceLocale ?? "").trim() || "pt-BR";
  const targetLocale = String(body.targetLocale ?? "").trim();
  const triggeredByUser = body.triggeredByUser === true;
  const pool = getDbPool();
  const pageResult = await pool.query<PageTranslationLookupRow>(
    "select p.id, p.content, s.languages from pages p join sites s on s.id = p.site_id where p.site_id = $1 and p.id = $2 and exists (select 1 from project_members access_pm where access_pm.site_id = p.site_id and access_pm.user_id = $3) limit 1",
    [siteId, pageId, authUserId]
  );
  const page = pageResult.rows[0];

  if (!page) {
    return c.json({ ok: false, error: "page_not_found" }, 404);
  }

  const siteLanguages = normalizeSiteLanguagesFromValue(page.languages);
  const translationJob = buildTranslationJob({
    enabledLocales: siteLanguages.enabled,
    sourceLocale,
    targetLocale,
    triggeredByUser
  });

  if (!translationJob) {
    const message = !triggeredByUser
      ? "A tradução só pode ser executada por ação explícita do usuário."
      : "Habilite o locale alvo antes de traduzir.";

    return c.json({ ok: false, error: "invalid_request", message }, 400);
  }

  const translatedContent = translateContentByLocale(
    page.content,
    translationJob.sourceLocale,
    translationJob.targetLocale
  );
  const updateResult = await pool.query<PageLookupRow>(
    "update pages p set content = $3::jsonb, updated_at = now() where p.site_id = $1 and p.id = $2 and exists (select 1 from project_members access_pm where access_pm.site_id = p.site_id and access_pm.user_id = $4) returning p.id, p.content",
    [siteId, pageId, JSON.stringify(translatedContent), authUserId]
  );
  const updatedPage = updateResult.rows[0];

  if (!updatedPage) {
    return c.json({ ok: false, error: "page_not_found" }, 404);
  }

  return c.json({
    ok: true,
    page: {
      id: updatedPage.id,
      content: updatedPage.content
    }
  });
});

app.get("/api/projects/:siteId/pages/suggestions/visual-pattern", async (c) => {
  const authUserId = c.get("authUserId");

  if (!authUserId) {
    return c.json({ ok: false, error: "unauthorized" }, 401);
  }

  const siteId = c.req.param("siteId");
  const pool = getDbPool();
  const { rows } = await pool.query<VisualPatternLookupRow>(
    "select p.content from pages p where p.site_id = $1 and p.status = 'published' and exists (select 1 from project_members access_pm where access_pm.site_id = p.site_id and access_pm.user_id = $2) order by p.order_idx asc, p.created_at asc",
    [siteId, authUserId]
  );
  const suggestion = suggestVisualPattern(
    rows.map((row) => normalizePageContent(row.content).sections.map((section) => section.type))
  );

  return c.json({ ok: true, suggestion });
});

app.post("/api/projects/:siteId/pages/:pageId/status", async (c) => {
  const authUserId = c.get("authUserId");

  if (!authUserId) {
    return c.json({ ok: false, error: "unauthorized" }, 401);
  }

  const siteId = c.req.param("siteId");
  const pageId = c.req.param("pageId");
  const body = await c.req.json().catch(() => ({}));
  const status = normalizePageStatus(body.status);

  if (!status) {
    return c.json({ ok: false, error: "invalid_request", message: "Status de página inválido." }, 400);
  }

  if (status === "published" && body.seo) {
    const seoPayload = normalizeSeoPayload(
      body.seo,
      `/${slugify(String(body.slug ?? body.title ?? pageId)) || pageId}`
    );
    const publishCheck = canPublishPage(status, seoPayload);

    if (!publishCheck.ok) {
      return c.json({ ok: false, error: "seo_required", message: publishCheck.message }, 400);
    }
  }

  const pool = getDbPool();
  const result = body.seo
    ? await pool.query<PageLookupRow>(
        "update pages p set status = $3, seo = $4::jsonb, updated_at = now() where p.site_id = $1 and p.id = $2 and exists (select 1 from project_members access_pm where access_pm.site_id = p.site_id and access_pm.user_id = $5) returning p.id, p.status, p.seo",
        [
          siteId,
          pageId,
          status,
          JSON.stringify(
            normalizeSeoPayload(
              body.seo,
              `/${slugify(String(body.slug ?? body.title ?? pageId)) || pageId}`
            )
          ),
          authUserId
        ]
      )
    : await pool.query<PageLookupRow>(
        "update pages p set status = $3, updated_at = now() where p.site_id = $1 and p.id = $2 and exists (select 1 from project_members access_pm where access_pm.site_id = p.site_id and access_pm.user_id = $4) returning p.id, p.status, p.seo",
        [siteId, pageId, status, authUserId]
      );

  const page = result.rows[0];

  if (!page) {
    return c.json({ ok: false, error: "page_not_found" }, 404);
  }

  return c.json({ ok: true, page });
});

app.post("/api/projects/:siteId/pages/:pageId/seo", async (c) => {
  const authUserId = c.get("authUserId");

  if (!authUserId) {
    return c.json({ ok: false, error: "unauthorized" }, 401);
  }

  const siteId = c.req.param("siteId");
  const pageId = c.req.param("pageId");
  const body = await c.req.json().catch(() => ({}));
  const fallbackCanonical = `/${slugify(String(body.title ?? pageId)) || pageId}`;
  const seoPayload = normalizeSeoPayload(body, fallbackCanonical);
  const pool = getDbPool();
  const result = await pool.query<PageLookupRow>(
    "update pages p set seo = $3::jsonb, updated_at = now() where p.site_id = $1 and p.id = $2 and exists (select 1 from project_members access_pm where access_pm.site_id = p.site_id and access_pm.user_id = $4) returning p.id, p.seo",
    [siteId, pageId, JSON.stringify(seoPayload), authUserId]
  );
  const page = result.rows[0];

  if (!page) {
    return c.json({ ok: false, error: "page_not_found" }, 404);
  }

  return c.json({ ok: true, page });
});

app.get("/api/projects/:siteId/members", async (c) => {
  const authUserId = c.get("authUserId");

  if (!authUserId) {
    return c.json({ ok: false, error: "unauthorized" }, 401);
  }

  const siteId = c.req.param("siteId");
  const pool = getDbPool();
  const { rows } = await pool.query(
    "select pm.user_id, u.email, u.name, pm.role, pm.accepted_at from project_members pm join users u on u.id = pm.user_id where pm.site_id = $1 and exists (select 1 from project_members access_pm where access_pm.site_id = pm.site_id and access_pm.user_id = $2) order by case when pm.role = 'owner' then 0 else 1 end, lower(u.email) asc",
    [siteId, authUserId]
  );

  return c.json({ ok: true, members: rows });
});

app.post("/api/projects/:siteId/invite", async (c) => {
  const authUserId = c.get("authUserId");

  if (!authUserId) {
    return c.json({ ok: false, error: "unauthorized" }, 401);
  }

  const siteId = c.req.param("siteId");
  const body = await c.req.json().catch(() => ({}));
  const email = normalizeEmail(body.email);
  const role = normalizeMemberRole(String(body.role ?? "member"));
  const pool = getDbPool();
  const existingUserResult = await pool.query<ExistingUserRow>(
    "select id, email, name from users where lower(email) = $1 limit 1",
    [email]
  );
  const existingUser = existingUserResult.rows[0];

  if (!canInviteExistingUserOnly(Boolean(existingUser))) {
    return c.json(
      {
        ok: false,
        error: "user_not_found",
        message: "Só é possível convidar um email já cadastrado."
      },
      404
    );
  }

  await pool.query(
    "insert into project_members (site_id, user_id, role) values ($1, $2, $3) on conflict (site_id, user_id) do update set role = excluded.role",
    [siteId, existingUser.id, role]
  );

  return c.json(
    {
      ok: true,
      member: {
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.name,
        role
      }
    },
    201
  );
});

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
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
}
