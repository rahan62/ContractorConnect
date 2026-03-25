"use client";

import Link from "next/link";
import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { formatBidMoney, type BidCurrency } from "@/lib/bid-display";

interface Bid {
  id: string;
  bidderName: string;
  amount: number;
  currency?: string;
  message?: string | null;
  documentUrl?: string | null;
  status?: string;
}

interface Contract {
  id: string;
  title: string;
  description: string | null;
  status: string;
  acceptedBidId?: string | null;
  imageUrls?: string | null;
  startsAt?: string | null;
  totalDays?: number | null;
  capabilities?: Array<{ capability: { id: string; name: string } }>;
  bids: Bid[];
}

interface SimpleContract {
  id: string;
  title: string;
  description: string | null;
  imageUrls?: string | null;
  startsAt?: string | null;
  totalDays?: number | null;
  contractorId?: string | null;
}

export default function ContractsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [simpleContracts, setSimpleContracts] = useState<SimpleContract[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isContractor, setIsContractor] = useState(false);
  const [loading, setLoading] = useState(true);
  const locale = useLocale();
  const intlLocale = locale === "tr" ? "tr-TR" : "en-US";
  const t = useTranslations("contracts");
  const tDetail = useTranslations("contractDetail");

  const [showCompleteModal, setShowCompleteModal] = useState<string | null>(null);
  const [completeRating, setCompleteRating] = useState(5);
  const [completeComment, setCompleteComment] = useState("");
  const [isAcceptingBid, setIsAcceptingBid] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState<string | null>(null);
  const [isOpeningForBids, setIsOpeningForBids] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/${locale}/auth/signin`);
    }
  }, [status, router, locale]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const mineRes = await fetch("/api/contracts/mine");
        if (mineRes.ok) {
          const data = await mineRes.json();
          setContracts(data);
          setIsContractor(true);
          return;
        }
        const res = await fetch("/api/contracts");
        if (!res.ok) return;
        const data = await res.json();
        setSimpleContracts(data);
      } finally {
        setLoading(false);
      }
    }
    if (status === "authenticated") {
      void load();
    }
  }, [status]);

  async function acceptBid(contractId: string, bidId: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setError(null);
    setIsAcceptingBid(bidId);
    try {
      const res = await fetch(`/api/contracts/${contractId}/accept-bid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bidId })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? tDetail("errors.acceptBid"));
        return;
      }
      setContracts(prev =>
        prev.map(c =>
          c.id === contractId
            ? {
                ...c,
                status: "ACTIVE",
                acceptedBidId: bidId,
                bids: c.bids.map(b => ({
                  ...b,
                  status: b.id === bidId ? "ACCEPTED" : "REJECTED"
                }))
              }
            : c
        )
      );
    } catch {
      setError(tDetail("errors.acceptBid"));
    } finally {
      setIsAcceptingBid(null);
    }
  }

  async function openForBids(contractId: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setError(null);
    setIsOpeningForBids(contractId);
    try {
      const res = await fetch(`/api/contracts/${contractId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "OPEN_FOR_BIDS" })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? tDetail("errors.generic"));
        return;
      }
      setContracts(prev =>
        prev.map(c => (c.id === contractId ? { ...c, status: "OPEN_FOR_BIDS" } : c))
      );
    } catch {
      setError(tDetail("errors.generic"));
    } finally {
      setIsOpeningForBids(null);
    }
  }

  async function completeContract(e: FormEvent, contractId: string) {
    e.preventDefault();
    e.stopPropagation();
    setError(null);
    setIsCompleting(contractId);
    try {
      const res = await fetch(`/api/contracts/${contractId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: completeRating, comment: completeComment || undefined })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? tDetail("errors.completeContract"));
        return;
      }
      setContracts(prev =>
        prev.map(c => (c.id === contractId ? { ...c, status: "COMPLETED" } : c))
      );
      setShowCompleteModal(null);
      setCompleteRating(5);
      setCompleteComment("");
    } catch {
      setError(tDetail("errors.completeContract"));
    } finally {
      setIsCompleting(null);
    }
  }

  if (status === "loading" || !session) {
    return (
      <section className="app-page">
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      </section>
    );
  }

  if (!isContractor) {
    return (
      <section className="app-page">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <div className="space-y-3">
          {simpleContracts.map(c => (
            <Link
              key={c.id}
              href={`/${locale}/contracts/${c.id}`}
              className="app-card-sm block overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md dark:hover:shadow-black/25"
            >
              <div className="h-44 w-full overflow-hidden border-b border-border/50 app-hero-placeholder">
                {c.imageUrls?.split(";").filter(Boolean)[0] ? (
                  <img
                    src={c.imageUrls.split(";").filter(Boolean)[0]}
                    alt={c.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="app-hero-placeholder-inner h-full">
                    <img src="/taseron_logo.png" alt="Taseron" className="h-16 w-16 rounded-md opacity-70" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <h2 className="font-medium">{c.title}</h2>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.description ?? ""}</p>
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span>{c.startsAt ? `${t("startLabel")}: ${new Date(c.startsAt).toLocaleDateString()}` : t("noStartDate")}</span>
                  <span>{c.totalDays ? `${c.totalDays} ${t("days")}` : t("noDuration")}</span>
                </div>
              </div>
            </Link>
          ))}
          {simpleContracts.length === 0 && (
            <p className="text-sm text-muted-foreground">{t("empty")}</p>
          )}
        </div>
      </section>
    );
  }

  const displayContracts = contracts;

  return (
    <section className="app-page">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{t("myContracts")}</h1>
        <Link
          href={`/${locale}/contracts/new`}
          className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90 sm:w-auto"
        >
          {t("new")}
        </Link>
      </div>

      {error && <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {loading ? (
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      ) : (
        <div className="space-y-3">
          {displayContracts.map(c => {
            const isExpanded = expandedId === c.id;
            const imageUrl = c.imageUrls?.split(";").filter(Boolean)[0];
            return (
              <div
                key={c.id}
                className="app-card-sm overflow-hidden transition hover:shadow-md dark:hover:shadow-black/25"
              >
                <Link
                  href={`/${locale}/contracts/${c.id}`}
                  className="block"
                  onClick={e => {
                    if ((e.target as HTMLElement).closest("button")) {
                      e.preventDefault();
                    }
                  }}
                >
                  <div className="flex flex-col sm:flex-row">
                    <div className="h-36 w-48 shrink-0 overflow-hidden app-hero-placeholder sm:h-auto sm:min-h-[140px]">
                      {imageUrl ? (
                        <img src={imageUrl} alt={c.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="app-hero-placeholder-inner h-full min-h-[100px]">
                          <img src="/taseron_logo.png" alt="Taseron" className="h-12 w-12 rounded-md opacity-70" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h2 className="font-medium">{c.title}</h2>
                          <span className="mt-1 inline-block rounded-full border px-2 py-0.5 text-xs font-medium">
                            {tDetail(`statuses.${c.status}` as any)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {c.status === "DRAFT" && (
                            <button
                              type="button"
                              onClick={e => openForBids(c.id, e)}
                              disabled={isOpeningForBids !== null}
                              className="rounded bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-60"
                            >
                              {isOpeningForBids === c.id ? tDetail("openingForBids") : tDetail("openForBids")}
                            </button>
                          )}
                          {c.status === "ACTIVE" && (
                            <button
                              type="button"
                              onClick={e => {
                                e.preventDefault();
                                e.stopPropagation();
                                setShowCompleteModal(c.id);
                              }}
                              className="rounded bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                            >
                              {tDetail("completeContract")}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={e => {
                              e.preventDefault();
                              e.stopPropagation();
                              setExpandedId(isExpanded ? null : c.id);
                            }}
                            className="rounded border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                          >
                            {isExpanded ? t("collapse") : t("expand")}
                          </button>
                        </div>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                        {c.description ?? ""}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span>{c.startsAt ? `${t("startLabel")}: ${new Date(c.startsAt).toLocaleDateString()}` : t("noStartDate")}</span>
                        <span>{c.totalDays ? `${c.totalDays} ${t("days")}` : t("noDuration")}</span>
                      </div>
                    </div>
                  </div>
                </Link>

                {isExpanded && (
                  <div className="border-t border-border/60 bg-muted/20 p-4 dark:bg-background/25">
                    <h3 className="mb-3 text-sm font-semibold">{tDetail("bidsTitle")}</h3>
                    {c.bids.length === 0 ? (
                      <p className="text-xs text-muted-foreground">{tDetail("noBids")}</p>
                    ) : (
                      <div className="space-y-2">
                        {c.bids.map(b => (
                          <div
                            key={b.id}
                            className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 p-3 text-sm ${
                              b.status === "ACCEPTED"
                                ? "border-emerald-500/45 bg-emerald-500/[0.07] dark:bg-emerald-500/[0.12]"
                                : "bg-background/50 dark:bg-background/20"
                            }`}
                          >
                            <div>
                              <p className="font-medium">{b.bidderName}</p>
                              {b.amount != null && (
                                <p className="text-xs text-muted-foreground tabular-nums">
                                  {formatBidMoney(
                                    Number(b.amount),
                                    (b.currency ?? "TRY") as BidCurrency,
                                    intlLocale
                                  )}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {b.status === "ACCEPTED" && (
                                <span className="rounded-md bg-emerald-600 px-2 py-0.5 text-xs text-white">
                                  {tDetail("bidAccepted")}
                                </span>
                              )}
                              {b.status === "REJECTED" && (
                                <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                  {tDetail("bidRejected")}
                                </span>
                              )}
                              {c.status === "OPEN_FOR_BIDS" && (b.status === "PENDING" || !b.status) && (
                                <button
                                  type="button"
                                  onClick={e => acceptBid(c.id, b.id, e)}
                                  disabled={isAcceptingBid !== null}
                                  className="rounded bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
                                >
                                  {isAcceptingBid === b.id ? tDetail("accepting") : tDetail("acceptBid")}
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <Link
                      href={`/${locale}/contracts/${c.id}`}
                      className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
                    >
                      {t("viewFullPage")}
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
          {displayContracts.length === 0 && (
            <p className="text-sm text-muted-foreground">{t("empty")}</p>
          )}
        </div>
      )}

      {showCompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[1px]">
          <div className="max-w-md w-full rounded-xl border border-border/60 bg-card p-6 shadow-lg dark:shadow-black/40">
            <h3 className="text-lg font-semibold">{tDetail("completeModal.title")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{tDetail("completeModal.description")}</p>
            <form
              onSubmit={e => completeContract(e, showCompleteModal)}
              className="mt-4 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium">{tDetail("completeModal.ratingLabel")}</label>
                <div className="mt-2 flex gap-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setCompleteRating(n)}
                      className={`h-10 w-10 rounded-lg border text-lg font-medium transition ${
                        completeRating >= n ? "border-amber-500 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "border-muted bg-muted/50 text-muted-foreground"
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {tDetail("completeModal.ratingHint", { rating: completeRating })}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium">{tDetail("completeModal.commentLabel")}</label>
                <textarea
                  className="mt-1 w-full rounded border px-3 py-2 text-sm"
                  rows={3}
                  value={completeComment}
                  onChange={e => setCompleteComment(e.target.value)}
                  placeholder={tDetail("completeModal.commentPlaceholder")}
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCompleteModal(null)}
                  className="flex-1 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  {tDetail("completeModal.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isCompleting !== null}
                  className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
                >
                  {isCompleting ? tDetail("completeModal.submitting") : tDetail("completeModal.submit")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
