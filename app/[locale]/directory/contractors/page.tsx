"use client";

import { useEffect, useState } from "react";
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
  contractorProjectTypes?: LocalizedTaxonomy[];
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
          {items.map(item => {
            const tags = item.contractorProjectTypes?.length
              ? item.contractorProjectTypes
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
                tagsHeading={t("projectSectorsHeading")}
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
                      <p className="mt-2 text-xs italic text-muted-foreground">{t("noProjectSectors")}</p>
                    )}
                  </>
                }
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
