export interface SiteLanguages {
  default: string;
  enabled: string[];
}

export function normalizeSiteLanguages(input?: Partial<SiteLanguages>): SiteLanguages {
  const defaultLocale = String(input?.default ?? "pt-BR").trim() || "pt-BR";
  const enabled = Array.isArray(input?.enabled)
    ? input.enabled.map((item) => String(item).trim()).filter(Boolean)
    : [];

  return {
    default: defaultLocale,
    enabled: [...new Set([defaultLocale, ...enabled])]
  };
}
