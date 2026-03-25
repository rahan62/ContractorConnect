"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

interface DirectoryUser {
  id: string;
  companyName: string | null;
  email: string;
  phone: string | null;
  isVerified: boolean;
}

export default function ContractorsDirectoryPage() {
  const [items, setItems] = useState<DirectoryUser[]>([]);
  const [loading, setLoading] = useState(true);
  const locale = useLocale();
  const t = useTranslations("directory");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/directory?type=CONTRACTOR");
        if (!res.ok) return;
        const data = await res.json();
        setItems(data);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  return (
    <section className="app-page">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">{t("contractorsTitle")}</h1>
      {loading ? (
        <p className="text-sm text-muted-foreground">{t("loadingContractors")}</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noContractors")}</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map(item => (
            <Link
              key={item.id}
              href={`/${locale}/company/${item.id}`}
              className="app-card-sm p-4 text-sm transition-colors hover:bg-muted/30"
            >
              <h2 className="font-semibold">
                {item.companyName || item.email}
                {item.isVerified && (
                  <span className="ml-2 rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                    {t("verified")}
                  </span>
                )}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">{item.email}</p>
              {item.phone && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("phoneLabel")}: {item.phone}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

