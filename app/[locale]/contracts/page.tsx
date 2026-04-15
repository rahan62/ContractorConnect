"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";

interface SimpleContract {
  id: string;
  title: string;
  description: string | null;
  imageUrls?: string | null;
  startsAt?: string | null;
  totalDays?: number | null;
  contractorId?: string | null;
}

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

export default function ContractsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [simpleContracts, setSimpleContracts] = useState<SimpleContract[]>([]);
  const [loading, setLoading] = useState(true);
  const locale = useLocale();
  const t = useTranslations("contracts");
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
        setSimpleContracts(data);
      } finally {
        setLoading(false);
      }
    }
    if (status === "authenticated") {
      void load();
    }
  }, [status]);

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

      {loading ? (
        <ContractsLoadingSpinner label={t("loading")} />
      ) : (
        <div className="space-y-3">
          {simpleContracts.map(c => (
            <Link
              key={c.id}
              href={`/${locale}/contracts/${c.id}`}
              className="app-card-sm block overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md dark:hover:shadow-black/25"
            >
              <div className="h-44 w-full overflow-hidden border-b border-border/50 app-hero-placeholder">
                {c.imageUrls?.split(";").filter(Boolean)[0] ? (
                  <img
                    src={c.imageUrls.split(";").filter(Boolean)[0]}
                    alt={c.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="app-hero-placeholder-inner h-full">
                    <img src="/favicon.svg" alt="" className="h-16 w-16 rounded-md opacity-90" aria-hidden />
                  </div>
                )}
              </div>
              <div className="p-4">
                <h2 className="font-medium">{c.title}</h2>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.description ?? ""}</p>
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span>
                    {c.startsAt ? `${t("startLabel")}: ${new Date(c.startsAt).toLocaleDateString()}` : t("noStartDate")}
                  </span>
                  <span>{c.totalDays ? `${c.totalDays} ${t("days")}` : t("noDuration")}</span>
                </div>
              </div>
            </Link>
          ))}
          {simpleContracts.length === 0 && <p className="text-sm text-muted-foreground">{t("empty")}</p>}
        </div>
      )}
    </section>
  );
}
