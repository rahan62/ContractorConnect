"use client";

import Link from "next/link";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AnimatedNavTrack, type NavTrackItem } from "@/components/animated-nav-track";

const dropdownItemClass =
  "block rounded-lg px-2 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-orange-500/15 dark:hover:bg-orange-500/10";

const mobileLinkClass =
  "block w-full whitespace-nowrap rounded-lg border border-orange-500/30 bg-orange-500/[0.12] px-3 py-2.5 text-center text-sm font-semibold text-orange-950 shadow-sm transition-colors hover:bg-orange-500/20 dark:border-orange-400/25 dark:bg-orange-500/[0.1] dark:text-orange-50 dark:hover:bg-orange-500/15";

export function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const locale = useLocale();
  const tNav = useTranslations("navbar");
  const basePath = `/${locale}`;
  const userType = (session?.user as any)?.userType;

  const [displayName, setDisplayName] = useState<string>("?");

  const mainNavItems = useMemo((): NavTrackItem[] => {
    if (!session) return [];
    const items: NavTrackItem[] = [
      { href: `${basePath}/contracts`, label: tNav("contracts") },
      ...(userType === "CONTRACTOR"
        ? [{ href: `${basePath}/contracts/mine`, label: tNav("myContracts") } as NavTrackItem]
        : []),
      { href: `${basePath}/directory/contractors`, label: tNav("findContractor") },
      { href: `${basePath}/directory/subcontractors`, label: tNav("findSubcontractor") },
      { href: `${basePath}/directory/field-crews`, label: tNav("findFieldCrew") }
    ];
    if (userType === "CONTRACTOR") {
      items.push({ href: `${basePath}/urgent-jobs/new`, label: tNav("newUrgentJob") });
    }
    if (userType === "TEAM") {
      items.push({ href: `${basePath}/urgent-jobs`, label: tNav("urgentJobsForFieldCrews") });
    }
    return items;
  }, [session, basePath, userType, tNav]);

  const langItems = useMemo(
    (): NavTrackItem[] => [
      { href: "/en", label: "🇬🇧 EN" },
      { href: "/tr", label: "🇹🇷 TR" }
    ],
    []
  );

  const guestAuthItems = useMemo(
    (): NavTrackItem[] => [
      { href: `${basePath}/auth/signin`, label: tNav("login") },
      { href: `${basePath}/auth/register`, label: tNav("register") }
    ],
    [basePath, tNav]
  );

  useEffect(() => {
    const base =
      (session?.user as any)?.companyName ||
      (session?.user as any)?.username ||
      session?.user?.email ||
      "?";
    setDisplayName(base);

    if (!session?.user) return;

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

  const logoHref = session ? `${basePath}/dashboard` : basePath;

  return (
    <header className="relative z-50 overflow-visible border-b border-border/70 bg-card shadow-md shadow-black/[0.06] dark:border-border/60 dark:bg-card dark:shadow-black/30">
      {/* Bar height follows logo (h-10 = 40px) + py-2; avoid md:* logo heights or the whole header grows. */}
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2">
        <Link
          href={logoHref}
          className="flex h-24 max-h-28 shrink-0 items-center bg-transparent"
          aria-label="Yüklenicim"
        >
          <Image
            src="/yuklenicim-logo.png?v=yk1"
            alt="Yüklenicim"
            width={320}
            height={96}
            priority
            unoptimized
            className="h-40 max-h-40 w-auto max-w-[min(100%,240px)] bg-transparent object-contain object-left sm:max-w-[260px]"
          />
        </Link>
        <button
          type="button"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-orange-500/40 bg-orange-500/15 text-orange-700 transition-colors hover:bg-orange-500/25 dark:text-orange-200 md:hidden"
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
        <nav className="hidden min-w-0 flex-1 items-center justify-end gap-3 md:flex md:justify-end lg:gap-4">
          {session && mainNavItems.length > 0 && (
            <div className="min-w-0 max-w-[min(100%,52rem)]">
              <AnimatedNavTrack items={mainNavItems} className="w-full justify-start" />
            </div>
          )}
          <div className="flex shrink-0 items-center gap-2 border-l border-border/60 pl-3 lg:pl-4">
            <AnimatedNavTrack items={langItems} size="sm" />
          </div>
          {session ? (
            <div className="relative flex shrink-0 items-center gap-2 border-l border-border/60 pl-3 lg:pl-4">
              <span className="hidden max-w-[140px] truncate text-xs text-muted-foreground lg:inline xl:max-w-[180px]">
                {displayName}
              </span>
              <button
                type="button"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-500/90 text-xs font-bold text-white shadow-md shadow-orange-900/20 ring-2 ring-orange-300/50 transition-transform hover:scale-105 dark:bg-orange-500/85 dark:ring-orange-400/30"
                onClick={() => setMenuOpen(open => !open)}
              >
                {displayName[0]?.toUpperCase()}
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-11 z-20 w-52 rounded-xl border border-border/60 bg-card p-1.5 text-sm shadow-lg shadow-black/10 ring-1 ring-black/5 dark:shadow-black/40 dark:ring-white/10">
                  <Link
                    href={`${basePath}/profile`}
                    className={dropdownItemClass}
                    onClick={() => setMenuOpen(false)}
                  >
                    {tNav("profile")}
                  </Link>
                  <Link
                    href={`${basePath}/company`}
                    className={dropdownItemClass}
                    onClick={() => setMenuOpen(false)}
                  >
                    {tNav("company")}
                  </Link>
                  <Link
                    href={`${basePath}/company/${(session.user as any)?.id}`}
                    className={dropdownItemClass}
                    onClick={() => setMenuOpen(false)}
                  >
                    {tNav("home")}
                  </Link>
                  <Link
                    href={`${basePath}/contracts`}
                    className={dropdownItemClass}
                    onClick={() => setMenuOpen(false)}
                  >
                    {tNav("contracts")}
                  </Link>
                  {userType === "CONTRACTOR" && (
                    <Link
                      href={`${basePath}/contracts/mine`}
                      className={dropdownItemClass}
                      onClick={() => setMenuOpen(false)}
                    >
                      {tNav("myContracts")}
                    </Link>
                  )}
                  {userType === "CONTRACTOR" && (
                    <>
                      <Link
                        href={`${basePath}/urgent-jobs/new`}
                        className={dropdownItemClass}
                        onClick={() => setMenuOpen(false)}
                      >
                        {tNav("newUrgentJob")}
                      </Link>
                      <Link
                        href={`${basePath}/urgent-jobs/my`}
                        className={dropdownItemClass}
                        onClick={() => setMenuOpen(false)}
                      >
                        {tNav("myUrgentJobs")}
                      </Link>
                    </>
                  )}
                  {userType === "TEAM" && (
                    <Link
                      href={`${basePath}/urgent-jobs`}
                      className={dropdownItemClass}
                      onClick={() => setMenuOpen(false)}
                    >
                      {tNav("urgentJobsForFieldCrews")}
                    </Link>
                  )}
                  {userType === "SUBCONTRACTOR" && (
                    <Link
                      href={`${basePath}/bids`}
                      className={dropdownItemClass}
                      onClick={() => setMenuOpen(false)}
                    >
                      {tNav("myBids")}
                    </Link>
                  )}
                  {["CONTRACTOR", "SUBCONTRACTOR", "TEAM"].includes(userType ?? "") && (
                    <Link
                      href={`${basePath}/references`}
                      className={dropdownItemClass}
                      onClick={() => setMenuOpen(false)}
                    >
                      {tNav("references")}
                    </Link>
                  )}
                  {["CONTRACTOR", "SUBCONTRACTOR"].includes(userType ?? "") && (
                    <Link
                      href={`${basePath}/reference-requests`}
                      className={dropdownItemClass}
                      onClick={() => setMenuOpen(false)}
                    >
                      {tNav("referenceRequests")}
                    </Link>
                  )}
                  <Link
                    href={`${basePath}/settings`}
                    className={dropdownItemClass}
                    onClick={() => setMenuOpen(false)}
                  >
                    {tNav("settings")}
                  </Link>
                  <button
                    type="button"
                    className="mt-1 w-full rounded-lg px-2 py-1.5 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-500/10 dark:text-red-400"
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
            <div className="flex shrink-0 items-center border-l border-border/60 pl-3 lg:pl-4">
              <AnimatedNavTrack items={guestAuthItems} size="sm" />
            </div>
          )}
        </nav>
      </div>
      {mobileOpen && (
        <div className="border-t border-border/60 bg-card shadow-inner dark:bg-card md:hidden">
          <div className="mx-auto max-w-6xl space-y-4 px-4 py-4 text-sm">
            {session ? (
              <div className="min-w-0">
                <AnimatedNavTrack items={mainNavItems} className="w-full justify-start" />
              </div>
            ) : (
              <div className="min-w-0">
                <AnimatedNavTrack items={guestAuthItems} className="w-full justify-center" />
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
              <AnimatedNavTrack items={langItems} size="sm" />
            </div>

            {session ? (
              <div className="space-y-2 border-t border-border/60 pt-4">
                <p className="truncate px-1 text-xs text-muted-foreground">{displayName}</p>
                <Link
                  href={`${basePath}/profile`}
                  className={mobileLinkClass}
                  onClick={() => setMobileOpen(false)}
                >
                  {tNav("profile")}
                </Link>
                <Link
                  href={`${basePath}/company`}
                  className={mobileLinkClass}
                  onClick={() => setMobileOpen(false)}
                >
                  {tNav("company")}
                </Link>
                <Link
                  href={`${basePath}/company/${(session.user as any)?.id}`}
                  className={mobileLinkClass}
                  onClick={() => setMobileOpen(false)}
                >
                  {tNav("home")}
                </Link>
                <Link
                  href={`${basePath}/contracts`}
                  className={mobileLinkClass}
                  onClick={() => setMobileOpen(false)}
                >
                  {tNav("contracts")}
                </Link>
                {userType === "CONTRACTOR" && (
                  <Link
                    href={`${basePath}/contracts/mine`}
                    className={mobileLinkClass}
                    onClick={() => setMobileOpen(false)}
                  >
                    {tNav("myContracts")}
                  </Link>
                )}
                {userType === "CONTRACTOR" && (
                  <>
                    <Link
                      href={`${basePath}/urgent-jobs/new`}
                      className={mobileLinkClass}
                      onClick={() => setMobileOpen(false)}
                    >
                      {tNav("newUrgentJob")}
                    </Link>
                    <Link
                      href={`${basePath}/urgent-jobs/my`}
                      className={mobileLinkClass}
                      onClick={() => setMobileOpen(false)}
                    >
                      {tNav("myUrgentJobs")}
                    </Link>
                  </>
                )}
                {userType === "TEAM" && (
                  <Link
                    href={`${basePath}/urgent-jobs`}
                    className={mobileLinkClass}
                    onClick={() => setMobileOpen(false)}
                  >
                    {tNav("urgentJobsForFieldCrews")}
                  </Link>
                )}
                {userType === "SUBCONTRACTOR" && (
                  <Link
                    href={`${basePath}/bids`}
                    className={mobileLinkClass}
                    onClick={() => setMobileOpen(false)}
                  >
                    {tNav("myBids")}
                  </Link>
                )}
                {["CONTRACTOR", "SUBCONTRACTOR", "TEAM"].includes(userType ?? "") && (
                  <Link
                    href={`${basePath}/references`}
                    className={mobileLinkClass}
                    onClick={() => setMobileOpen(false)}
                  >
                    {tNav("references")}
                  </Link>
                )}
                {["CONTRACTOR", "SUBCONTRACTOR"].includes(userType ?? "") && (
                  <Link
                    href={`${basePath}/reference-requests`}
                    className={mobileLinkClass}
                    onClick={() => setMobileOpen(false)}
                  >
                    {tNav("referenceRequests")}
                  </Link>
                )}
                <Link
                  href={`${basePath}/settings`}
                  className={mobileLinkClass}
                  onClick={() => setMobileOpen(false)}
                >
                  {tNav("settings")}
                </Link>
                <button
                  type="button"
                  className="block w-full rounded-lg px-2 py-2 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-500/10 dark:text-red-400"
                  onClick={() => {
                    setMobileOpen(false);
                    void signOut({ callbackUrl: `${basePath}/auth/signin` });
                  }}
                >
                  {tNav("logout")}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </header>
  );
}
