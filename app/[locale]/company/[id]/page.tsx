"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

interface CompanyPublic {
  id: string;
  companyName: string;
  bio: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  email: string;
  phone: string | null;
  isVerified: boolean;
  metrics: {
    completedContracts: number;
    activeContracts: number;
    totalContracts: number;
    references: number;
  };
}

export default function CompanyPublicPage() {
  const params = useParams<{ id: string }>();
  const t = useTranslations("companyPublic");
  const [data, setData] = useState<CompanyPublic | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/company/public/${params.id}`);
        if (!res.ok) return;
        const json = await res.json();
        setData(json);
      } finally {
        setLoading(false);
      }
    }
    if (params?.id) {
      void load();
    }
  }, [params?.id]);

  if (loading || !data) {
    return (
      <section className="app-page">
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      </section>
    );
  }

  return (
    <section className="app-page space-y-6">
      <div className="app-card overflow-hidden">
        {data.bannerUrl && (
          <div className="h-32 w-full overflow-hidden border-b border-border/50 bg-muted/40 sm:h-40">
            <img
              src={data.bannerUrl}
              alt={data.companyName}
              className="h-full w-full object-cover"
            />
          </div>
        )}
        <div className="flex flex-col items-start gap-4 p-4 sm:flex-row sm:items-center">
          {data.logoUrl && (
            <img
              src={data.logoUrl}
              alt={data.companyName}
              className="h-16 w-16 rounded border object-cover"
            />
          )}
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold break-words">
              {data.companyName}
              {data.isVerified && (
                <span className="ml-2 rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                  {t("verified")}
                </span>
              )}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {data.bio || t("noDescription")}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {data.email}
              {data.phone && ` · ${data.phone}`}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        <div className="app-card-sm p-4 text-center">
          <p className="text-xs text-muted-foreground">{t("metrics.completed")}</p>
          <p className="mt-1 text-2xl font-semibold">
            {data.metrics.completedContracts}
          </p>
        </div>
        <div className="app-card-sm p-4 text-center">
          <p className="text-xs text-muted-foreground">{t("metrics.total")}</p>
          <p className="mt-1 text-2xl font-semibold">
            {data.metrics.totalContracts}
          </p>
        </div>
        <div className="app-card-sm p-4 text-center">
          <p className="text-xs text-muted-foreground">{t("metrics.references")}</p>
          <p className="mt-1 text-2xl font-semibold">
            {data.metrics.references}
          </p>
        </div>
      </div>
    </section>
  );
}
