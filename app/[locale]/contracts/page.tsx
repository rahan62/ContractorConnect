"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";

interface BrowseContract {
  id: string;
  title: string;
  description: string | null;
  status: string;
  startsAt: string | null;
  endsAt: string | null;
  totalDays: number | null;
  createdAt: string;
  contractor: { companyName: string | null; location: string | null } | null;
  requiredSubcontractorMainCategories: Array<{
    mainCategory: { nameEn: string; nameTr: string };
  }>;
  _count: { bids: number };
}

type SortKey = "createdDesc" | "createdAsc" | "titleAsc" | "startAsc";

function ContractsLoadingSpinner({ label }: { label: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-4 py-16"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">{label}</span>
      <div
        className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent"
        aria-hidden
      />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function statusBadgeClass(status: string) {
  switch (status) {
    case "OPEN_FOR_BIDS":
      return "border-emerald-500/35 bg-emerald-500/12 text-emerald-800 dark:text-emerald-300";
    case "ACTIVE":
      return "border-sky-500/35 bg-sky-500/12 text-sky-900 dark:text-sky-200";
    case "COMPLETED":
      return "border-border bg-muted/80 text-muted-foreground";
    case "CANCELLED":
      return "border-red-500/40 bg-red-500/10 text-red-800 dark:text-red-300";
    default:
      return "border-border bg-muted/60 text-muted-foreground";
  }
}

function sortContracts(list: BrowseContract[], sort: SortKey): BrowseContract[] {
  const copy = [...list];
  const t = (a: BrowseContract, b: BrowseContract) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
  const byCreated = (a: BrowseContract, b: BrowseContract) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  const byCreatedAsc = (a: BrowseContract, b: BrowseContract) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  const startTime = (c: BrowseContract) => (c.startsAt ? new Date(c.startsAt).getTime() : Number.POSITIVE_INFINITY);
  const byStart = (a: BrowseContract, b: BrowseContract) => startTime(a) - startTime(b);

  switch (sort) {
    case "createdDesc":
      return copy.sort(byCreated);
    case "createdAsc":
      return copy.sort(byCreatedAsc);
    case "titleAsc":
      return copy.sort(t);
    case "startAsc":
      return copy.sort(byStart);
    default:
      return copy.sort(byCreated);
  }
}

export default function ContractsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [contracts, setContracts] = useState<BrowseContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("createdDesc");
  const locale = useLocale();
  const intlLocale = locale === "tr" ? "tr-TR" : "en-US";
  const t = useTranslations("contracts");
  const tDetail = useTranslations("contractDetail");
  const userType = (session?.user as { userType?: string } | undefined)?.userType;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/${locale}/auth/signin`);
    }
  }, [status, router, locale]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/contracts");
        if (!res.ok) return;
        const data = await res.json();
        setContracts(data);
      } finally {
        setLoading(false);
      }
    }
    if (status === "authenticated") {
      void load();
    }
  }, [status]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return contracts;
    return contracts.filter(c => {
      const company = c.contractor?.companyName ?? "";
      const loc = c.contractor?.location ?? "";
      const blob = `${c.title} ${c.description ?? ""} ${company} ${loc}`.toLowerCase();
      return blob.includes(q);
    });
  }, [contracts, search]);

  const sorted = useMemo(() => sortContracts(filtered, sort), [filtered, sort]);

  const formatWhen = (iso: string | null) => {
    if (!iso) return null;
    try {
      return new Intl.DateTimeFormat(intlLocale, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }).format(new Date(iso));
    } catch {
      return null;
    }
  };

  if (status === "loading" || !session) {
    return (
      <section className="app-page">
        <ContractsLoadingSpinner label={t("loading")} />
      </section>
    );
  }

  return (
    <section className="app-page">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t("browseDescription")}</p>
        </div>
        {userType === "CONTRACTOR" && (
          <div className="flex flex-wrap gap-2 sm:shrink-0">
            <Link
              href={`/${locale}/contracts/mine`}
              className="inline-flex items-center justify-center rounded-lg border border-border/60 bg-background px-3 py-2 text-sm font-medium hover:bg-muted"
            >
              {t("myContracts")}
            </Link>
            <Link
              href={`/${locale}/contracts/new`}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
            >
              {t("new")}
            </Link>
          </div>
        )}
      </div>

      {!loading && contracts.length > 0 && (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </span>
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t("listSearchPlaceholder")}
              className="w-full rounded-lg border border-border/60 bg-background py-2 pl-9 pr-3 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <span className="whitespace-nowrap text-muted-foreground">{t("sortLabel")}</span>
            <select
              value={sort}
              onChange={e => setSort(e.target.value as SortKey)}
              className="rounded-lg border border-border/60 bg-background px-3 py-2 text-sm"
            >
              <option value="createdDesc">{t("sortCreatedNew")}</option>
              <option value="createdAsc">{t("sortCreatedOld")}</option>
              <option value="startAsc">{t("sortStartSoon")}</option>
              <option value="titleAsc">{t("sortTitle")}</option>
            </select>
          </label>
        </div>
      )}

      {loading ? (
        <ContractsLoadingSpinner label={t("loading")} />
      ) : (
        <div className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/60 bg-card">
          {sorted.map(c => {
            const loc = c.contractor?.location?.trim();
            const primaryWhen = formatWhen(c.startsAt) ?? formatWhen(c.createdAt);
            const tradeLabel = (row: { nameEn: string; nameTr: string }) =>
              locale === "tr" ? row.nameTr : row.nameEn;

            return (
              <div
                key={c.id}
                className="group flex flex-col gap-2 px-4 py-3 transition-colors hover:bg-muted/30 sm:flex-row sm:items-stretch sm:gap-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                      <span
                        className={`inline-flex max-w-full truncate rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${statusBadgeClass(c.status)}`}
                      >
                        {tDetail(`statuses.${c.status}` as never)}
                      </span>
                      {c.status === "OPEN_FOR_BIDS" && (
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/[0.08] px-2 py-0.5 text-[11px] font-medium text-emerald-800 dark:text-emerald-300">
                          {t("bidsCount", { count: c._count.bids })}
                        </span>
                      )}
                      {c.requiredSubcontractorMainCategories.slice(0, 2).map((row, i) => (
                        <span
                          key={i}
                          className="max-w-[10rem] truncate rounded-full border border-violet-500/25 bg-violet-500/10 px-2 py-0.5 text-[11px] font-medium text-violet-900 dark:text-violet-200"
                          title={tradeLabel(row.mainCategory)}
                        >
                          {tradeLabel(row.mainCategory)}
                        </span>
                      ))}
                    </div>
                    <div className="shrink-0 text-right text-[11px] leading-tight text-muted-foreground sm:max-w-[14rem]">
                      {loc && <div className="font-medium text-foreground/90">{loc}</div>}
                      {primaryWhen && (
                        <div>
                          {c.startsAt ? t("listStart") : t("listPosted")}: {primaryWhen}
                        </div>
                      )}
                    </div>
                  </div>

                  <Link
                    href={`/${locale}/contracts/${c.id}`}
                    className="mt-1 block font-semibold leading-snug text-foreground underline-offset-2 hover:underline"
                  >
                    {c.title}
                  </Link>
                  {c.contractor?.companyName && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{c.contractor.companyName}</p>
                  )}
                  {c.description && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground/90">{c.description}</p>
                  )}
                  <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                    {c.totalDays != null && (
                      <span>
                        {c.totalDays} {t("days")}
                      </span>
                    )}
                    <span>
                      {t("listPosted")}: {formatWhen(c.createdAt) ?? "—"}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center justify-end gap-0.5 border-t border-border/40 pt-2 sm:border-t-0 sm:pt-0">
                  <Link
                    href={`/${locale}/contracts/${c.id}`}
                    className="rounded-md p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    title={t("listOpenDetail")}
                    aria-label={t("listOpenDetail")}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                  <Link
                    href={`/${locale}/contracts/${c.id}#documents`}
                    className="rounded-md p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    title={t("listDocuments")}
                    aria-label={t("listDocuments")}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </Link>
                  <Link
                    href={`/${locale}/contracts/${c.id}#comments`}
                    className="rounded-md p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    title={t("listComments")}
                    aria-label={t("listComments")}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </Link>
                </div>
              </div>
            );
          })}
          {sorted.length === 0 && !loading && (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">{t("empty")}</div>
          )}
        </div>
      )}
    </section>
  );
}
