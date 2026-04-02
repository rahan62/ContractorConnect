"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { DirectoryEntityCard } from "@/components/directory-entity-card";
import type { LocalizedTaxonomy } from "@/lib/taxonomy-label";

interface FieldCrewRow {
  id: string;
  name: string;
  leaderId: string;
  leaderName: string | null;
  leaderEmail: string;
  leaderPhone: string | null;
  leaderLogoUrl: string | null;
  leaderLocation: string | null;
  leaderIsVerified: boolean;
  crewPrimarySection: LocalizedTaxonomy | null;
  crewSpecializations: LocalizedTaxonomy[];
}

export default function FieldCrewsDirectoryPage() {
  const [items, setItems] = useState<FieldCrewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const locale = useLocale();
  const t = useTranslations("directory");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/directory/field-crews");
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
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">{t("fieldCrewsTitle")}</h1>
      {loading ? (
        <p className="text-sm text-muted-foreground">{t("loadingFieldCrews")}</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noFieldCrews")}</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map(item => {
            const tags: LocalizedTaxonomy[] = [];
            if (item.crewPrimarySection) tags.push(item.crewPrimarySection);
            for (const spec of item.crewSpecializations) {
              tags.push(spec);
            }
            return (
              <DirectoryEntityCard
                key={item.id}
                href={`/${locale}/company/${item.leaderId}`}
                locale={locale}
                title={item.name}
                subtitle={
                  item.leaderName
                    ? `${t("fieldCrewLeaderLabel")}: ${item.leaderName}`
                    : item.leaderEmail
                }
                logoUrl={item.leaderLogoUrl}
                location={item.leaderLocation}
                isVerified={item.leaderIsVerified}
                verifiedLabel={t("verified")}
                locationLabel={t("locationLabel")}
                tags={tags.length ? tags : undefined}
                tagsHeading={t("crewSpecializationHeading")}
                metaLines={
                  <>
                    <p className="mt-1 text-xs text-muted-foreground">{item.leaderEmail}</p>
                    {item.leaderPhone && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t("phoneLabel")}: {item.leaderPhone}
                      </p>
                    )}
                    {!tags.length && (
                      <p className="mt-2 text-xs italic text-muted-foreground">{t("noCrewSpecialization")}</p>
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
