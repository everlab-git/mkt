export interface SeoPayload {
  title: string;
  description: string;
  ogImage: string;
  canonical: string;
}

function normalizeString(value: unknown): string {
  return String(value ?? "").trim();
}

export function normalizeSeoPayload(
  input: Partial<SeoPayload>,
  fallbackCanonical: string
): SeoPayload {
  const canonical = normalizeString(input.canonical);

  return {
    title: normalizeString(input.title),
    description: normalizeString(input.description),
    ogImage: normalizeString(input.ogImage),
    canonical: canonical || normalizeString(fallbackCanonical)
  };
}

export function canPublishPage(status: "draft" | "published", seo: Partial<SeoPayload>) {
  if (status !== "published") {
    return { ok: true as const };
  }

  if (!normalizeString(seo.title) || !normalizeString(seo.description)) {
    return {
      ok: false as const,
      message: "Preencha SEO title e SEO description antes de publicar."
    };
  }

  return { ok: true as const };
}
