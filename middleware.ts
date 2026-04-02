import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { getToken } from "next-auth/jwt";
import { i18nRouting } from "./i18n/routing";

const intlMiddleware = createMiddleware({
  locales: i18nRouting.locales,
  defaultLocale: i18nRouting.defaultLocale,
  localePrefix: i18nRouting.localePrefix
});

/**
 * Paths under /[locale] that do not require authentication.
 * Home, sign-in, and registration stay reachable for guests.
 */
function isPublicLocalePath(pathname: string): boolean {
  if (pathname === "/") return true;

  const match = pathname.match(/^\/(tr|en)(\/.*)?$/);
  if (!match) return false;

  const rest = (match[2] ?? "/") as string;
  if (rest === "/" || rest === "") return true;
  if (rest.startsWith("/auth/signin")) return true;
  if (rest.startsWith("/auth/register")) return true;

  return false;
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  if (!isPublicLocalePath(pathname)) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });

    if (!token) {
      const localeMatch = pathname.match(/^\/(tr|en)/);
      const locale = localeMatch?.[1] ?? i18nRouting.defaultLocale;
      const signIn = new URL(`/${locale}/auth/signin`, request.url);
      const callback = `${pathname}${request.nextUrl.search}`;
      signIn.searchParams.set("callbackUrl", callback);
      return NextResponse.redirect(signIn);
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/", "/(tr|en)/:path*"]
};
