"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { taxonomyLabel } from "@/lib/taxonomy-label";
import { uploadFileToStorage } from "@/lib/upload-client";

interface MainCategoryRow {
  id: string;
  slug: string;
  nameEn: string;
  nameTr: string;
}

export default function NewContractPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("contractCreate");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [totalDays, setTotalDays] = useState("");
  const [dwgFiles, setDwgFiles] = useState<FileList | null>(null);
  const [documentFiles, setDocumentFiles] = useState<FileList | null>(null);
  const [imageFiles, setImageFiles] = useState<FileList | null>(null);
  const [mainCategories, setMainCategories] = useState<MainCategoryRow[]>([]);
  const [selectedRequiredMainCategories, setSelectedRequiredMainCategories] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadMainCategories() {
      const res = await fetch("/api/subcontractor-main-categories");
      if (!res.ok) return;
      const data = await res.json();
      setMainCategories(data);
    }

    void loadMainCategories();
  }, []);

  function toggleRequiredMainCategory(id: string) {
    setSelectedRequiredMainCategories(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1) Check eligibility before uploading anything
      const eligibilityRes = await fetch("/api/contracts/eligibility");
      if (!eligibilityRes.ok) {
        const data = await eligibilityRes.json().catch(() => ({}));
        throw new Error(
          data.message ?? t("errors.eligibility")
        );
      }

      const uploadedPaths: string[] = [];
      if (dwgFiles && dwgFiles.length > 0) {
        for (const file of Array.from(dwgFiles)) {
          try {
            const data = await uploadFileToStorage(file, "dwg");
            uploadedPaths.push(data.url ?? data.key);
          } catch {
            throw new Error(t("errors.uploadDwg"));
          }
        }
      }

      const uploadedDocuments: string[] = [];
      if (documentFiles && documentFiles.length > 0) {
        for (const file of Array.from(documentFiles)) {
          try {
            const data = await uploadFileToStorage(file, "contract-documents");
            uploadedDocuments.push(data.url ?? data.key);
          } catch {
            throw new Error(t("errors.uploadDocuments"));
          }
        }
      }

      const uploadedImages: string[] = [];
      if (imageFiles && imageFiles.length > 0) {
        for (const file of Array.from(imageFiles)) {
          try {
            const data = await uploadFileToStorage(file, "contract-images");
            uploadedImages.push(data.url ?? data.key);
          } catch {
            throw new Error(t("errors.uploadImage"));
          }
        }
      }

      const res = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          startsAt: startsAt || undefined,
          totalDays: totalDays ? parseInt(totalDays, 10) : undefined,
          dwgFiles: uploadedPaths,
          documentUrls: uploadedDocuments.length > 0 ? uploadedDocuments : undefined,
          imageUrls: uploadedImages,
          requiredSubcontractorMainCategoryIds:
            selectedRequiredMainCategories.length > 0 ? selectedRequiredMainCategories : undefined
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message ?? t("errors.create"));
      }

      const created = await res.json();
      router.push(`/${locale}/contracts/${created.id}`);
    } catch (err: any) {
      setError(err.message ?? t("errors.generic"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="app-page-narrow">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">{t("title")}</h1>
      <form onSubmit={handleSubmit} className="app-card space-y-4 p-4 sm:p-6">
        <div className="space-y-1">
          <label className="block text-sm font-medium">{t("fields.title")}</label>
          <input
            className="mt-1 app-input"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium">{t("fields.description")}</label>
          <textarea
            className="mt-1 min-h-[8rem] app-input"
            rows={6}
            value={description}
            onChange={e => setDescription(e.target.value)}
            required
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="block text-sm font-medium">{t("fields.startDate")}</label>
            <input
              type="date"
              className="mt-1 app-input"
              value={startsAt}
              onChange={e => setStartsAt(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium">{t("fields.totalDays")}</label>
            <input
              type="number"
              min="1"
              className="mt-1 app-input"
              value={totalDays}
              onChange={e => setTotalDays(e.target.value)}
              placeholder={t("fields.totalDaysPlaceholder")}
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium">{t("fields.jobTradeBranch")}</label>
          <div className="app-inset mt-2 max-h-48 overflow-y-auto">
            <div className="grid gap-2 sm:grid-cols-2">
              {mainCategories.map(row => (
                <label key={row.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedRequiredMainCategories.includes(row.id)}
                    onChange={() => toggleRequiredMainCategory(row.id)}
                  />
                  <span>{taxonomyLabel(locale, row)}</span>
                </label>
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{t("fields.jobTradeBranchHint")}</p>
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium">{t("fields.dwgFiles")}</label>
          <input
            type="file"
            multiple
            accept=".dwg"
            onChange={e => setDwgFiles(e.target.files)}
            className="mt-1 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium">{t("fields.contractDocuments")}</label>
          <input
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,application/pdf"
            onChange={e => setDocumentFiles(e.target.files)}
            className="mt-1 text-sm"
          />
          <p className="text-xs text-muted-foreground">{t("fields.contractDocumentsHint")}</p>
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium">{t("fields.images")}</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={e => setImageFiles(e.target.files)}
            className="mt-1 text-sm"
          />
          <p className="text-xs text-muted-foreground">
            {t("fields.imagesHint")}
          </p>
        </div>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {loading ? t("creating") : t("submit")}
        </button>
      </form>
    </section>
  );
}

