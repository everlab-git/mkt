export type LocalizedSlug = Record<string, string>;

export function migrateSlugToLocales(value: string, defaultLocale: string): LocalizedSlug {
  return { [defaultLocale]: String(value).trim() };
}

export function normalizeLocalizedSlug(
  value: string | Record<string, unknown>,
  defaultLocale: string
): LocalizedSlug {
  if (typeof value === "string") {
    return migrateSlugToLocales(value, defaultLocale);
  }

  const entries = Object.entries(value ?? {})
    .map(([locale, slug]) => [locale, String(slug).trim()] as const)
    .filter(([, slug]) => slug.length > 0);

  if (!entries.some(([locale]) => locale === defaultLocale)) {
    entries.unshift([defaultLocale, ""]);
  }

  return Object.fromEntries(entries);
}
