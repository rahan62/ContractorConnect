"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

interface CompareItem {
  id: string;
  companyName: string;
  location: string | null;
  isVerified: boolean;
  profileCompleteness: number;
  documentCompleteness: number;
  referenceCount: number;
  completedJobCount: number;
  responseSpeedHours: number | null;
  notes: string | null;
  specialties: string[];
  trustScore: number | null;
  trustGrade: string | null;
  averageQuoteValue: number | null;
}

export default function ComparePage() {
  const searchParams = useSearchParams();
  const t = useTranslations("compare");
  const [items, setItems] = useState<CompareItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const ids = searchParams.get("ids");
      const res = await fetch(`/api/compare?ids=${encodeURIComponent(ids ?? "")}`);
      if (res.ok) {
        setItems(await res.json());
      }
      setLoading(false);
    }

    void load();
  }, [searchParams]);

  if (loading) {
    return (
      <section className="mx-auto max-w-6xl px-4 py-8">
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      </section>
    );
  }

  if (items.length < 2) {
    return (
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-xl border bg-card p-5 text-sm text-muted-foreground">{t("empty")}</div>
      </section>
    );
  }

  const rows = [
    { key: "location", label: t("fields.location"), render: (item: CompareItem) => item.location ?? "-" },
    {
      key: "verification",
      label: t("fields.verification"),
      render: (item: CompareItem) => (item.isVerified ? t("verified") : t("notVerified"))
    },
    {
      key: "trustScore",
      label: t("fields.trustScore"),
      render: (item: CompareItem) => (item.trustScore != null ? `${item.trustScore} / ${item.trustGrade}` : "-")
    },
    {
      key: "profileCompleteness",
      label: t("fields.profileCompleteness"),
      render: (item: CompareItem) => `${item.profileCompleteness}%`
    },
    {
      key: "documentCompleteness",
      label: t("fields.documentCompleteness"),
      render: (item: CompareItem) => `${item.documentCompleteness}%`
    },
    {
      key: "referenceCount",
      label: t("fields.referenceCount"),
      render: (item: CompareItem) => String(item.referenceCount)
    },
    {
      key: "completedJobCount",
      label: t("fields.completedJobCount"),
      render: (item: CompareItem) => String(item.completedJobCount)
    },
    {
      key: "responseSpeed",
      label: t("fields.responseSpeed"),
      render: (item: CompareItem) =>
        item.responseSpeedHours != null ? `${item.responseSpeedHours} ${t("hours")}` : "-"
    },
    {
      key: "specialties",
      label: t("fields.specialties"),
      render: (item: CompareItem) => (item.specialties.length ? item.specialties.join(", ") : "-")
    },
    {
      key: "quoteValue",
      label: t("fields.quoteValue"),
      render: (item: CompareItem) => (item.averageQuoteValue != null ? String(item.averageQuoteValue) : "-")
    },
    {
      key: "notes",
      label: t("fields.notes"),
      render: (item: CompareItem) => item.notes ?? "-"
    }
  ];

  return (
    <section className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("hint")}</p>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">{t("fields.field")}</th>
              {items.map(item => (
                <th key={item.id} className="px-4 py-3 text-left font-medium">
                  {item.companyName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.key} className="border-b last:border-b-0">
                <td className="px-4 py-3 font-medium">{row.label}</td>
                {items.map(item => (
                  <td key={item.id} className="px-4 py-3 text-muted-foreground">
                    {row.render(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
