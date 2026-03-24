"use client";

import { useEffect, useState, FormEvent } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface Contract {
  id: string;
  title: string;
  description: string;
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
  message?: string | null;
  documentUrl?: string | null;
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

  const [contract, setContract] = useState<Contract | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [downloadableFiles, setDownloadableFiles] = useState<string[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [canViewBidDetails, setCanViewBidDetails] = useState(false);
  const [bidAmount, setBidAmount] = useState("");
  const [bidMessage, setBidMessage] = useState("");
  const [bidDocument, setBidDocument] = useState<File | null>(null);
  const [isSubmittingBid, setIsSubmittingBid] = useState(false);
  const [commentBody, setCommentBody] = useState("");
  const [error, setError] = useState<string | null>(null);

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

  async function submitBid(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmittingBid(true);

    try {
      let documentUrl: string | undefined;

      if (bidDocument) {
        const fd = new FormData();
        fd.append("file", bidDocument);
        fd.append("folder", "bid-documents");

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: fd
        });

        if (!uploadRes.ok) {
          setError(t("errors.uploadBidDocument"));
          return;
        }

        const uploadData = await uploadRes.json();
        documentUrl = uploadData.url ?? uploadData.path ?? uploadData.key;

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

  if (!contract) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="h-52 w-full overflow-hidden border-b bg-slate-100 sm:h-64 lg:h-72">
          {imageUrls[0] ? (
            <img src={imageUrls[0]} alt={contract.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center bg-slate-50">
              <img src="/taseron_logo.png" alt="Taseron" className="h-24 w-24 rounded-xl opacity-70" />
            </div>
          )}
        </div>
        <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[1.4fr,0.9fr]">
          <div>
            <h1 className="text-2xl font-semibold sm:text-3xl">{contract.title}</h1>
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="rounded-full border px-3 py-1">
                {contract.startsAt
                  ? `${t("startLabel")}: ${new Date(contract.startsAt).toLocaleDateString()}`
                  : t("noStartDate")}
              </span>
              <span className="rounded-full border px-3 py-1">
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
                    <span key={item.capability.id} className="rounded-full border px-3 py-1 text-xs text-muted-foreground">
                      {item.capability.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="rounded-xl border bg-slate-50 p-4">
            <h2 className="text-sm font-semibold text-slate-900">{t("downloadableFiles")}</h2>
            <div className="mt-4 space-y-2 text-slate-600">
              {downloadableFiles.length > 0 ? (
                downloadableFiles.map(path => (
                  <a
                    key={path}
                    href={path}
                    download
                    className="flex items-center justify-between rounded-lg border bg-white px-3 py-3 text-sm hover:bg-slate-50"
                  >
                    <span className="truncate">{path.split("/").pop()}</span>
                    <span className="text-blue-600">{t("download")}</span>
                  </a>
                ))
              ) : (
                <p className="text-sm text-slate-700">{t("noFiles")}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {imageUrls.length > 1 && (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {imageUrls.slice(1).map(url => (
            <div key={url} className="overflow-hidden rounded-xl border bg-card">
              <img src={url} alt={contract.title} className="h-56 w-full object-cover" />
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <form onSubmit={submitBid} className="space-y-3 rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="text-base font-semibold">{t("bid.title")}</h2>
          <p className="text-xs text-muted-foreground">
            {t("bid.hint")}
          </p>
          <div className="space-y-1">
            <label className="block text-xs font-medium">{t("bid.amount")}</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
              value={bidAmount}
              onChange={e => setBidAmount(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium">{t("bid.message")}</label>
            <textarea
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
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
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
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

        <form onSubmit={submitComment} className="space-y-3 rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="text-base font-semibold">{t("comment.title")}</h2>
          <p className="text-xs text-muted-foreground">
            {t("comment.hint")}
          </p>
          <textarea
            className="mt-1 w-full rounded border px-3 py-2 text-sm"
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
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold">{t("bidsTitle")}</h2>
            {canViewBidDetails && bids.length >= 2 && (
              <Link
                href={`/${locale}/contracts/${id}/compare`}
                className="rounded-lg border bg-muted/50 px-3 py-2 text-sm font-medium hover:bg-muted"
              >
                {t("compareOffers")}
              </Link>
            )}
          </div>
          {!canViewBidDetails && bids.length > 0 && (
            <p className="mb-3 text-xs text-muted-foreground">{t("bidsPublicHint")}</p>
          )}
          <div className="space-y-2">
            {bids.map(b => (
              <div key={b.id} className="rounded-xl border bg-card p-3 text-sm shadow-sm">
                <p className="font-medium">{b.bidderName}</p>
                {canViewBidDetails && b.amount !== null && <p className="mt-1">{b.amount}</p>}
                {canViewBidDetails && b.message && <p className="text-xs text-muted-foreground">{b.message}</p>}
                {canViewBidDetails && b.documentUrl && (
                  <a
                    href={b.documentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex text-xs font-medium text-blue-600 hover:underline"
                  >
                    {t("bid.openDocument")}
                  </a>
                )}
              </div>
            ))}
            {bids.length === 0 && (
              <p className="text-xs text-muted-foreground">{t("noBids")}</p>
            )}
          </div>
        </div>
        <div>
          <h2 className="mb-3 text-base font-semibold">{t("commentsTitle")}</h2>
          <div className="space-y-2">
            {comments.map(c => (
              <div key={c.id} className="rounded-xl border bg-card p-3 text-sm shadow-sm">
                <p>{c.body}</p>
              </div>
            ))}
            {comments.length === 0 && (
              <p className="text-xs text-muted-foreground">{t("noComments")}</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

