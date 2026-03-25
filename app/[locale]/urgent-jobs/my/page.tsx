"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";

interface MyUrgentJob {
  id: string;
  title: string;
  description: string | null;
  startsAt: string | null;
  totalDays: number | null;
  createdAt: string;
}

export default function MyUrgentJobsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("urgentJobs");

  const [items, setItems] = useState<MyUrgentJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/${locale}/auth/signin`);
    }
  }, [status, router, locale]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/contracts/urgent-mine");
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message ?? "Failed to load urgent jobs");
        }
        const data = await res.json();
        setItems(data);
      } catch (err: any) {
        setError(err.message ?? "Failed to load urgent jobs");
      } finally {
        setLoading(false);
      }
    }

    if (status === "authenticated") {
      void load();
    }
  }, [status]);

  if (!session) {
    return (
      <section className="app-page">
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      </section>
    );
  }

  if ((session.user as any).userType !== "CONTRACTOR") {
    return (
      <section className="app-page">
        <p className="text-sm text-muted-foreground">{t("notContractorAccount")}</p>
      </section>
    );
  }

  return (
    <section className="app-page">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("myListTitleForContractor")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("myListDescriptionForContractor")}
          </p>
        </div>
        <Link
          href={`/${locale}/urgent-jobs/new`}
          className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90 sm:w-auto"
        >
          {t("newUrgentFromList")}
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      ) : error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noUrgentJobsForContractor")}</p>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <article key={item.id} className="app-card-sm p-4 text-sm">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-semibold">{item.title}</h2>
                {item.totalDays != null && (
                  <span className="rounded-md bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-700 dark:text-red-300">
                    {t("badges.urgent")}
                  </span>
                )}
              </div>
              {item.startsAt && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("labels.startsAt", {
                    date: new Date(item.startsAt).toLocaleDateString()
                  })}
                </p>
              )}
              {item.description && (
                <p className="mt-2 text-xs text-muted-foreground line-clamp-3">
                  {item.description}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

