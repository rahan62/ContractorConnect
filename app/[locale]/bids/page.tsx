"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { formatBidMoney, type BidCurrency } from "@/lib/bid-display";

interface BidItem {
  id: string;
  amount: number;
  currency?: BidCurrency;
  message: string | null;
  documentUrl: string | null;
  createdAt: string;
  contract: {
    id: string;
    title: string;
    status: "DRAFT" | "OPEN_FOR_BIDS" | "ACTIVE" | "COMPLETED" | "CANCELLED";
    startsAt: string | null;
    totalDays: number | null;
    contractorName: string;
  };
}

export default function MyBidsPage() {
  const router = useRouter();
  const locale = useLocale();
  const intlLocale = locale === "tr" ? "tr-TR" : "en-US";
  const t = useTranslations("myBids");
  const { data: session, status } = useSession();
  const [bids, setBids] = useState<BidItem[]>([]);
  const [isForbidden, setIsForbidden] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/${locale}/auth/signin`);
    }
  }, [locale, router, status]);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/bids");

      if (res.status === 403) {
        setIsForbidden(true);
        return;
      }

      if (!res.ok) {
        return;
      }

      const data = await res.json();
      setBids(data);
    }

    if (status === "authenticated") {
      void load();
    }
  }, [status]);

  if (status === "loading" || !session) {
    return (
      <section className="app-page">
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      </section>
    );
  }

  if (isForbidden) {
    return (
      <section className="app-page">
        <div className="app-card-sm p-5 text-sm text-muted-foreground">{t("forbidden")}</div>
      </section>
    );
  }

  return (
    <section className="app-page">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
      </div>

      <div className="space-y-4">
        {bids.map(bid => (
          <div key={bid.id} className="app-card p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t("contractor")}: {bid.contract.contractorName}
                </p>
                <h2 className="text-lg font-semibold">{bid.contract.title}</h2>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full border px-3 py-1">{t(`statuses.${bid.contract.status}`)}</span>
                  <span className="rounded-full border px-3 py-1">
                    {bid.contract.startsAt
                      ? `${t("startLabel")}: ${new Date(bid.contract.startsAt).toLocaleDateString()}`
                      : t("noStartDate")}
                  </span>
                  <span className="rounded-full border px-3 py-1">
                    {bid.contract.totalDays
                      ? `${t("durationLabel")}: ${bid.contract.totalDays} ${t("days")}`
                      : t("noDuration")}
                  </span>
                </div>
              </div>

              <Link
                href={`/${locale}/contracts/${bid.contract.id}`}
                className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                {t("openContract")}
              </Link>
            </div>

            <div className="mt-4 grid gap-4 rounded-xl border border-border/50 bg-muted/15 p-4 text-sm sm:grid-cols-2 dark:bg-background/30">
              <div>
                <p className="text-xs text-muted-foreground">{t("amount")}</p>
                <p className="mt-1 text-lg font-semibold tabular-nums">
                  {formatBidMoney(
                    Number(bid.amount),
                    bid.currency ?? "TRY",
                    intlLocale
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("submittedAt")}</p>
                <p className="mt-1">{new Date(bid.createdAt).toLocaleString()}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs text-muted-foreground">{t("message")}</p>
                <p className="mt-1 whitespace-pre-line">{bid.message || t("noMessage")}</p>
              </div>
              {bid.documentUrl && (
                <div className="sm:col-span-2">
                  <a
                    href={bid.documentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center rounded-lg border border-border/60 px-4 py-2 text-sm font-medium hover:bg-muted/40"
                  >
                    {t("openDocument")}
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}

        {bids.length === 0 && <p className="text-sm text-muted-foreground">{t("empty")}</p>}
      </div>
    </section>
  );
}
