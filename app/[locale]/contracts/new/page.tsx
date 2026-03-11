"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

export default function NewContractPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("contractCreate");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [totalDays, setTotalDays] = useState("");
  const [dwgFiles, setDwgFiles] = useState<FileList | null>(null);
  const [imageFiles, setImageFiles] = useState<FileList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
          const fd = new FormData();
          fd.append("file", file);
          fd.append("folder", "dwg");
          const res = await fetch("/api/upload", { method: "POST", body: fd });
          if (!res.ok) {
            throw new Error(t("errors.uploadDwg"));
          }
          const data = await res.json();
          uploadedPaths.push(data.url ?? data.key);
        }
      }

      const uploadedImages: string[] = [];
      if (imageFiles && imageFiles.length > 0) {
        for (const file of Array.from(imageFiles)) {
          const fd = new FormData();
          fd.append("file", file);
          fd.append("folder", "contract-images");
          const res = await fetch("/api/upload", { method: "POST", body: fd });
          if (!res.ok) {
            throw new Error(t("errors.uploadImage"));
          }
          const data = await res.json();
          uploadedImages.push(data.url ?? data.key);
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
          imageUrls: uploadedImages
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
    <section className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-semibold">{t("title")}</h1>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-card p-4">
        <div className="space-y-1">
          <label className="block text-sm font-medium">{t("fields.title")}</label>
          <input
            className="mt-1 w-full rounded border px-3 py-2 text-sm"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium">{t("fields.description")}</label>
          <textarea
            className="mt-1 w-full rounded border px-3 py-2 text-sm"
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
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
              value={startsAt}
              onChange={e => setStartsAt(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium">{t("fields.totalDays")}</label>
            <input
              type="number"
              min="1"
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
              value={totalDays}
              onChange={e => setTotalDays(e.target.value)}
              placeholder={t("fields.totalDaysPlaceholder")}
            />
          </div>
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
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {loading ? t("creating") : t("submit")}
        </button>
      </form>
    </section>
  );
}

