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
  location?: string | null;
  trustScore?: number | null;
  trustGrade?: string | null;
  specialties?: string[];
  notes?: string | null;
}

export default function SubcontractorsDirectoryPage() {
  const [items, setItems] = useState<DirectoryUser[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const locale = useLocale();
  const t = useTranslations("directory");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/directory?type=SUBCONTRACTOR");
        if (!res.ok) return;
        const data = await res.json();
        setItems(data);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  function toggleSelected(id: string) {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(item => item !== id) : prev.length < 4 ? [...prev, id] : prev));
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">{t("subcontractorsTitle")}</h1>
        <Link
          href={selectedIds.length >= 2 ? `/${locale}/compare?ids=${selectedIds.join(",")}` : "#"}
          className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          {t("compareAction", { count: selectedIds.length })}
        </Link>
      </div>
      {loading ? (
        <p className="text-sm text-muted-foreground">{t("loadingSubcontractors")}</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noSubcontractors")}</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map(item => (
            <Link
              key={item.id}
              href={`/${locale}/company/${item.id}`}
              className="rounded-lg border bg-card p-4 text-sm hover:bg-muted"
            >
              <div
                className="mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs"
                onClick={event => {
                  event.preventDefault();
                  toggleSelected(item.id);
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(item.id)}
                  onChange={() => undefined}
                />
                <span>{t("comparePick")}</span>
              </div>
              <h2 className="font-semibold">
                {item.companyName || item.email}
                {item.isVerified && (
                  <span className="ml-2 rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-700">
                    {t("verified")}
                  </span>
                )}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">{item.email}</p>
              {item.location && <p className="mt-1 text-xs text-muted-foreground">{item.location}</p>}
              {item.trustScore != null && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("trustLabel")}: {item.trustScore} / {item.trustGrade}
                </p>
              )}
              {item.specialties && item.specialties.length > 0 && (
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.specialties.join(", ")}</p>
              )}
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

