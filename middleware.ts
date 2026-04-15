import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

/**
 * Locale routing only. Must run on every app pathname so `X-NEXT-INTL-LOCALE` is set;
 * a narrow matcher (e.g. `/(tr|en)/:path*`) can skip some requests and break one locale
 * with "Unable to find next-intl locale" / notFound().
 * @see https://next-intl.dev/docs/routing/middleware#matcher-config
 */
export default createMiddleware(routing);

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"]
};
