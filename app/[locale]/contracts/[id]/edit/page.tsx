"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { UploadProgressBar } from "@/components/UploadProgressBar";
import { ContractLocationFields } from "@/components/contract-location-fields";
import { uploadFileToStorage, type UploadFolder } from "@/lib/upload-client";

function fileLabel(path: string) {
  try {
    const tail = path.split("/").pop() || path;
    return decodeURIComponent(tail);
  } catch {
    return path.split("/").pop() || path;
  }
}

export default function EditContractPage() {
  const params = useParams();
  const id = params?.id as string;
  const locale = useLocale();
  const router = useRouter();
  const { data: session, status } = useSession();
  const t = useTranslations("contractEdit");
  const tDetail = useTranslations("contractDetail");
  const tUpload = useTranslations("upload");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [totalDays, setTotalDays] = useState("");
  const [contractStatus, setContractStatus] = useState<string>("DRAFT");
  const [existingDwgUrls, setExistingDwgUrls] = useState<string[]>([]);
  const [existingDocumentUrls, setExistingDocumentUrls] = useState<string[]>([]);
  const [newDwgFiles, setNewDwgFiles] = useState<FileList | null>(null);
  const [newDocumentFiles, setNewDocumentFiles] = useState<FileList | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [cityId, setCityId] = useState("");
  const [districtId, setDistrictId] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/${locale}/auth/signin`);
    }
  }, [status, router, locale]);

  useEffect(() => {
    if (status !== "authenticated" || !id) return;
    const userType = (session?.user as { userType?: string })?.userType;
    if (userType && userType !== "CONTRACTOR") {
      router.replace(`/${locale}/contracts/mine`);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/contracts/${id}`);
        if (!res.ok) {
          if (!cancelled) setError(t("errors.load"));
          return;
        }
        const data = await res.json();
        const c = data.contract as {
          contractorId: string;
          title: string;
          description: string | null;
          startsAt: string | null;
          totalDays: number | null;
          status: string;
          dwgFiles: string | null;
          documentUrls: string | null;
          cityId: string | null;
          districtId: string | null;
        };
        const uid = (session?.user as { id?: string })?.id;
        if (!uid) return;
        if (c.contractorId !== uid) {
          router.replace(`/${locale}/contracts/mine`);
          return;
        }
        if (cancelled) return;
        setError(null);
        setTitle(c.title ?? "");
        setDescription(c.description ?? "");
        setStartsAt(c.startsAt ? new Date(c.startsAt).toISOString().slice(0, 10) : "");
        setTotalDays(c.totalDays != null ? String(c.totalDays) : "");
        setContractStatus(c.status ?? "DRAFT");
        setExistingDwgUrls(c.dwgFiles?.split(";").filter(Boolean) ?? []);
        setExistingDocumentUrls(c.documentUrls?.split(";").filter(Boolean) ?? []);
        setCityId(c.cityId ?? "");
        setDistrictId(c.districtId ?? "");
      } catch {
        if (!cancelled) setError(t("errors.load"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [status, id, session, locale, router, t]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    setUploadProgress(null);
    try {
      type Job = { file: File; folder: UploadFolder };
      const jobs: Job[] = [];
      if (newDwgFiles?.length) {
        for (const file of Array.from(newDwgFiles)) jobs.push({ file, folder: "dwg" });
      }
      if (newDocumentFiles?.length) {
        for (const file of Array.from(newDocumentFiles)) jobs.push({ file, folder: "contract-documents" });
      }

      const appendDwgUrls: string[] = [];
      const appendDocumentUrls: string[] = [];

      const totalBytes = jobs.reduce((s, j) => s + j.file.size, 0) || 1;
      let doneBytes = 0;

      if (jobs.length > 0) {
        setUploadProgress(0);
      }

      for (const job of jobs) {
        const startBytes = doneBytes;
        let data: { url: string; key: string };
        try {
          data = await uploadFileToStorage(job.file, job.folder, {
            onProgress: p => {
              const overall = ((startBytes + (p / 100) * job.file.size) / totalBytes) * 100;
              setUploadProgress(overall);
            }
          });
        } catch {
          if (job.folder === "dwg") throw new Error(t("errors.uploadDwg"));
          throw new Error(t("errors.uploadDocuments"));
        }
        const url = data.url ?? data.key;
        if (job.folder === "dwg") appendDwgUrls.push(url);
        else appendDocumentUrls.push(url);
        doneBytes += job.file.size;
      }

      setUploadProgress(null);

      const res = await fetch(`/api/contracts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          cityId,
          districtId,
          startsAt: startsAt || null,
          totalDays: totalDays ? parseInt(totalDays, 10) : null,
          status: contractStatus,
          ...(appendDwgUrls.length > 0 ? { appendDwgUrls } : {}),
          ...(appendDocumentUrls.length > 0 ? { appendDocumentUrls } : {})
        })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data.message as string) ?? t("errors.save"));
        return;
      }
      router.push(`/${locale}/contracts/${id}`);
    } catch {
      setError(t("errors.save"));
    } finally {
      setUploadProgress(null);
      setSaving(false);
    }
  }

  if (status === "loading" || !session) {
    return (
      <section className="app-page-narrow">
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="app-page-narrow">
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      </section>
    );
  }

  if (error && !title) {
    return (
      <section className="app-page-narrow">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        <Link href={`/${locale}/contracts/mine`} className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
          {t("back")}
        </Link>
      </section>
    );
  }

  return (
    <section className="app-page-narrow">
      <div className="mb-6">
        <Link
          href={`/${locale}/contracts/mine`}
          className="text-sm font-medium text-primary hover:underline"
        >
          ← {t("back")}
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">{t("title")}</h1>
      </div>

      <form onSubmit={handleSubmit} className="app-card space-y-4 p-4 sm:p-6">
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
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
        <ContractLocationFields
          cityId={cityId}
          districtId={districtId}
          onCityChange={setCityId}
          onDistrictChange={setDistrictId}
          disabled={saving}
        />
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
              placeholder="30"
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium">{t("fields.status")}</label>
          <select
            className="mt-1 app-input"
            value={contractStatus}
            onChange={e => setContractStatus(e.target.value)}
          >
            <option value="DRAFT">{tDetail("statuses.DRAFT")}</option>
            <option value="OPEN_FOR_BIDS">{tDetail("statuses.OPEN_FOR_BIDS")}</option>
            <option value="ACTIVE">{tDetail("statuses.ACTIVE")}</option>
            <option value="COMPLETED">{tDetail("statuses.COMPLETED")}</option>
            <option value="CANCELLED">{tDetail("statuses.CANCELLED")}</option>
          </select>
          <p className="mt-1 text-xs text-muted-foreground">{t("statusHint")}</p>
        </div>

        <div className="app-inset space-y-4 border-t border-border/60 pt-4">
          {(existingDwgUrls.length > 0 || existingDocumentUrls.length > 0) && (
            <div className="space-y-3 text-sm">
              {existingDwgUrls.length > 0 && (
                <div>
                  <p className="mb-1 font-medium">{t("existingDwgFiles")}</p>
                  <ul className="space-y-1 text-muted-foreground">
                    {existingDwgUrls.map(url => (
                      <li key={url}>
                        <a href={url} target="_blank" rel="noreferrer" className="text-primary underline">
                          {fileLabel(url)}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {existingDocumentUrls.length > 0 && (
                <div>
                  <p className="mb-1 font-medium">{t("existingDocuments")}</p>
                  <ul className="space-y-1 text-muted-foreground">
                    {existingDocumentUrls.map(url => (
                      <li key={url}>
                        <a href={url} target="_blank" rel="noreferrer" className="text-primary underline">
                          {fileLabel(url)}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          <div className="space-y-1">
            <label className="block text-sm font-medium">{t("addDwgFiles")}</label>
            <input
              type="file"
              multiple
              accept=".dwg"
              onChange={e => setNewDwgFiles(e.target.files)}
              className="mt-1 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium">{t("addContractDocuments")}</label>
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,application/pdf"
              onChange={e => setNewDocumentFiles(e.target.files)}
              className="mt-1 text-sm"
            />
          </div>
          <p className="text-xs text-muted-foreground">{t("addFilesHint")}</p>
        </div>

        {uploadProgress !== null && (
          <UploadProgressBar progress={uploadProgress} label={tUpload("progress")} />
        )}

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-60"
          >
            {saving ? t("saving") : t("save")}
          </button>
          <Link
            href={`/${locale}/contracts/${id}`}
            className="inline-flex items-center rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            {t("back")}
          </Link>
        </div>
      </form>
    </section>
  );
}
