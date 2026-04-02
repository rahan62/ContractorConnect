"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatBidMoney, type BidCurrency } from "@/lib/bid-display";

type LatestOfferRow = {
    contractId: string;
    title: string;
    status: string;
    latestBidAt: string;
    latestBidAmount: number;
    latestBidCurrency: string;
    bidderName: string;
};

type ContractorSummary = {
  metrics: {
    totalContracts: number;
    totalUrgentJobs: number;
    totalContractBudgetSum: number;
    settledSubcontractorCount: number;
    avgPartnerTrustScore: number | null;
  };
  latestOfferContracts: LatestOfferRow[];
};

type SubSummary = {
  metrics: {
    completedContracts: number;
    activeContracts: number;
    pendingBidsOnOpen: number;
    teamsYouBelongTo: number;
    verifiedReferences: number;
  };
};

type TeamSummary = {
  metrics: {
    completedJobs: number;
    urgentJobsCompleted: number;
    activeJobs: number;
    pendingBidsOnOpen: number;
    teamsYouLead: number;
    rosterMembers: number;
    teamName: string | null;
  };
};

type SummaryResponse =
  | {
      userType: "CONTRACTOR";
      companyName: string | null;
      payload: ContractorSummary;
    }
  | {
      userType: "SUBCONTRACTOR";
      companyName: string | null;
      payload: SubSummary;
    }
  | {
      userType: "TEAM";
      companyName: string | null;
      payload: TeamSummary;
    }
  | {
      userType: null;
      companyName: string | null;
      payload: null;
    };

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/80 px-4 py-3 shadow-sm dark:border-border/50 dark:bg-card/60">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const locale = useLocale();
  const intlLocale = locale === "tr" ? "tr-TR" : "en-US";
  const t = useTranslations("dashboard");
  const tDetail = useTranslations("contractDetail");
  const { data: session, status } = useSession();
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/${locale}/auth/signin`);
    }
  }, [status, router, locale]);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await fetch("/api/dashboard/summary");
        if (!res.ok) {
          setError(true);
          return;
        }
        const data = (await res.json()) as SummaryResponse;
        if (!cancelled) setSummary(data);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status]);

  if (!session && status !== "loading") {
    return (
      <section className="app-page">
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      </section>
    );
  }

  if (status === "loading" || !session) {
    return (
      <section className="app-page">
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      </section>
    );
  }

  const basePath = `/${locale}`;

  return (
    <section className="app-page space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("welcome", { email: session.user?.email ?? "-" })}</p>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div
            className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"
            aria-hidden
          />
          {t("loading")}
        </div>
      )}

      {error && !loading && <p className="text-sm text-red-600 dark:text-red-400">{t("loadError")}</p>}

      {!loading && !error && summary?.userType === "CONTRACTOR" && summary.payload && "latestOfferContracts" in summary.payload && (
        <>
          <div>
            <h2 className="mb-3 text-lg font-semibold">{t("contractor.metricsTitle")}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <MetricCard label={t("contractor.totalContracts")} value={summary.payload.metrics.totalContracts} />
              <MetricCard label={t("contractor.totalUrgentJobs")} value={summary.payload.metrics.totalUrgentJobs} />
              <MetricCard
                label={t("contractor.totalBudget")}
                value={new Intl.NumberFormat(intlLocale).format(summary.payload.metrics.totalContractBudgetSum)}
              />
              <MetricCard
                label={t("contractor.settledSubs")}
                value={summary.payload.metrics.settledSubcontractorCount}
              />
              <MetricCard
                label={t("contractor.avgTrust")}
                value={summary.payload.metrics.avgPartnerTrustScore ?? "—"}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{t("contractor.budgetHint")}</p>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold">{t("contractor.latestTitle")}</h2>
            {summary.payload.latestOfferContracts.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("contractor.noLatestOffers")}</p>
            ) : (
              <ul className="divide-y divide-border/60 rounded-xl border border-border/60 bg-card/50 dark:bg-card/40">
                {summary.payload.latestOfferContracts.map(row => (
                  <li key={row.contractId} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-medium">{row.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {tDetail(`statuses.${row.status}` as Parameters<typeof tDetail>[0])}
                        {" · "}
                        {t("contractor.lastBid")}:{" "}
                        {formatBidMoney(
                          row.latestBidAmount,
                          row.latestBidCurrency as BidCurrency,
                          intlLocale
                        )}{" "}
                        · {row.bidderName}
                      </p>
                    </div>
                    <Link
                      href={`${basePath}/contracts/${row.contractId}`}
                      className="shrink-0 rounded-lg border border-border/60 px-3 py-1.5 text-sm font-medium hover:bg-muted/60"
                    >
                      {t("contractor.viewContract")}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      {!loading && !error && summary?.userType === "SUBCONTRACTOR" && summary.payload && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">{t("subcontractor.metricsTitle")}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <MetricCard label={t("subcontractor.completedContracts")} value={summary.payload.metrics.completedContracts} />
            <MetricCard label={t("subcontractor.activeContracts")} value={summary.payload.metrics.activeContracts} />
            <MetricCard label={t("subcontractor.pendingBids")} value={summary.payload.metrics.pendingBidsOnOpen} />
            <MetricCard label={t("subcontractor.fieldCrewsYouBelongTo")} value={summary.payload.metrics.teamsYouBelongTo} />
            <MetricCard label={t("subcontractor.verifiedReferences")} value={summary.payload.metrics.verifiedReferences} />
          </div>
        </div>
      )}

      {!loading && !error && summary?.userType === "TEAM" && summary.payload && (
        <div className="space-y-4">
          {summary.payload.metrics.teamName && (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{t("fieldCrew.crewLabel")}:</span> {summary.payload.metrics.teamName}
            </p>
          )}
          <div>
            <h2 className="mb-3 text-lg font-semibold">{t("fieldCrew.metricsTitle")}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <MetricCard label={t("fieldCrew.completedJobs")} value={summary.payload.metrics.completedJobs} />
              <MetricCard label={t("fieldCrew.urgentCompleted")} value={summary.payload.metrics.urgentJobsCompleted} />
              <MetricCard label={t("fieldCrew.activeJobs")} value={summary.payload.metrics.activeJobs} />
              <MetricCard label={t("fieldCrew.pendingBids")} value={summary.payload.metrics.pendingBidsOnOpen} />
              <MetricCard label={t("fieldCrew.crewsYouLead")} value={summary.payload.metrics.teamsYouLead} />
              <MetricCard label={t("fieldCrew.rosterMembers")} value={summary.payload.metrics.rosterMembers} />
            </div>
          </div>
        </div>
      )}

      {!loading && !error && (!summary?.userType || !summary.payload) && (
        <p className="text-sm text-muted-foreground">{t("generic.hint")}</p>
      )}
    </section>
  );
}
