"use client";

import Link from "next/link";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

export function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
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
        <Link href={basePath} className="flex items-center gap-2">
          <Image src="/taseron_logo.png" alt="Taseron" width={40} height={40} className="rounded" />
          <span className="font-semibold text-lg">Taseron</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
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
    </header>
  );
}
