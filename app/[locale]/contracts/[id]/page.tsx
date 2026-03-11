"use client";

import { useEffect, useState, FormEvent } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

interface Contract {
  id: string;
  title: string;
  description: string;
  dwgFiles: string | null;
  imageUrls?: string | null;
  startsAt?: string | null;
  totalDays?: number | null;
}

interface Bid {
  id: string;
  amount: number;
  message?: string | null;
}

interface Comment {
  id: string;
  body: string;
}

export default function ContractDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const t = useTranslations("contractDetail");

  const [contract, setContract] = useState<Contract | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [downloadableFiles, setDownloadableFiles] = useState<string[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [bidAmount, setBidAmount] = useState("");
  const [bidMessage, setBidMessage] = useState("");
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
    }
    if (id) {
      void load();
    }
  }, [id]);

  async function submitBid(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch(`/api/contracts/${id}/bids`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: parseFloat(bidAmount), message: bidMessage || undefined })
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
          <button
            type="submit"
            className="w-full rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground sm:w-auto"
          >
            {t("bid.submit")}
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
          <h2 className="mb-3 text-base font-semibold">{t("bidsTitle")}</h2>
          <div className="space-y-2">
            {bids.map(b => (
              <div key={b.id} className="rounded-xl border bg-card p-3 text-sm shadow-sm">
                <p className="font-medium">{b.amount}</p>
                {b.message && <p className="text-xs text-muted-foreground">{b.message}</p>}
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

