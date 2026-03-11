import createMiddleware from "next-intl/middleware";
import { i18nRouting } from "./i18n/routing";

export default createMiddleware({
  locales: i18nRouting.locales,
  defaultLocale: i18nRouting.defaultLocale,
  localePrefix: i18nRouting.localePrefix
});

export const config = {
  // Run on the root and all locale-prefixed paths
  matcher: ["/", "/(tr|en)/:path*"]
};

