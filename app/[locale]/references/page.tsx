"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";

interface VerifierOption {
  id: string;
  companyName: string | null;
  email: string;
}

interface ReferenceItem {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  evidenceUrl: string | null;
  status: "PENDING" | "VERIFIED" | "REJECTED";
  verifierNote: string | null;
  startsAt: string | null;
  completedAt: string | null;
  createdAt: string;
  verifierName?: string | null;
}

export default function ReferencesPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("references");
  const { data: session, status } = useSession();
  const userType = (session?.user as any)?.userType as string | undefined;
  const [items, setItems] = useState<ReferenceItem[]>([]);
  const [verifiers, setVerifiers] = useState<VerifierOption[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    startsAt: "",
    completedAt: "",
    evidenceUrl: "",
    verifierId: ""
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/${locale}/auth/signin`);
    }
  }, [locale, router, status]);

  useEffect(() => {
    async function load() {
      const [referencesRes, verifierRes] = await Promise.all([
        fetch("/api/references"),
        userType === "SUBCONTRACTOR"
          ? fetch("/api/directory?type=CONTRACTOR")
          : userType === "TEAM"
            ? fetch("/api/directory?type=SUBCONTRACTOR")
            : Promise.resolve(null)
      ]);

      if (referencesRes.ok) {
        setItems(await referencesRes.json());
      }

      if (verifierRes && verifierRes.ok) {
        setVerifiers(await verifierRes.json());
      }
    }

    if (status === "authenticated") {
      void load();
    }
  }, [status, userType]);

  async function handleEvidenceUpload(fileList: FileList | null) {
    if (!fileList?.length) return;

    setUploading(true);
    setMessage(null);

    try {
      const fd = new FormData();
      fd.append("file", fileList[0]);
      fd.append("folder", "reference-evidence");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: fd
      });

      if (!res.ok) {
        throw new Error(t("messages.uploadFailed"));
      }

      const data = await res.json();
      const url = data.url ?? data.key;
      if (!url) {
        throw new Error(t("messages.uploadFailed"));
      }

      setForm(prev => ({ ...prev, evidenceUrl: url }));
    } catch (error: any) {
      setMessage(error.message ?? t("messages.uploadFailed"));
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const res = await fetch("/api/references", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        startsAt: form.startsAt || undefined,
        completedAt: form.completedAt || undefined,
        verifierId: form.verifierId || undefined
      })
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMessage(data.message ?? t("messages.saveFailed"));
      return;
    }

    const created = await res.json();
    setItems(prev => [created, ...prev]);
    setForm({
      title: "",
      description: "",
      location: "",
      startsAt: "",
      completedAt: "",
      evidenceUrl: "",
      verifierId: ""
    });
    setMessage(t("messages.saved"));
  }

  if (status === "loading" || !session) {
    return (
      <section className="app-page">
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      </section>
    );
  }

  return (
    <section className="app-page space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("hint")}</p>
      </div>

      <form onSubmit={handleSubmit} className="app-card space-y-4 p-5 sm:p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">{t("fields.title")}</label>
            <input
              className="mt-1 app-input"
              value={form.title}
              onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">{t("fields.location")}</label>
            <input
              className="mt-1 app-input"
              value={form.location}
              onChange={e => setForm(prev => ({ ...prev, location: e.target.value }))}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">{t("fields.description")}</label>
          <textarea
            className="mt-1 min-h-[5rem] app-input"
            rows={4}
            value={form.description}
            onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">{t("fields.startDate")}</label>
            <input
              type="date"
              className="mt-1 app-input"
              value={form.startsAt}
              onChange={e => setForm(prev => ({ ...prev, startsAt: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">{t("fields.completedAt")}</label>
            <input
              type="date"
              className="mt-1 app-input"
              value={form.completedAt}
              onChange={e => setForm(prev => ({ ...prev, completedAt: e.target.value }))}
            />
          </div>
        </div>

        {(userType === "SUBCONTRACTOR" || userType === "TEAM") && (
          <div>
            <label className="block text-sm font-medium">{t("fields.verifier")}</label>
            <select
              className="mt-1 app-input"
              value={form.verifierId}
              onChange={e => setForm(prev => ({ ...prev, verifierId: e.target.value }))}
              required
            >
              <option value="">{t("fields.selectVerifier")}</option>
              {verifiers.map(verifier => (
                <option key={verifier.id} value={verifier.id}>
                  {verifier.companyName || verifier.email}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium">{t("fields.evidence")}</label>
          <input type="file" className="mt-1 text-sm" onChange={e => void handleEvidenceUpload(e.target.files)} />
          <p className="mt-1 text-xs text-muted-foreground">{t("fields.evidenceHint")}</p>
          {form.evidenceUrl && (
            <a href={form.evidenceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-xs font-medium text-primary hover:underline">
              {t("fields.openEvidence")}
            </a>
          )}
        </div>

        {message && <p className="text-sm text-muted-foreground">{message}</p>}

        <button
          type="submit"
          disabled={submitting || uploading}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {submitting ? t("actions.saving") : t("actions.save")}
        </button>
      </form>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">{t("listTitle")}</h2>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          items.map(item => (
            <div key={item.id} className="app-card-sm p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-semibold">{item.title}</h3>
                  {item.description && <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>}
                </div>
                <span className="rounded-full border px-3 py-1 text-xs">{t(`statuses.${item.status}`)}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                {item.location && <span>{item.location}</span>}
                {item.completedAt && <span>{new Date(item.completedAt).toLocaleDateString()}</span>}
                {item.verifierName && <span>{t("verifiedBy")}: {item.verifierName}</span>}
              </div>
              {item.verifierNote && <p className="mt-2 text-xs text-muted-foreground">{item.verifierNote}</p>}
              {item.evidenceUrl && (
                <a href={item.evidenceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-xs font-medium text-primary hover:underline">
                  {t("fields.openEvidence")}
                </a>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
