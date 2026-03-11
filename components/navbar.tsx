"use client";

import Link from "next/link";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

export function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const locale = useLocale();
  const tNav = useTranslations("navbar");
  const basePath = `/${locale}`;

  const [displayName, setDisplayName] = useState<string>("?");

  useEffect(() => {
    const base =
      (session?.user as any)?.companyName ||
      (session?.user as any)?.username ||
      session?.user?.email ||
      "?";
    setDisplayName(base);

    if (!session?.user) return;

    // Ensure we always reflect latest companyName from DB even if JWT is stale
    void (async () => {
      try {
        const res = await fetch("/api/users/me");
        if (!res.ok) return;
        const data = await res.json();
        if (data.companyName) {
          setDisplayName(data.companyName);
        }
      } catch {
        // ignore
      }
    })();
  }, [session?.user]);

  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href={basePath} className="flex items-center">
          <Image
            src="/taseron_logo.png"
            alt="Taseron"
            width={80}
            height={80}
            className="h-12 w-12 rounded object-contain sm:h-16 sm:w-16"
          />
        </Link>
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border md:hidden"
          onClick={() => setMobileOpen(open => !open)}
          aria-label={tNav("toggleNavigation")}
        >
          {mobileOpen ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </button>
        <nav className="hidden items-center gap-4 text-sm md:flex">
          <Link href={`${basePath}/contracts`} className="hover:underline">
            {tNav("contracts")}
          </Link>
          <Link href={`${basePath}/directory/contractors`} className="hover:underline">
            {tNav("findContractor")}
          </Link>
          <Link href={`${basePath}/directory/subcontractors`} className="hover:underline">
            {tNav("findSubcontractor")}
          </Link>
          <Link href={`${basePath}/directory/teams`} className="hover:underline">
            {tNav("findTeam")}
          </Link>
          <div className="flex items-center gap-2 border-l pl-4">
            <Link
              href="/en"
              className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded border"
            >
              <span aria-hidden="true">🇬🇧</span>
              <span>EN</span>
            </Link>
            <Link
              href="/tr"
              className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded border"
            >
              <span aria-hidden="true">🇹🇷</span>
              <span>TR</span>
            </Link>
          </div>
          {session ? (
            <div className="relative flex items-center gap-2 border-l pl-4">
              <span className="max-w-[160px] truncate text-xs text-muted-foreground">
                {displayName}
              </span>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
                onClick={() => setMenuOpen(open => !open)}
              >
                {displayName[0]?.toUpperCase()}
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-10 z-20 w-44 rounded-md border bg-card p-2 text-sm shadow-md">
                  <Link
                    href={`${basePath}/profile`}
                    className="block rounded px-2 py-1 hover:bg-muted"
                    onClick={() => setMenuOpen(false)}
                  >
                    {tNav("profile")}
                  </Link>
                  <Link
                    href={`${basePath}/company`}
                    className="block rounded px-2 py-1 hover:bg-muted"
                    onClick={() => setMenuOpen(false)}
                  >
                    {tNav("company")}
                  </Link>
                  <Link
                    href={`${basePath}/company/${(session.user as any)?.id}`}
                    className="block rounded px-2 py-1 hover:bg-muted"
                    onClick={() => setMenuOpen(false)}
                  >
                    {tNav("home")}
                  </Link>
                  <Link
                    href={`${basePath}/settings`}
                    className="block rounded px-2 py-1 hover:bg-muted"
                    onClick={() => setMenuOpen(false)}
                  >
                    {tNav("settings")}
                  </Link>
                  <button
                    type="button"
                    className="mt-1 w-full rounded px-2 py-1 text-left text-red-600 hover:bg-muted"
                    onClick={() => {
                      setMenuOpen(false);
                      void signOut({ callbackUrl: `${basePath}/auth/signin` });
                    }}
                  >
                    {tNav("logout")}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 border-l pl-4">
              <Link href={`${basePath}/auth/signin`} className="hover:underline">
                {tNav("login")}
              </Link>
              <Link href={`${basePath}/auth/register`} className="hover:underline">
                {tNav("register")}
              </Link>
            </div>
          )}
        </nav>
      </div>
      {mobileOpen && (
        <div className="border-t bg-card md:hidden">
          <div className="mx-auto max-w-6xl space-y-4 px-4 py-4 text-sm">
            <div className="grid gap-2">
              <Link href={`${basePath}/contracts`} className="rounded px-2 py-2 hover:bg-muted" onClick={() => setMobileOpen(false)}>
                {tNav("contracts")}
              </Link>
              <Link href={`${basePath}/directory/contractors`} className="rounded px-2 py-2 hover:bg-muted" onClick={() => setMobileOpen(false)}>
                {tNav("findContractor")}
              </Link>
              <Link href={`${basePath}/directory/subcontractors`} className="rounded px-2 py-2 hover:bg-muted" onClick={() => setMobileOpen(false)}>
                {tNav("findSubcontractor")}
              </Link>
              <Link href={`${basePath}/directory/teams`} className="rounded px-2 py-2 hover:bg-muted" onClick={() => setMobileOpen(false)}>
                {tNav("findTeam")}
              </Link>
            </div>

            <div className="flex flex-wrap gap-2 border-t pt-4">
              <Link href="/en" className="flex items-center gap-1 rounded border px-3 py-2 text-xs font-medium" onClick={() => setMobileOpen(false)}>
                <span aria-hidden="true">🇬🇧</span>
                <span>EN</span>
              </Link>
              <Link href="/tr" className="flex items-center gap-1 rounded border px-3 py-2 text-xs font-medium" onClick={() => setMobileOpen(false)}>
                <span aria-hidden="true">🇹🇷</span>
                <span>TR</span>
              </Link>
            </div>

            {session ? (
              <div className="space-y-2 border-t pt-4">
                <p className="truncate px-2 text-xs text-muted-foreground">{displayName}</p>
                <Link href={`${basePath}/profile`} className="block rounded px-2 py-2 hover:bg-muted" onClick={() => setMobileOpen(false)}>
                  {tNav("profile")}
                </Link>
                <Link href={`${basePath}/company`} className="block rounded px-2 py-2 hover:bg-muted" onClick={() => setMobileOpen(false)}>
                  {tNav("company")}
                </Link>
                <Link href={`${basePath}/company/${(session.user as any)?.id}`} className="block rounded px-2 py-2 hover:bg-muted" onClick={() => setMobileOpen(false)}>
                  {tNav("home")}
                </Link>
                <Link href={`${basePath}/settings`} className="block rounded px-2 py-2 hover:bg-muted" onClick={() => setMobileOpen(false)}>
                  {tNav("settings")}
                </Link>
                <button
                  type="button"
                  className="block w-full rounded px-2 py-2 text-left text-red-600 hover:bg-muted"
                  onClick={() => {
                    setMobileOpen(false);
                    void signOut({ callbackUrl: `${basePath}/auth/signin` });
                  }}
                >
                  {tNav("logout")}
                </button>
              </div>
            ) : (
              <div className="grid gap-2 border-t pt-4">
                <Link href={`${basePath}/auth/signin`} className="rounded px-2 py-2 hover:bg-muted" onClick={() => setMobileOpen(false)}>
                  {tNav("login")}
                </Link>
                <Link href={`${basePath}/auth/register`} className="rounded px-2 py-2 hover:bg-muted" onClick={() => setMobileOpen(false)}>
                  {tNav("register")}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
