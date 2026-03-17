"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";

interface ReferenceRequestItem {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  evidenceUrl: string | null;
  startsAt: string | null;
  completedAt: string | null;
  createdAt: string;
  owner: {
    id: string;
    userType: string | null;
  };
  ownerName: string;
}

export default function ReferenceRequestsPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("referenceRequests");
  const { data: session, status } = useSession();
  const userType = (session?.user as any)?.userType as string | undefined;
  const [items, setItems] = useState<ReferenceRequestItem[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/${locale}/auth/signin`);
    }
  }, [locale, router, status]);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/reference-requests");
      if (!res.ok) return;
      setItems(await res.json());
    }

    if (status === "authenticated" && ["CONTRACTOR", "SUBCONTRACTOR"].includes(userType ?? "")) {
      void load();
    }
  }, [status, userType]);

  async function updateRequest(id: string, action: "approve" | "reject") {
    const res = await fetch(`/api/reference-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        verifierNote: notes[id] || undefined
      })
    });

    if (!res.ok) {
      return;
    }

    setItems(prev => prev.filter(item => item.id !== id));
  }

  if (status === "loading" || !session) {
    return (
      <section className="mx-auto max-w-5xl px-4 py-8">
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      </section>
    );
  }

  if (!["CONTRACTOR", "SUBCONTRACTOR"].includes(userType ?? "")) {
    return (
      <section className="mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-xl border bg-card p-5 text-sm text-muted-foreground">{t("forbidden")}</div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("hint")}</p>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="space-y-4">
          {items.map(item => (
            <div key={item.id} className="rounded-xl border bg-card p-5 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{item.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("requestedBy")}: {item.ownerName}
                  </p>
                </div>
                <a
                  href={`/${locale}/company/${item.owner.id}`}
                  className="inline-flex items-center rounded-lg border px-4 py-2 text-sm hover:bg-muted"
                >
                  {t("openCompany")}
                </a>
              </div>

              {item.description && <p className="mt-3 text-sm text-muted-foreground">{item.description}</p>}

              <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                {item.location && <span>{item.location}</span>}
                {item.completedAt && <span>{new Date(item.completedAt).toLocaleDateString()}</span>}
              </div>

              {item.evidenceUrl && (
                <a href={item.evidenceUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-xs text-blue-600 hover:underline">
                  {t("openEvidence")}
                </a>
              )}

              <div className="mt-4">
                <label className="block text-sm font-medium">{t("noteLabel")}</label>
                <textarea
                  rows={3}
                  className="mt-1 w-full rounded border px-3 py-2 text-sm"
                  value={notes[item.id] ?? ""}
                  onChange={e => setNotes(prev => ({ ...prev, [item.id]: e.target.value }))}
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
                  onClick={() => void updateRequest(item.id, "approve")}
                >
                  {t("approve")}
                </button>
                <button
                  type="button"
                  className="rounded-lg border px-4 py-2 text-sm font-medium text-red-600"
                  onClick={() => void updateRequest(item.id, "reject")}
                >
                  {t("reject")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
