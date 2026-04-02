"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { DirectoryEntityCard } from "@/components/directory-entity-card";
import type { LocalizedTaxonomy } from "@/lib/taxonomy-label";

interface DirectoryUser {
  id: string;
  companyName: string | null;
  email: string;
  phone: string | null;
  isVerified: boolean;
  location?: string | null;
  logoUrl?: string | null;
  trustScore?: number | null;
  trustGrade?: string | null;
  specialties?: string[];
  subcontractorMainCategories?: LocalizedTaxonomy[];
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
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : prev.length < 4 ? [...prev, id] : prev
    );
  }

  return (
    <section className="app-page">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{t("subcontractorsTitle")}</h1>
        <Link
          href={selectedIds.length >= 2 ? `/${locale}/compare?ids=${selectedIds.join(",")}` : "#"}
          className="inline-flex items-center justify-center rounded-lg border border-border/60 bg-muted/20 px-4 py-2 text-sm font-medium transition-colors hover:bg-muted/40"
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
          {items.map(item => {
            const tags = item.subcontractorMainCategories?.length
              ? item.subcontractorMainCategories
              : undefined;
            return (
              <DirectoryEntityCard
                key={item.id}
                href={`/${locale}/company/${item.id}`}
                locale={locale}
                title={item.companyName || item.email}
                subtitle={item.email}
                logoUrl={item.logoUrl}
                location={item.location}
                isVerified={item.isVerified}
                verifiedLabel={t("verified")}
                locationLabel={t("locationLabel")}
                tags={tags}
                tagsHeading={t("tradeGroupsHeading")}
                metaLines={
                  <>
                    {item.trustScore != null && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        {t("trustLabel")}: {item.trustScore} / {item.trustGrade}
                      </p>
                    )}
                    {item.specialties && item.specialties.length > 0 && (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {item.specialties.join(", ")}
                      </p>
                    )}
                    {item.phone && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t("phoneLabel")}: {item.phone}
                      </p>
                    )}
                    {!tags?.length && (
                      <p className="mt-2 text-xs italic text-muted-foreground">{t("noTradeGroups")}</p>
                    )}
                  </>
                }
                aside={
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(item.id)}
                    onChange={() => toggleSelected(item.id)}
                    aria-label={t("comparePick")}
                    className="mt-2 size-3 shrink-0 cursor-pointer self-start rounded border border-border bg-background accent-primary"
                  />
                }
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
