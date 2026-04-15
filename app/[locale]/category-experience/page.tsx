"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { uploadFileToStorage } from "@/lib/upload-client";

const ALLOWED_TYPES = new Set(["CONTRACTOR", "SUBCONTRACTOR", "TEAM"]);

interface MainCategoryOption {
  id: string;
  slug: string;
  nameEn: string;
  nameTr: string;
}

interface CategoryRequestItem {
  id: string;
  mainCategoryId: string;
  documentUrls: string;
  applicantNote: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewerNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  mainCategory: MainCategoryOption;
}

export default function CategoryExperiencePage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("categoryExperience");
  const { data: session, status } = useSession();
  const userType = (session?.user as { userType?: string } | undefined)?.userType;

  const [categories, setCategories] = useState<MainCategoryOption[]>([]);
  const [requests, setRequests] = useState<CategoryRequestItem[]>([]);
  const [mainCategoryId, setMainCategoryId] = useState("");
  const [applicantNote, setApplicantNote] = useState("");
  const [documentUrls, setDocumentUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/${locale}/auth/signin`);
    }
  }, [locale, router, status]);

  useEffect(() => {
    async function load() {
      const [catRes, reqRes] = await Promise.all([
        fetch("/api/subcontractor-main-categories"),
        fetch("/api/category-experience-requests")
      ]);
      if (catRes.ok) {
        setCategories(await catRes.json());
      }
      if (reqRes.ok) {
        setRequests(await reqRes.json());
      }
    }
    if (status === "authenticated") {
      void load();
    }
  }, [status]);

  function categoryLabel(c: MainCategoryOption) {
    return locale === "tr" ? c.nameTr : c.nameEn;
  }

  async function handleFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    setUploading(true);
    setMessage(null);
    try {
      const next: string[] = [];
      for (const file of Array.from(fileList)) {
        const data = await uploadFileToStorage(file, "category-experience-evidence");
        const url = data.url ?? data.key;
        if (!url) throw new Error(t("error"));
        next.push(url);
      }
      setDocumentUrls(prev => [...prev, ...next]);
    } catch (e: unknown) {
      setMessage((e as Error).message ?? t("error"));
    } finally {
      setUploading(false);
    }
  }

  function removeUrl(index: number) {
    setDocumentUrls(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (!mainCategoryId) {
      setMessage(t("validationCategory"));
      return;
    }
    if (documentUrls.length === 0) {
      setMessage(t("validationFiles"));
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/category-experience-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mainCategoryId,
        documentUrls,
        applicantNote: applicantNote.trim() || undefined
      })
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const msg = (data as { message?: string }).message ?? "";
      if (msg.toLowerCase().includes("pending")) {
        setMessage(t("pendingExists"));
      } else {
        setMessage(msg || t("error"));
      }
      return;
    }

    const created = (await res.json()) as CategoryRequestItem;
    setRequests(prev => [created, ...prev]);
    setMainCategoryId("");
    setApplicantNote("");
    setDocumentUrls([]);
    setMessage(t("success"));
  }

  if (status === "loading" || !session) {
    return (
      <section className="app-page">
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      </section>
    );
  }

  if (!userType || !ALLOWED_TYPES.has(userType)) {
    return (
      <section className="app-page">
        <p className="text-sm text-muted-foreground">{t("forbidden")}</p>
      </section>
    );
  }

  return (
    <section className="app-page space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>
      </div>

      <form onSubmit={handleSubmit} className="app-card space-y-4 p-5 sm:p-6">
        <div>
          <label className="block text-sm font-medium">{t("mainCategory")}</label>
          <select
            className="mt-1 app-input"
            value={mainCategoryId}
            onChange={e => setMainCategoryId(e.target.value)}
            required
          >
            <option value="">{t("selectCategory")}</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>
                {categoryLabel(c)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">{t("documents")}</label>
          <input
            type="file"
            multiple
            className="mt-1 text-sm"
            disabled={uploading}
            onChange={e => void handleFiles(e.target.files)}
          />
          <p className="mt-1 text-xs text-muted-foreground">{t("documentsHint")}</p>
          {documentUrls.length > 0 && (
            <ul className="mt-2 space-y-1 text-sm">
              {documentUrls.map((url, i) => (
                <li key={`${url}-${i}`} className="flex flex-wrap items-center gap-2">
                  <a href={url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                    {url.split("/").pop() || url}
                  </a>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => removeUrl(i)}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium">{t("applicantNote")}</label>
          <textarea
            className="mt-1 min-h-[4rem] app-input"
            rows={3}
            value={applicantNote}
            onChange={e => setApplicantNote(e.target.value)}
          />
        </div>

        {message && <p className="text-sm text-muted-foreground">{message}</p>}

        <button
          type="submit"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
          disabled={submitting || uploading}
        >
          {submitting ? t("submitting") : t("submit")}
        </button>
      </form>

      <div>
        <h2 className="text-lg font-semibold">{t("requestsTitle")}</h2>
        {requests.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">{t("emptyRequests")}</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {requests.map(r => (
              <li key={r.id} className="app-card space-y-2 p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium">{categoryLabel(r.mainCategory)}</span>
                  <span className="text-sm text-muted-foreground">
                    {t(`status.${r.status}`)}
                  </span>
                </div>
                {r.applicantNote && (
                  <p className="text-sm text-muted-foreground">{r.applicantNote}</p>
                )}
                <div className="text-xs text-muted-foreground">
                  {r.documentUrls.split(";").filter(Boolean).map(url => (
                    <div key={url}>
                      <a href={url.trim()} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                        {url.trim().split("/").pop()}
                      </a>
                    </div>
                  ))}
                </div>
                {r.reviewedAt && (
                  <p className="text-xs text-muted-foreground">
                    {t("reviewedAt")}: {new Date(r.reviewedAt).toLocaleString()}
                  </p>
                )}
                {r.reviewerNote && (
                  <p className="text-xs">
                    <span className="font-medium">{t("reviewerNote")}:</span> {r.reviewerNote}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
