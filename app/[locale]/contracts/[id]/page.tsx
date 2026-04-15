"use client";

import { useEffect, useState, FormEvent } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { BID_CURRENCIES, formatBidMoney, type BidCurrency } from "@/lib/bid-display";
import { amountInTry } from "@/lib/exchange-rates";
import { uploadFileToStorage } from "@/lib/upload-client";

interface Contract {
  id: string;
  title: string;
  description: string;
  status: string;
  acceptedBidId?: string | null;
  dwgFiles: string | null;
  imageUrls?: string | null;
  startsAt?: string | null;
  totalDays?: number | null;
  capabilities?: Array<{
    capability: {
      id: string;
      name: string;
    };
  }>;
}

interface Bid {
  id: string;
  bidderName: string;
  amount: number | null;
  currency?: string | null;
  message?: string | null;
  documentUrl?: string | null;
  status?: string;
}

interface Comment {
  id: string;
  body: string;
}

export default function ContractDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const locale = (params?.locale as string) ?? "tr";
  const t = useTranslations("contractDetail");
  const intlLocale = locale === "tr" ? "tr-TR" : "en-US";

  const [contract, setContract] = useState<Contract | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [downloadableFiles, setDownloadableFiles] = useState<string[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [canViewBidDetails, setCanViewBidDetails] = useState(false);
  const [bidAmount, setBidAmount] = useState("");
  const [bidCurrency, setBidCurrency] = useState<BidCurrency>("TRY");
  const [bidMessage, setBidMessage] = useState("");
  const [bidDocument, setBidDocument] = useState<File | null>(null);
  const [tryPerUnit, setTryPerUnit] = useState<Record<BidCurrency, number> | null>(null);
  const [isSubmittingBid, setIsSubmittingBid] = useState(false);
  const [commentBody, setCommentBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completeRating, setCompleteRating] = useState(5);
  const [completeComment, setCompleteComment] = useState("");
  const [isAcceptingBid, setIsAcceptingBid] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isOpeningForBids, setIsOpeningForBids] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/contracts/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      setContract(data.contract);
      setBids(data.bids);
      setComments(data.comments);
      setDownloadableFiles(data.downloadableFiles ?? []);
      setImageUrls(data.imageUrls ?? []);
      setCanViewBidDetails(Boolean(data.canViewBidDetails));
    }
    if (id) {
      void load();
    }
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    async function loadFx() {
      const res = await fetch("/api/exchange-rates");
      if (!res.ok) return;
      const data = (await res.json()) as { tryPerUnit?: Record<BidCurrency, number> };
      if (!cancelled && data.tryPerUnit) {
        setTryPerUnit(data.tryPerUnit);
      }
    }
    void loadFx();
    return () => {
      cancelled = true;
    };
  }, []);

  async function submitBid(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmittingBid(true);

    try {
      let documentUrl: string | undefined;

      if (bidDocument) {
        try {
          const uploadData = await uploadFileToStorage(bidDocument, "bid-documents");
          documentUrl = uploadData.url ?? uploadData.key;
        } catch {
          setError(t("errors.uploadBidDocument"));
          return;
        }

        if (!documentUrl) {
          setError(t("errors.uploadBidDocument"));
          return;
        }
      }

      const res = await fetch(`/api/contracts/${id}/bids`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(bidAmount),
          currency: bidCurrency,
          message: bidMessage || undefined,
          documentUrl
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? t("errors.placeBid"));
        return;
      }

      const created = await res.json();
      setBids(prev => [created, ...prev]);
      setBidAmount("");
      setBidCurrency("TRY");
      setBidMessage("");
      setBidDocument(null);
    } catch {
      setError(t("errors.placeBid"));
    } finally {
      setIsSubmittingBid(false);
    }
  }

  async function submitComment(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch(`/api/contracts/${id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: commentBody })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.message ?? t("errors.addComment"));
      return;
    }
    const created = await res.json();
    setComments(prev => [created, ...prev]);
    setCommentBody("");
  }

  async function acceptBid(bidId: string) {
    setError(null);
    setIsAcceptingBid(bidId);
    try {
      const res = await fetch(`/api/contracts/${id}/accept-bid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bidId })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? t("errors.acceptBid"));
        return;
      }
      setContract(prev => prev ? { ...prev, status: "ACTIVE", acceptedBidId: bidId } : null);
      setBids(prev =>
        prev.map(b => ({
          ...b,
          status: b.id === bidId ? "ACCEPTED" : "REJECTED"
        }))
      );
    } catch {
      setError(t("errors.acceptBid"));
    } finally {
      setIsAcceptingBid(null);
    }
  }

  async function openForBids() {
    setError(null);
    setIsOpeningForBids(true);
    try {
      const res = await fetch(`/api/contracts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "OPEN_FOR_BIDS" })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? t("errors.generic"));
        return;
      }
      setContract(prev => prev ? { ...prev, status: "OPEN_FOR_BIDS" } : null);
    } catch {
      setError(t("errors.generic"));
    } finally {
      setIsOpeningForBids(false);
    }
  }

  async function completeContract(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsCompleting(true);
    try {
      const res = await fetch(`/api/contracts/${id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: completeRating, comment: completeComment || undefined })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? t("errors.completeContract"));
        return;
      }
      setContract(prev => prev ? { ...prev, status: "COMPLETED" } : null);
      setShowCompleteModal(false);
      setCompleteRating(5);
      setCompleteComment("");
    } catch {
      setError(t("errors.completeContract"));
    } finally {
      setIsCompleting(false);
    }
  }

  if (!contract) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      </section>
    );
  }

  const bidPreviewParsed = parseFloat(bidAmount.replace(",", "."));
  const bidPreviewTry =
    tryPerUnit && Number.isFinite(bidPreviewParsed) && bidPreviewParsed > 0
      ? amountInTry(bidPreviewParsed, bidCurrency, tryPerUnit)
      : null;

  return (
    <section className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-md shadow-black/[0.04] dark:border-border/60 dark:shadow-black/25">
        <div className="h-52 w-full overflow-hidden border-b border-border/50 bg-muted/35 sm:h-64 lg:h-72 dark:bg-muted/20">
          {imageUrls[0] ? (
            <img src={imageUrls[0]} alt={contract.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center bg-muted/25 dark:bg-muted/15">
              <img src="/favicon.svg" alt="" className="h-24 w-24 rounded-xl opacity-90" aria-hidden />
            </div>
          )}
        </div>
        <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[1.4fr,0.9fr]">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold sm:text-3xl">{contract.title}</h1>
              <span className="rounded-full border border-border/80 bg-muted/30 px-3 py-1 text-xs font-medium">
                {t(`statuses.${contract.status}` as any)}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="rounded-full border border-border/60 bg-background/50 px-3 py-1 dark:bg-background/20">
                {contract.startsAt
                  ? `${t("startLabel")}: ${new Date(contract.startsAt).toLocaleDateString()}`
                  : t("noStartDate")}
              </span>
              <span className="rounded-full border border-border/60 bg-background/50 px-3 py-1 dark:bg-background/20">
                {contract.totalDays
                  ? `${t("durationLabel")}: ${contract.totalDays} ${t("days")}`
                  : t("noDuration")}
              </span>
            </div>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted-foreground">
              {contract.description}
            </p>
            {contract.capabilities && contract.capabilities.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-medium text-muted-foreground">{t("requiredCapabilities")}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {contract.capabilities.map(item => (
                    <span
                      key={item.capability.id}
                      className="rounded-full border border-border/50 bg-muted/20 px-3 py-1 text-xs text-muted-foreground"
                    >
                      {item.capability.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <aside className="rounded-xl border border-border/60 bg-muted/20 p-4 dark:bg-card/70 dark:ring-1 dark:ring-inset dark:ring-white/[0.06]">
            <h2 className="text-sm font-semibold">{t("downloadableFiles")}</h2>
            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              {downloadableFiles.length > 0 ? (
                downloadableFiles.map(path => (
                  <a
                    key={path}
                    href={path}
                    download
                    className="flex items-center justify-between gap-2 rounded-lg border border-border/50 bg-card/70 px-3 py-3 transition-colors hover:bg-muted/35 dark:bg-background/30 dark:hover:bg-background/45"
                  >
                    <span className="truncate text-foreground">{path.split("/").pop()}</span>
                    <span className="shrink-0 text-xs font-medium text-primary">{t("download")}</span>
                  </a>
                ))
              ) : (
                <p className="text-sm">{t("noFiles")}</p>
              )}
            </div>
          </aside>
        </div>
      </div>

      {imageUrls.length > 1 && (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {imageUrls.slice(1).map(url => (
            <div key={url} className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
              <img src={url} alt={contract.title} className="h-56 w-full object-cover" />
            </div>
          ))}
        </div>
      )}

      <article className="rounded-2xl border border-border/70 bg-card p-4 shadow-md shadow-black/[0.04] dark:border-border/60 dark:shadow-black/25 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">{t("bidsTitle")}</h2>
          <div className="flex flex-wrap items-center gap-2">
            {canViewBidDetails && contract.status === "DRAFT" && (
              <button
                type="button"
                onClick={openForBids}
                disabled={isOpeningForBids}
                className="rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-60"
              >
                {isOpeningForBids ? t("openingForBids") : t("openForBids")}
              </button>
            )}
            {canViewBidDetails &&
              bids.length >= 2 &&
              (contract.status === "OPEN_FOR_BIDS" || contract.status === "ACTIVE") && (
                <Link
                  href={`/${locale}/contracts/${id}/compare`}
                  className="rounded-lg border border-border/60 bg-muted/25 px-3 py-2 text-sm font-medium hover:bg-muted/45"
                >
                  {t("compareOffers")}
                </Link>
              )}
            {canViewBidDetails && contract.status === "ACTIVE" && (
              <button
                type="button"
                onClick={() => setShowCompleteModal(true)}
                className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                {t("completeContract")}
              </button>
            )}
          </div>
        </div>

        {contract.status === "OPEN_FOR_BIDS" && !canViewBidDetails && (
          <form
            onSubmit={submitBid}
            className="mb-6 space-y-3 rounded-xl border border-border/50 bg-muted/10 p-4 dark:bg-background/25"
          >
            <h3 className="text-base font-semibold">{t("bid.title")}</h3>
            <p className="text-xs text-muted-foreground">{t("bid.hint")}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="block text-xs font-medium">{t("bid.amount")}</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  value={bidAmount}
                  onChange={e => setBidAmount(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium">{t("bid.currency")}</label>
                <select
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  value={bidCurrency}
                  onChange={e => setBidCurrency(e.target.value as BidCurrency)}
                >
                  {BID_CURRENCIES.map(c => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {bidPreviewTry != null && bidCurrency !== "TRY" && (
              <p className="text-xs text-muted-foreground">
                {t("bid.tryPreview", {
                  amount: formatBidMoney(bidPreviewTry, "TRY", intlLocale)
                })}
              </p>
            )}
            <div className="space-y-1">
              <label className="block text-xs font-medium">{t("bid.message")}</label>
              <textarea
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                rows={3}
                value={bidMessage}
                onChange={e => setBidMessage(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium">{t("bid.document")}</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,image/*"
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                onChange={e => setBidDocument(e.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-muted-foreground">{t("bid.documentHint")}</p>
              {bidDocument && <p className="text-xs text-muted-foreground">{bidDocument.name}</p>}
            </div>
            <button
              type="submit"
              disabled={isSubmittingBid}
              className="w-full rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground disabled:opacity-60 sm:w-auto"
            >
              {isSubmittingBid ? t("bid.submitting") : t("bid.submit")}
            </button>
          </form>
        )}

        {!canViewBidDetails && bids.length > 0 && (
          <p className="mb-3 text-xs text-muted-foreground">{t("bidsPublicHint")}</p>
        )}

        <div className="space-y-3">
          {bids.map(b => {
            const cur = (b.currency ?? "TRY") as BidCurrency;
            const amt = b.amount != null ? Number(b.amount) : null;
            const approxTry =
              canViewBidDetails && tryPerUnit && amt != null && cur !== "TRY"
                ? amountInTry(amt, cur, tryPerUnit)
                : null;
            return (
              <div
                key={b.id}
                className={`rounded-xl border p-4 text-sm shadow-sm transition-colors ${
                  b.status === "ACCEPTED"
                    ? "border-emerald-500/45 bg-emerald-500/[0.07] dark:bg-emerald-500/[0.12]"
                    : "border-border/60 bg-card hover:border-border"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium leading-snug">{b.bidderName}</p>
                  <div className="flex items-center gap-2">
                    {b.status === "ACCEPTED" && (
                      <span className="rounded-md bg-emerald-600 px-2 py-0.5 text-xs font-medium text-white">
                        {t("bidAccepted")}
                      </span>
                    )}
                    {b.status === "REJECTED" && (
                      <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {t("bidRejected")}
                      </span>
                    )}
                    {canViewBidDetails &&
                      contract.status === "OPEN_FOR_BIDS" &&
                      (b.status === "PENDING" || !b.status) && (
                        <button
                          type="button"
                          onClick={() => acceptBid(b.id)}
                          disabled={isAcceptingBid !== null}
                          className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
                        >
                          {isAcceptingBid === b.id ? t("accepting") : t("acceptBid")}
                        </button>
                      )}
                  </div>
                </div>
                {canViewBidDetails && amt != null && (
                  <p className="mt-2 text-base font-semibold tabular-nums">
                    {formatBidMoney(amt, cur, intlLocale)}
                  </p>
                )}
                {canViewBidDetails && approxTry != null && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("bid.tryPreview", {
                      amount: formatBidMoney(approxTry, "TRY", intlLocale)
                    })}
                  </p>
                )}
                {canViewBidDetails && b.message && (
                  <p className="mt-2 text-xs text-muted-foreground whitespace-pre-line">{b.message}</p>
                )}
                {canViewBidDetails && b.documentUrl && (
                  <a
                    href={b.documentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex text-xs font-medium text-primary hover:underline"
                  >
                    {t("bid.openDocument")}
                  </a>
                )}
              </div>
            );
          })}
          {bids.length === 0 && <p className="text-xs text-muted-foreground">{t("noBids")}</p>}
        </div>

        {canViewBidDetails &&
          tryPerUnit &&
          bids.some(b => b.amount != null && b.currency && b.currency !== "TRY") && (
            <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">{t("bid.fxDisclaimer")}</p>
          )}
      </article>

      <article className="rounded-2xl border border-border/70 bg-card p-4 shadow-md shadow-black/[0.04] dark:border-border/60 dark:shadow-black/25 sm:p-6">
        <h2 className="mb-3 text-lg font-semibold tracking-tight">{t("commentsTitle")}</h2>
        <form onSubmit={submitComment} className="mb-6 space-y-3">
          <p className="text-xs text-muted-foreground">{t("comment.hint")}</p>
          <textarea
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            rows={4}
            value={commentBody}
            onChange={e => setCommentBody(e.target.value)}
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground sm:w-auto"
          >
            {t("comment.submit")}
          </button>
        </form>
        <div className="space-y-2">
          {comments.map(c => (
            <div
              key={c.id}
              className="rounded-xl border border-border/50 bg-muted/5 p-3 text-sm dark:bg-background/20"
            >
              <p className="whitespace-pre-line">{c.body}</p>
            </div>
          ))}
          {comments.length === 0 && <p className="text-xs text-muted-foreground">{t("noComments")}</p>}
        </div>
      </article>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {showCompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-w-md w-full rounded-xl border bg-card p-6 shadow-lg">
            <h3 className="text-lg font-semibold">{t("completeModal.title")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t("completeModal.description")}</p>
            <form onSubmit={completeContract} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium">{t("completeModal.ratingLabel")}</label>
                <div className="mt-2 flex gap-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setCompleteRating(n)}
                      className={`h-10 w-10 rounded-lg border text-lg font-medium transition ${
                        completeRating >= n
                          ? "border-amber-500 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          : "border-muted bg-muted/50 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("completeModal.ratingHint", { rating: completeRating })}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium">{t("completeModal.commentLabel")}</label>
                <textarea
                  className="mt-1 w-full rounded border px-3 py-2 text-sm"
                  rows={3}
                  value={completeComment}
                  onChange={e => setCompleteComment(e.target.value)}
                  placeholder={t("completeModal.commentPlaceholder")}
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCompleteModal(false)}
                  className="flex-1 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  {t("completeModal.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isCompleting}
                  className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
                >
                  {isCompleting ? t("completeModal.submitting") : t("completeModal.submit")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

