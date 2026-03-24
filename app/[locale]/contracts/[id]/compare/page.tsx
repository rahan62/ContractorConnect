"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface Bid {
  id: string;
  bidderName: string;
  amount: number | null;
  message?: string | null;
  documentUrl?: string | null;
  createdAt?: string;
}

interface Contract {
  id: string;
  title: string;
}

export default function CompareOffersPage() {
  const params = useParams();
  const id = params?.id as string;
  const locale = (params?.locale as string) ?? "tr";
  const t = useTranslations("compareOffers");

  const [contract, setContract] = useState<Contract | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [canViewBidDetails, setCanViewBidDetails] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetch(`/api/contracts/${id}`);
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const data = await res.json();
      setContract(data.contract);
      setBids(data.bids ?? []);
      setCanViewBidDetails(Boolean(data.canViewBidDetails));
      setLoading(false);
    }
    if (id) void load();
  }, [id]);

  if (loading) {
    return (
      <section className="mx-auto max-w-6xl px-4 py-8">
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      </section>
    );
  }

  if (!contract) {
    return (
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-xl border bg-card p-5 text-sm text-muted-foreground">{t("notFound")}</div>
      </section>
    );
  }

  if (!canViewBidDetails) {
    return (
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-xl border bg-card p-5 text-sm text-muted-foreground">{t("forbidden")}</div>
        <Link
          href={`/${locale}/contracts/${id}`}
          className="mt-4 inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          ← {t("backToContract")}
        </Link>
      </section>
    );
  }

  if (bids.length < 2) {
    return (
      <section className="mx-auto max-w-6xl px-4 py-8 space-y-4">
        <div className="rounded-xl border bg-card p-5 text-sm text-muted-foreground">{t("needTwoOffers")}</div>
        <Link
          href={`/${locale}/contracts/${id}`}
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          ← {t("backToContract")}
        </Link>
      </section>
    );
  }

  const rows = [
    { key: "bidder", label: t("fields.bidder"), render: (b: Bid) => b.bidderName },
    {
      key: "amount",
      label: t("fields.amount"),
      render: (b: Bid) => (b.amount != null ? b.amount.toLocaleString() : "-")
    },
    {
      key: "message",
      label: t("fields.message"),
      render: (b: Bid) => (b.message ? b.message : "-")
    },
    {
      key: "document",
      label: t("fields.document"),
      render: (b: Bid) =>
        b.documentUrl ? (
          <a
            href={b.documentUrl}
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:underline"
          >
            {t("openDocument")}
          </a>
        ) : (
          "-"
        )
    },
    {
      key: "submitted",
      label: t("fields.submitted"),
      render: (b: Bid) =>
        b.createdAt ? new Date(b.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" }) : "-"
    }
  ];

  return (
    <section className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link
            href={`/${locale}/contracts/${id}`}
            className="mb-2 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            ← {t("backToContract")}
          </Link>
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("hint")} — {contract.title}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">{t("fields.field")}</th>
              {bids.map(bid => (
                <th key={bid.id} className="px-4 py-3 text-left font-medium">
                  {bid.bidderName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.key} className="border-b last:border-b-0">
                <td className="px-4 py-3 font-medium">{row.label}</td>
                {bids.map(bid => (
                  <td key={bid.id} className="px-4 py-3 text-muted-foreground">
                    {row.render(bid)}
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
