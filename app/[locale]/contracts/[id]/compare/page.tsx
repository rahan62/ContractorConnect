"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { formatBidMoney, type BidCurrency } from "@/lib/bid-display";
import { amountInTry } from "@/lib/exchange-rates";

interface Bid {
  id: string;
  bidderName: string;
  amount: number | null;
  currency?: string | null;
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
  const intlLocale = locale === "tr" ? "tr-TR" : "en-US";

  const [contract, setContract] = useState<Contract | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [canViewBidDetails, setCanViewBidDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tryPerUnit, setTryPerUnit] = useState<Record<BidCurrency, number> | null>(null);

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

  useEffect(() => {
    let cancelled = false;
    async function loadFx() {
      const res = await fetch("/api/exchange-rates");
      if (!res.ok) return;
      const data = (await res.json()) as { tryPerUnit?: Record<BidCurrency, number> };
      if (!cancelled && data.tryPerUnit) setTryPerUnit(data.tryPerUnit);
    }
    void loadFx();
    return () => {
      cancelled = true;
    };
  }, []);

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
      render: (b: Bid) => {
        if (b.amount == null) return "-";
        const cur = (b.currency ?? "TRY") as BidCurrency;
        return formatBidMoney(Number(b.amount), cur, intlLocale);
      }
    },
    {
      key: "approxTry",
      label: t("fields.approxTry"),
      render: (b: Bid) => {
        if (b.amount == null || !tryPerUnit) return "-";
        const cur = (b.currency ?? "TRY") as BidCurrency;
        if (cur === "TRY") return formatBidMoney(Number(b.amount), "TRY", intlLocale);
        const approx = amountInTry(Number(b.amount), cur, tryPerUnit);
        return formatBidMoney(approx, "TRY", intlLocale);
      }
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

      <div className="overflow-x-auto rounded-xl border border-border/60 bg-card">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 bg-muted/35">
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
      {tryPerUnit && (
        <p className="text-[11px] leading-relaxed text-muted-foreground">{t("fxDisclaimer")}</p>
      )}
    </section>
  );
}
