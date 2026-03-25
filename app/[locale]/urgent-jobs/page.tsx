"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

interface UrgentJob {
  id: string;
  title: string;
  description: string | null;
  startsAt: string | null;
  totalDays: number | null;
  createdAt: string;
  contractor: {
    id: string;
    companyName: string | null;
    name: string | null;
  } | null;
}

export default function UrgentJobsForTeamsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("urgentJobs");

  const [items, setItems] = useState<UrgentJob[]>([]);
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
        const res = await fetch("/api/contracts/urgent-for-teams");
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

  if ((session.user as any).userType !== "TEAM") {
    return (
      <section className="app-page">
        <p className="text-sm text-muted-foreground">{t("notTeamAccountForUrgent")}</p>
      </section>
    );
  }

  return (
    <section className="app-page">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">{t("listTitleForTeams")}</h1>
      <p className="mb-4 text-sm text-muted-foreground">{t("listDescriptionForTeams")}</p>
      {loading ? (
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      ) : error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noUrgentJobs")}</p>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <article key={item.id} className="app-card-sm p-4 text-sm">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-semibold">{item.title}</h2>
                {item.totalDays != null && (
                  <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-200">
                    {t("badges.totalDays", { count: item.totalDays })}
                  </span>
                )}
              </div>
              {item.contractor && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("labels.fromContractor")}{" "}
                  {item.contractor.companyName || item.contractor.name || "-"}
                </p>
              )}
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

