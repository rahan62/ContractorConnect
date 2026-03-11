export const locales = ["tr", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "tr";

export const i18nRouting = {
  localePrefix: "always" as const,
  localeDetection: true,
  locales,
  defaultLocale
};

